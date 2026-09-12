-- Category photographs and weight / per-piece pricing. Preserves all existing rows.
begin;
alter table public.categories add column if not exists image_url text;
do $$ begin
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='categories' and column_name='slug') then
  alter table public.categories alter column slug set default gen_random_uuid()::text;
 end if;
end $$;
alter table public.products add column if not exists pricing_mode text not null default 'weight';
alter table public.products add column if not exists piece_rate numeric(12,2) not null default 0;
alter table public.products drop constraint if exists products_weight_grams_check;
alter table public.products add constraint products_weight_grams_check check ((pricing_mode='weight' and weight_grams>0) or (pricing_mode='piece' and weight_grams=0));
alter table public.products drop constraint if exists products_piece_rate_check;
alter table public.products add constraint products_piece_rate_check check (piece_rate>=0 and (pricing_mode<>'piece' or piece_rate>0));
-- Existing paid-order fulfillment can accept zero-weight, piece-priced lines.
do $$ declare definition text; begin
 if to_regprocedure('public.fulfill_paid_order(uuid,text,text,bigint)') is not null then
  select pg_get_functiondef(to_regprocedure('public.fulfill_paid_order(uuid,text,text,bigint)')) into definition;
  execute replace(definition,'weight_grams <= 0','weight_grams < 0');
 end if;
end $$;
notify pgrst, 'reload schema';
commit;
