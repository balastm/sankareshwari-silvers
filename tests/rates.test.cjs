const test = require('node:test')
const assert = require('node:assert/strict')
const { loadModule } = require('./load-module.cjs')
function setup(unauthorized = false, failure = false) {
  const writes = [], invalidations = []
  const query = { insert(data) { writes.push(data); return this }, update(data) { writes.push(data); return this }, eq() { return this }, delete() { return this }, then(resolve) { return Promise.resolve({ error: failure ? {message:'Database unavailable'} : null }).then(resolve) } }
  const actions = loadModule('app/admin/actions.ts', {
    '@/lib/admin': { requireAdmin: async () => { if (unauthorized) throw new Error('Unauthorized') } },
    '@/lib/supabase/server': { createAdminClient: () => ({ from: () => query }) },
    'next/cache': { revalidatePath: path => invalidations.push(path) },
    'next/navigation': { redirect: path => { throw new Error(`Redirect:${path}`) } },
  })
  return { ...actions, writes, invalidations }
}
function form(rate, date = '2026-09-13') { const f = new FormData(); f.set('rate_per_gram', rate); f.set('effective_date', date); return f }
test('rate writes require an administrator', async () => { const a = setup(true); await assert.rejects(a.saveRate(form('120')), /Unauthorized/); assert.equal(a.writes.length, 0) })
test('invalid rates and impossible dates never reach storage', async () => {
  const a = setup()
  for (const value of ['0', '-1', 'Infinity', 'NaN', '1.234', '1000001', '']) await assert.rejects(a.saveRate(form(value)))
  for (const date of ['2026-02-30', 'invalid', '']) await assert.rejects(a.saveRate(form('120',date)))
  assert.equal(a.writes.length, 0)
})
test('saving a valid rate refreshes storefront and admin', async () => { const a = setup(); await assert.rejects(a.saveRate(form('120.25')), /Redirect/); assert.equal(a.writes[0].rate_per_gram,120.25); assert.deepEqual(a.invalidations,['/admin/rates','/']) })
test('failed saves do not signal success', async () => { const a = setup(false,true); await assert.rejects(a.saveRate(form('120')), /Database unavailable/); assert.deepEqual(a.invalidations,[]) })
test('deleting a rate refreshes the public price', async () => { const a = setup(); const f = new FormData(); f.set('id','test-id'); await a.deleteRate(f); assert.deepEqual(a.invalidations,['/admin/rates','/']) })
