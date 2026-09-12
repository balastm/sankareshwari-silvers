const test = require('node:test')
const assert = require('node:assert/strict')
const { loadModule } = require('./load-module.cjs')
const { validateProduct, productPrice, isOutOfStock } = loadModule('lib/products.ts')
const { parseProductFilters, productListUrl, productSearchPattern } = loadModule('lib/product-search.ts')
const PRODUCT_ID = '11111111-1111-4111-8111-111111111111'
const CATEGORY_ID = '22222222-2222-4222-8222-222222222222'

function form(overrides = {}) {
  const fd = new FormData()
  for (const [key, value] of Object.entries({ category_id: CATEGORY_ID, name: ' Silver ring ', code: ' R001 ', weight_grams: '4.250', making_charge: '0', stock_pcs: '0', stock_grams: '0', is_active: 'on', ...overrides })) fd.set(key, value)
  return fd
}

function actions(options = {}) {
  const calls = []
  const client = {
    from(table) {
      let operation = 'read'
      return {
        select() { return this }, eq() { return this },
        update(data) { operation = 'update'; calls.push({ operation, table, data }); return this },
        insert(data) { operation = 'insert'; calls.push({ operation, table, data }); return this },
        delete() { operation = 'delete'; calls.push({ operation, table }); return this },
        async maybeSingle() { return operation === 'read' ? { data: options.missing ? null : { image_url: 'https://store.test/existing.jpg' }, error: null } : this.single() },
        async single() { return { data: options.writeError ? null : { id: PRODUCT_ID }, error: options.writeError ?? null } },
      }
    },
    storage: { from() { return {
      async upload(path, file) { calls.push({ operation: 'upload', path, file }); return { error: options.uploadError ?? null } },
      getPublicUrl(path) { return { data: { publicUrl: `https://store.test/${path}` } } },
      async remove(paths) { calls.push({ operation: 'remove', paths }); return { error: null } },
    } } },
  }
  const api = loadModule('app/admin/actions.ts', {
    '@/lib/admin': { requireAdmin: async () => { calls.push({ operation: 'auth' }); if (options.unauthorized) throw new Error('AUTH_REDIRECT') } },
    '@/lib/supabase/server': { createAdminClient: () => client },
    'next/cache': { revalidatePath: path => calls.push({ operation: 'revalidate', path }) },
    'next/navigation': { redirect: path => { throw new Error(`REDIRECT:${path}`) } },
  })
  return { ...api, calls }
}

test('accepts positive fractional weight, zero stock and zero making charge', () => {
  const result = validateProduct(form())
  assert.equal(result.valid, true)
  assert.equal(result.values.name, 'Silver ring')
  assert.equal(result.values.code, 'R001')
  assert.equal(result.values.weight_grams, 4.25)
  assert.equal(result.values.making_charge, 0)
})

test('rejects missing, non-finite, negative, fractional-piece and out-of-range values', () => {
  for (const [key, values] of Object.entries({ weight_grams: ['0', '-1', '', 'NaN', 'Infinity', '0.0001'], making_charge: ['-1', '2.001'], stock_pcs: ['1.5', '-1', '2147483648'], stock_grams: ['-1', '0.0001'], category_id: ['null', 'invalid'], name: [' '], code: [''] })) {
    for (const value of values) assert.ok(validateProduct(form({ [key]: value })).fieldErrors[key], `${key}=${value}`)
  }
})

