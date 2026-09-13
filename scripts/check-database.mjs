import { createClient } from '@supabase/supabase-js'

// Read-only schema readiness check; never prints credentials or customer records.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Load the Supabase environment variables before running this check.')
const client = createClient(url, key, {auth:{persistSession:false,autoRefreshToken:false}})
let failed = false
for (const [table, columns] of Object.entries({
  categories:'id,name,image_url,is_active',
  products:'id,category_id,pricing_mode,piece_rate,weight_grams,making_charge,stock_pcs,stock_grams,is_active',
  silver_rates:'effective_date,rate_per_gram',
  profiles:'id,full_name,phone',
  orders:'id,user_id,status,payment_status,delivery_address,razorpay_order_id,razorpay_payment_id,paid_at',
  order_items:'order_id,product_id,product_name,unit_price,qty',
  payment_webhook_events:'event_id,event_type',
})) {
  const { error } = await client.from(table).select(columns).limit(0)
  console.log(`${table}: ${error ? `FAILED (${error.code || 'connection error'})` : 'ready'}`)
  failed ||= !!error
}
const response = await fetch(`${url}/rest/v1/`, {headers:{apikey:key,Authorization:`Bearer ${key}`,Accept:'application/openapi+json'}})
if (response.ok) {
  const schema = await response.json()
  const installed = !!schema.paths?.['/rpc/fulfill_paid_order']
  console.log(`Atomic payment fulfilment: ${installed ? 'ready' : 'migration required'}`)
  failed ||= !installed
} else { console.log('Payment function inspection unavailable'); failed=true }
process.exitCode = failed ? 1 : 0
