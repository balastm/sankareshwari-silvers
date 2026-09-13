'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/server'
import { adminErrorMessage } from '@/lib/admin-errors'
import { UUID_PATTERN, validateProduct, MAX_PRODUCT_IMAGE_BYTES, type ProductActionState } from '@/lib/products'

function n(v:FormDataEntryValue|null){return Number(v||0)}
async function mustSave(request:PromiseLike<{error:{message?:string}|null}>) {
  const { error } = await request
  if (error) {
    // Convert backend/store errors into a friendlier, non-technical message when possible
    throw new Error(adminErrorMessage(error, error.message || 'Save failed'))
  }
}
export async function saveCategory(_previous:{error?:string},fd:FormData):Promise<{error?:string}>{
 await requireAdmin()
 const id=String(fd.get('id')||'')
 const name=String(fd.get('name')||'').trim()
 const featureKicker=String(fd.get('feature_kicker')||'').trim().slice(0,80)
 const featureTitle=String(fd.get('feature_title')||'').trim().slice(0,100)
 const featureFont=String(fd.get('feature_font')||'serif')==='sans'?'sans':'serif'
 const featureOrder=Math.max(0,Math.min(99,Math.floor(Number(fd.get('feature_order')||0))))
 if(id && !UUID_PATTERN.test(id)) return {error:'This category could not be found.'}
 if(!name) return {error:'Enter a category name.'}
 const file=fd.get('image')
 if(file instanceof File && file.size>0 && (!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type) || file.size>MAX_PRODUCT_IMAGE_BYTES)) return {error:'Choose a JPG, PNG, WebP or AVIF image smaller than 5 MB.'}
 let uploadedPath:string|undefined
 let a:ReturnType<typeof createAdminClient>|undefined
 try {
  a=createAdminClient()
  let image_url:string|null=null
  if(id){
   const existing=await a.from('categories').select('image_url,is_active').eq('id',id).maybeSingle()
   if(existing.error) throw existing.error
   if(!existing.data) return {error:'This category no longer exists.'}
   image_url=existing.data.image_url
  }
  if(file instanceof File && file.size>0){
   const extension=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'} as Record<string,string>)[file.type]
   const path=`categories/${crypto.randomUUID()}.${extension}`
   const uploaded=await a.storage.from('product-images').upload(path,file,{contentType:file.type,upsert:false})
   if(uploaded.error) throw uploaded.error
   uploadedPath=path
   image_url=a.storage.from('product-images').getPublicUrl(path).data.publicUrl
  }
  const data={name,image_url,feature_kicker:featureKicker||null,feature_title:featureTitle||null,feature_font:featureFont,feature_order:featureOrder,feature_enabled:fd.get('feature_enabled')==='on',...(!id?{is_active:true}:{})}
  const result=id ? await a.from('categories').update(data).eq('id',id).select('id').maybeSingle() : await a.from('categories').insert(data).select('id').single()
  if(result.error) throw result.error
  if(!result.data) throw new Error('Category no longer exists')
 } catch(error) {
  if(uploadedPath && a) {try{await a.storage.from('product-images').remove([uploadedPath])}catch{}}
  return {error:adminErrorMessage(error,'The category could not be saved. Please try again.')}
 }
 revalidatePath('/admin/categories')
 revalidatePath('/')
 redirect('/admin/categories')
}
export async function deleteCategory(fd:FormData){await requireAdmin();await mustSave(createAdminClient().from('categories').delete().eq('id',String(fd.get('id'))));revalidatePath('/admin/categories');revalidatePath('/')}
export async function saveRate(fd:FormData){
 await requireAdmin();const a=createAdminClient();const id=String(fd.get('id')||'');const data={effective_date:String(fd.get('effective_date')),rate_per_gram:n(fd.get('rate_per_gram'))}
 if (id && !UUID_PATTERN.test(id)) throw new Error('Invalid rate record.')
 if (!/^\d{4}-\d{2}-\d{2}$/.test(data.effective_date) || !Number.isFinite(Date.parse(data.effective_date)) || new Date(data.effective_date).toISOString().slice(0,10) !== data.effective_date) throw new Error('Enter a valid effective date.')
 if (!Number.isFinite(data.rate_per_gram) || data.rate_per_gram <= 0 || data.rate_per_gram > 1000000 || Math.abs(data.rate_per_gram * 100 - Math.round(data.rate_per_gram * 100)) > .000001) throw new Error('Enter a positive rate with no more than two decimal places.')
 if(id)await mustSave(a.from('silver_rates').update(data).eq('id',id));else await mustSave(a.from('silver_rates').insert(data))
 revalidatePath('/admin/rates');revalidatePath('/');redirect('/admin/rates')
}
export async function deleteRate(fd:FormData){await requireAdmin();await mustSave(createAdminClient().from('silver_rates').delete().eq('id',String(fd.get('id'))));revalidatePath('/admin/rates');revalidatePath('/')}
export async function saveProduct(_previous: ProductActionState, fd: FormData): Promise<ProductActionState> {
  await requireAdmin()
  const id = String(fd.get('id') || '')
  if (id && !UUID_PATTERN.test(id)) return { error: 'This product could not be found. Return to the product list and try again.' }
  const { values, fieldErrors, valid } = validateProduct(fd)
  if (!valid) return { error: 'Please check the highlighted fields.', fieldErrors }

  let uploadedPath: string | undefined
  let admin: ReturnType<typeof createAdminClient> | undefined
  try {
    admin = createAdminClient()
    let image_url: string | null = null
    if (id) {
      const { data: existing, error } = await admin.from('products').select('image_url').eq('id', id).maybeSingle()
      if (error) throw error
      if (!existing) return { error: 'This product no longer exists. Return to the product list.' }
      image_url = existing.image_url
    }

    const file = fd.get('image')
    if (file instanceof File && file.size > 0) {
      const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').slice(0, 10) || 'image'
      const path = `${crypto.randomUUID()}.${extension}`
      const { error } = await admin.storage.from('product-images').upload(path, file, { upsert: false, contentType: file.type })
      if (error) return { error: adminErrorMessage(error, 'The photo could not be uploaded. Check that product image storage is available and try again.') }
      uploadedPath = path
      image_url = admin.storage.from('product-images').getPublicUrl(path).data.publicUrl
    }

    const data = { ...values, image_url }
    const result = id
      ? await admin.from('products').update(data).eq('id', id).select('id').maybeSingle()
      : await admin.from('products').insert(data).select('id').single()
    if (result.error) throw result.error
    if (!result.data) throw new Error('Product no longer exists')
  } catch (error) {
    if (uploadedPath && admin) {
      // Remove only the new upload if the database save failed; preserve existing photos.
      try { await admin.storage.from('product-images').remove([uploadedPath]) } catch { /* Keep the original save error. */ }
    }
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
    if (code === '23505') return { error: 'That product code is already in use.', fieldErrors: { code: 'Choose a different product code.' } }
    if (code === '23503') return { error: 'The selected category is no longer available.', fieldErrors: { category_id: 'Choose an existing category.' } }
    return { error: adminErrorMessage(error, 'The product could not be saved. Your changes are still here; please try again.') }
  }
  revalidatePath('/admin/products')
  revalidatePath('/')
  if (id) revalidatePath(`/admin/products/${id}/edit`)
  redirect('/admin/products?saved=1')
}