test('rejects non-image and oversized uploads', () => {
  assert.ok(validateProduct(form({ image: new File(['text'], 'photo.txt', { type: 'text/plain' }) })).fieldErrors.image)
  assert.ok(validateProduct(form({ image: new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' }) })).fieldErrors.image)
  assert.equal(validateProduct(form({ image: new File(['image'], 'photo.jpg', { type: 'image/jpeg' }) })).valid, true)
})

test('preserves pricing and either-stock-counter out-of-stock rules', () => {
  assert.equal(productPrice(4.25, 100, 120), 610)
  assert.equal(isOutOfStock({ stock_pcs: 1, stock_grams: 0 }), true)
  assert.equal(isOutOfStock({ stock_pcs: 0, stock_grams: 4 }), true)
  assert.equal(isOutOfStock({ stock_pcs: 1, stock_grams: 4 }), false)
})

test('normalizes URL filters and keeps filters when changing page', () => {
  assert.deepEqual(parseProductFilters({ page: '-1', category: 'bad-id', status: ['active'], sort: 'bad' }), { page: 1, category: '', status: '', sort: 'recent', q: '' })
  const filters = parseProductFilters({ q: ' silver & pearl ', category: CATEGORY_ID, status: 'hidden', sort: 'name', page: '3' })
  const url = new URL(productListUrl(filters, 4), 'http://localhost')
  assert.equal(url.searchParams.get('q'), 'silver & pearl')
  assert.equal(url.searchParams.get('category'), CATEGORY_ID)
  assert.equal(url.searchParams.get('status'), 'hidden')
  assert.equal(url.searchParams.get('page'), '4')
  assert.equal(productSearchPattern('Ring (small), 50%_"'), '"%Ring (small), 50\\%\\_\\"%"')
})

test('checks admin access before uploads or database writes', async () => {
  const api = actions({ unauthorized: true })
  await assert.rejects(api.saveProduct({}, form()), /AUTH_REDIRECT/)
  await assert.rejects(api.deleteProduct({}, form({ id: PRODUCT_ID })), /AUTH_REDIRECT/)
  assert.ok(api.calls.every(call => call.operation === 'auth'))
})

test('invalid fields never reach storage or the database', async () => {
  const api = actions()
  const result = await api.saveProduct({}, form({ weight_grams: '0' }))
  assert.ok(result.fieldErrors.weight_grams)
  assert.deepEqual(api.calls.map(call => call.operation), ['auth'])
})

test('successful creation preserves stock, invalidates pages and redirects', async () => {
  const api = actions()
  await assert.rejects(api.saveProduct({}, form()), /REDIRECT:\/admin\/products\?saved=1/)
  const write = api.calls.find(call => call.operation === 'insert')
  assert.equal(write.data.stock_pcs, 0)
  assert.equal(write.data.stock_grams, 0)
  assert.equal(write.data.is_active, true)
  assert.ok(api.calls.some(call => call.operation === 'revalidate' && call.path === '/'))
})

test('editing without a new photo preserves the stored photo and hidden status', async () => {
  const api = actions()
  await assert.rejects(api.saveProduct({}, form({ id: PRODUCT_ID, existing_image: 'https://untrusted.test/wrong.jpg', is_active: '' })), /REDIRECT/)
  const write = api.calls.find(call => call.operation === 'update')
  assert.equal(write.data.image_url, 'https://store.test/existing.jpg')
  assert.equal(write.data.is_active, false)
  assert.equal(api.calls.some(call => call.operation === 'upload'), false)
})

test('duplicate code returns a field error and cleans up only the new upload', async () => {
  const api = actions({ writeError: { code: '23505', message: 'duplicate key' } })
  const result = await api.saveProduct({}, form({ id: PRODUCT_ID, image: new File(['image'], 'ring.jpg', { type: 'image/jpeg' }) }))
  assert.ok(result.fieldErrors.code)
  const upload = api.calls.find(call => call.operation === 'upload')
  assert.deepEqual(api.calls.find(call => call.operation === 'remove').paths, [upload.path])
  assert.equal(api.calls.some(call => call.operation === 'revalidate'), false)
})

test('upload failure does not write a product or report success', async () => {
  const api = actions({ uploadError: { message: 'Bucket not found' } })
  const result = await api.saveProduct({}, form({ image: new File(['image'], 'ring.jpg', { type: 'image/jpeg' }) }))
  assert.match(result.error, /photo could not be uploaded/)
  assert.equal(api.calls.some(call => ['insert', 'update'].includes(call.operation)), false)
})

test('missing edit target returns an error instead of recreating the product', async () => {
  const api = actions({ missing: true })
  assert.match((await api.saveProduct({}, form({ id: PRODUCT_ID }))).error, /no longer exists/)
  assert.equal(api.calls.some(call => ['insert', 'update'].includes(call.operation)), false)
})

test('delete reports database failures and revalidates only on success', async () => {
  const failed = actions({ writeError: { message: 'Invalid API key' } })
  assert.match((await failed.deleteProduct({}, form({ id: PRODUCT_ID }))).error, /credentials/)
  assert.equal(failed.calls.some(call => call.operation === 'revalidate'), false)
  const api = actions()
  assert.deepEqual(await api.deleteProduct({}, form({ id: PRODUCT_ID })), { success: true })
  assert.ok(api.calls.some(call => call.operation === 'revalidate' && call.path === '/admin/products'))
})

test('category invalid API key returns a recoverable form error', async () => {
  const a = actions({writeError:{message:'Invalid API key'}})
  const fd = new FormData(); fd.set('name','Pooja'); fd.set('slug','pooja')
  const result = await a.saveCategory({},fd)
  assert.match(result.error,/Supabase credentials/)
  assert.equal(a.calls.some(c=>c.operation==='revalidate'),false)
})
test('category creation refreshes storefront and returns to category list', async () => {
  const a = actions()
  const fd = new FormData(); fd.set('name','Pooja'); fd.set('slug','pooja')
  await assert.rejects(a.saveCategory({},fd),/REDIRECT:\/admin\/categories/)
  assert.deepEqual(a.calls.filter(c=>c.operation==='revalidate').map(c=>c.path),['/admin/categories','/'])
})
