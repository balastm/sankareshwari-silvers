const test = require('node:test')
const assert = require('node:assert/strict')
const { loadModule } = require('./load-module.cjs')
const { orderStatusError } = loadModule('lib/order-status.ts')
const { validateProfile } = loadModule('lib/profile.ts')

test('unpaid orders cannot enter fulfilment and paid orders require refund review', () => {
  assert.match(orderStatusError('pending', 'shipped', 'pending'), /Payment/)
  assert.match(orderStatusError('confirmed', 'cancelled', 'paid'), /refund/)
  assert.equal(orderStatusError('pending', 'cancelled', 'failed'), null)
})
test('fulfilment moves forward one stage and terminal orders stay terminal', () => {
  assert.equal(orderStatusError('confirmed', 'processing', 'paid'), null)
  assert.equal(orderStatusError('processing', 'shipped', 'paid'), null)
  assert.equal(orderStatusError('shipped', 'delivered', 'paid'), null)
  assert.match(orderStatusError('confirmed', 'delivered', 'paid'), /next/)
  assert.match(orderStatusError('delivered', 'processing', 'paid'), /cannot/)
  assert.match(orderStatusError('cancelled', 'confirmed', 'paid'), /cannot/)
  assert.match(orderStatusError('pending', 'arbitrary', 'paid'), /valid/)
})
test('profile validation rejects invalid values and trims optional contact details', () => {
  const fd = new FormData()
  assert.match(validateProfile(fd).error, /name/)
  fd.set('full_name',' Customer ')
  fd.set('phone','invalid')
  assert.match(validateProfile(fd).error, /phone/)
  fd.set('phone',' +91 98765 43210 ')
  assert.deepEqual(validateProfile(fd).values,{full_name:'Customer',phone:'+91 98765 43210'})
  fd.set('phone','')
  assert.equal(validateProfile(fd).values.phone,'')
})
function profileAction(user, writeError = null) {
  const writes = []
  const { saveProfile } = loadModule('app/account/actions.ts', {
    'next/cache': { revalidatePath() {} },
    '@/lib/supabase/server': {
      createClient: async () => ({ auth: { getUser: async () => ({data:{user}}) } }),
      createAdminClient: () => ({from: () => ({upsert: async values => {writes.push(values);return {error:writeError}}})}),
    },
  })
  return {saveProfile,writes}
}
test('profile saving rejects unauthenticated requests before any write', async () => {
  const {saveProfile,writes}=profileAction(null)
  const result=await saveProfile({},new FormData())
  assert.match(result.error,/sign in/)
  assert.equal(writes.length,0)
})
test('profile saving binds identity to session and ignores forged IDs', async () => {
  const {saveProfile,writes}=profileAction({id:'real-user'})
  const fd=new FormData()
  fd.set('full_name','Customer');fd.set('id','other-user')
  assert.deepEqual(await saveProfile({},fd),{success:true})
  assert.equal(writes[0].id,'real-user')
})
test('profile saving reports database failures without success', async () => {
  const {saveProfile}=profileAction({id:'real-user'},{message:'Database unavailable'})
  const fd=new FormData();fd.set('full_name','Customer')
  assert.match((await saveProfile({},fd)).error,/could not be saved/)
})

test('checkout readiness refuses missing payment functions before payment creation', async () => {
  const {assertPaymentFulfillment}=loadModule('lib/payments.ts',{'./supabase/server':{}})
  await assert.rejects(assertPaymentFulfillment({rpc:async()=>({error:{code:'PGRST202',message:'Function not found'}})}),/temporarily unavailable/)
  await assertPaymentFulfillment({rpc:async(_name,args)=>{
    assert.equal(args.p_amount_paise,0)
    assert.equal(args.p_payment_id,'')
    return {error:{code:'22023',message:'Invalid payment details'}}
  }})
})