export async function deleteProduct(_previous: ProductActionState, fd: FormData): Promise<ProductActionState> {
  await requireAdmin()
  const id = String(fd.get('id') || '')
  if (!UUID_PATTERN.test(id)) return { error: 'This product could not be found.' }
  try {
    const { data, error } = await createAdminClient().from('products').delete().eq('id', id).select('id').maybeSingle()
    if (error) throw error
    if (!data) return { error: 'This product has already been removed. Refresh the product list.' }
  } catch (error) {
    return { error: adminErrorMessage(error, 'The product could not be deleted. Please try again.') }
  }
  revalidatePath('/admin/products')
  revalidatePath('/')
  return { success: true }
}
export async function updateOrderStatus(fd:FormData){
  await requireAdmin()
  const { orderStatusError } = await import('@/lib/order-status')
  const id=String(fd.get('id')||''),status=String(fd.get('status')||'')
  let message=''
  if(!UUID_PATTERN.test(id)) message='Invalid order.'
  else {
    const admin=createAdminClient()
    const {data:order,error}=await admin.from('orders').select('status,payment_status').eq('id',id).maybeSingle()
    if(error||!order) message='The order could not be loaded.'
    else {
      message=orderStatusError(order.status,status,order.payment_status)||''
      if(!message){
        const result=await admin.from('orders').update({status}).eq('id',id).eq('status',order.status).eq('payment_status',order.payment_status).select('id').maybeSingle()
        if(result.error||!result.data) message='The order changed or could not be saved. Refresh and try again.'
      }
    }
  }
  revalidatePath('/admin/orders');revalidatePath('/orders')
  redirect(message?`/admin/orders?error=${encodeURIComponent(message)}`:'/admin/orders?saved=1')
}
