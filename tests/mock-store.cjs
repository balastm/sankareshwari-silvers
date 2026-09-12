// Local, in-memory Supabase fixture for browser verification. Never connects to a real store.
const http = require('node:http')
const { spawn } = require('node:child_process')
const { randomUUID } = require('node:crypto')

const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'admin@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
const categories = ['Anklets', 'Rings', 'Necklaces'].map((name, index) => ({ id: `22222222-2222-4222-8222-22222222222${index}`, name, is_active: true }))
const names = ['Classic silver anklet', 'Pearl drop necklace', 'Everyday silver band', 'Twisted silver ring', 'Lotus pendant', 'Silver charm anklet', 'Minimal chain', 'Dainty silver ring', 'Heritage anklet', 'Luna pendant', 'Polished cuff ring', 'Beaded silver anklet', 'Floral silver ring', 'Signature necklace']
let products = names.map((name, index) => ({ id: `11111111-1111-4111-8111-${String(index + 1).padStart(12, '0')}`, category_id: categories[index % 3].id, name, code: `SLV-${String(index + 1).padStart(3, '0')}`, weight_grams: 4.25 + index, making_charge: 150, stock_pcs: index % 5 === 0 ? 0 : 12 + index, stock_grams: index % 5 === 0 ? 0 : 220 + index * 10, is_active: index % 4 !== 0, image_url: null, created_at: new Date(Date.UTC(2026, 8, 12 - index)).toISOString() }))
const photos = new Map()
const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 7200 })).toString('base64url')}.fixture`

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost:4100')
  response.setHeader('Access-Control-Allow-Origin', 'http://localhost:4101')
  response.setHeader('Access-Control-Allow-Headers', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,PATCH,DELETE,OPTIONS')
  const send = (data, status = 200) => { response.writeHead(status, { 'content-type': 'application/json' }); response.end(request.method === 'HEAD' ? undefined : JSON.stringify(data)) }
  if (request.method === 'OPTIONS') return send({})
  if (url.pathname === '/auth/v1/token') return send({ access_token: token, refresh_token: 'fixture-refresh', expires_in: 7200, token_type: 'bearer', user })
  if (url.pathname === '/auth/v1/user') return send(user)
  if (url.pathname === '/auth/v1/logout') return send({})
  if (url.pathname.startsWith('/storage/v1/object/public/product-images/')) {
    const photo = photos.get(url.pathname.split('/').pop())
    if (!photo) return send({ message: 'Not found' }, 404)
    response.writeHead(200, { 'content-type': photo.type }); return response.end(photo.data)
  }
  if (url.pathname.startsWith('/storage/v1/object/product-images/')) {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const name = url.pathname.split('/').pop()
    const data = Buffer.concat(chunks)
    if (request.headers['content-type']?.startsWith('multipart/form-data')) {
      const parsed = await new Request('http://localhost/upload', { method: 'POST', headers: { 'content-type': request.headers['content-type'] }, body: data }).formData()
      const file = [...parsed.values()].find(value => value instanceof File)
      if (file) photos.set(name, { data: Buffer.from(await file.arrayBuffer()), type: file.type })
    } else photos.set(name, { data, type: request.headers['content-type'] })
    return send({ Key: `product-images/${name}` })
  }
  if (url.pathname === '/storage/v1/object/product-images') return send([])
  const table = url.pathname.split('/').pop()
  if (table === 'admin_users') return send([{ user_id: user.id }])
  let rows = table === 'categories' ? [...categories] : table === 'silver_rates' ? [{ rate_per_gram: 120, effective_date: '2026-09-12' }] : table === 'products' ? [...products] : []
  for (const [key, filter] of url.searchParams) {
    if (filter.startsWith('eq.')) rows = rows.filter(row => String(row[key]) === filter.slice(3))
  }
  if (['POST', 'PATCH', 'DELETE'].includes(request.method)) {
    const chunks = []
    for await (const chunk of request) chunks.push(chunk)
    const data = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}
    if (table !== 'products') return send({})
    if (data.code && products.some(product => product.code === data.code && (request.method === 'POST' || !rows.some(row => row.id === product.id)))) return send({ code: '23505', message: 'duplicate code' }, 409)
    if (request.method === 'POST') { const product = { ...data, id: randomUUID(), created_at: new Date().toISOString() }; products.unshift(product); rows = [product] }
    if (request.method === 'PATCH') { rows.forEach(row => Object.assign(row, data)) }
    if (request.method === 'DELETE') { const ids = new Set(rows.map(row => row.id)); products = products.filter(product => !ids.has(product.id)) }
    return send(request.headers.accept?.includes('vnd.pgrst.object') ? rows[0] ?? null : rows)
  }
  for (const filter of url.searchParams.getAll('or')) {
    if (filter.includes('stock_pcs.lte')) rows = rows.filter(row => row.stock_pcs <= 0 || row.stock_grams <= 0)
    if (filter.includes('name.ilike')) {
      const match = filter.match(/name\.ilike\."%(.+?)%"/)
      const query = (match?.[1] ?? '').replace(/\\(.)/g, '$1').toLowerCase()
      rows = rows.filter(row => row.name.toLowerCase().includes(query) || row.code.toLowerCase().includes(query))
    }
  }
  const order = url.searchParams.get('order')?.split(',')[0]?.split('.')
  if (order) rows.sort((a, b) => (typeof a[order[0]] === 'number' ? a[order[0]] - b[order[0]] : String(a[order[0]]).localeCompare(String(b[order[0]]))) * (order[1] === 'desc' ? -1 : 1))
  const total = rows.length
  const offset = Number(url.searchParams.get('offset') || 0)
  const limit = Number(url.searchParams.get('limit') || total || 1)
  rows = rows.slice(offset, offset + limit)
  response.setHeader('content-range', `${offset}-${Math.max(offset, offset + rows.length - 1)}/${total}`)
  if (table === 'products') rows = rows.map(row => ({ ...row, category: { name: categories.find(category => category.id === row.category_id)?.name ?? '' } }))
  return send(request.headers.accept?.includes('vnd.pgrst.object') ? rows[0] ?? null : rows)
})

server.listen(4100, 'localhost', () => {
  const next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--port', '4101'], {
    stdio: 'inherit', windowsHide: true,
    env: { ...process.env, NEXT_TEST_OUTPUT_DIR: '.next-browser', NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:4100', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'fixture-publishable', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture-anon', SUPABASE_SECRET_KEY: 'fixture-secret', SUPABASE_SERVICE_ROLE_KEY: 'fixture-service-role', NEXT_PUBLIC_SITE_URL: 'http://localhost:4101', RAZORPAY_KEY_ID: 'fixture', RAZORPAY_KEY_SECRET: 'fixture', RAZORPAY_WEBHOOK_SECRET: 'fixture' },
  })
  next.on('exit', code => server.close(() => process.exit(code ?? 0)))
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { next.kill(); server.close() })
  console.log('In-memory test store at http://localhost:4100; app at http://localhost:4101. Login with admin@example.test and any password of 6+ characters.')
})
