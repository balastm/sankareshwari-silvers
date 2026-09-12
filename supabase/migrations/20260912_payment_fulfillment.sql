begin;

alter table public.payment_webhook_events enable row level security;

-- A single transaction shared by browser verification and webhook retries.
-- Only the existing server-side service role may execute this function.
create or replace function public.fulfill_paid_order(
  p_order_id uuid,
  p_razorpay_order_id text,
  p_payment_id text,
  p_amount_paise bigint
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_order public.orders%rowtype;
  item record;
  product public.products%rowtype;
begin
  if p_payment_id is null or p_payment_id !~ '^pay_[a-zA-Z0-9]+$'
    or p_razorpay_order_id is null or p_amount_paise is null or p_amount_paise <= 0 then
    raise exception 'Invalid payment details' using errcode = '22023';
  end if;
  select * into saved_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found' using errcode = '22023'; end if;
  if saved_order.razorpay_order_id is distinct from p_razorpay_order_id
    or round(saved_order.total_amount * 100) <> p_amount_paise then
    raise exception 'Payment does not match order' using errcode = '22023';
  end if;
  if saved_order.payment_status = 'paid' then
    if saved_order.razorpay_payment_id is distinct from p_payment_id then
      raise exception 'Order has a different payment' using errcode = '22023';
    end if;
    return;
  end if;
  if not exists (select 1 from public.order_items where order_id = p_order_id)
    or exists (select 1 from public.order_items where order_id = p_order_id and (product_id is null or qty <= 0 or weight_grams < 0)) then
    raise exception 'Order has unavailable items' using errcode = '22023';
  end if;
  -- A stable lock order also prevents deadlocks between different orders.
  for item in
    select product_id, sum(qty) as quantity, sum(weight_grams * qty) as grams
    from public.order_items where order_id = p_order_id
    group by product_id order by product_id
  loop
    select * into product from public.products where id = item.product_id for update;
    if not found or product.stock_pcs < item.quantity or product.stock_grams < item.grams then
      raise exception 'Insufficient stock; payment needs store review' using errcode = '22023';
    end if;
    update public.products
    set stock_pcs = stock_pcs - item.quantity, stock_grams = stock_grams - item.grams, updated_at = now()
    where id = item.product_id;
  end loop;
  update public.orders
  set payment_status = 'paid', status = 'confirmed', razorpay_payment_id = p_payment_id, paid_at = now()
  where id = p_order_id;
end;
$$;

revoke all on function public.fulfill_paid_order(uuid, text, text, bigint) from public, anon, authenticated;
grant execute on function public.fulfill_paid_order(uuid, text, text, bigint) to service_role;

commit;

