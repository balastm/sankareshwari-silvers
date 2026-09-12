'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { saveProduct } from '@/app/admin/actions'
import { formatPrice, MAX_PRODUCT_IMAGE_BYTES, sellingPrice, type CategoryOption, type Product, type ProductActionState, type ProductValues } from '@/lib/products'
import ProductImage from './ProductImage'

type TextField = Exclude<keyof ProductValues, 'is_active'>
type Props = { categories: CategoryOption[]; product?: Product; rate: number | null }
const initialActionState: ProductActionState = {}

export default function ProductForm({ categories, product, rate }: Props) {
  const [values, setValues] = useState<Record<TextField, string>>({
    category_id: product?.category_id ?? '', name: product?.name ?? '', code: product?.code ?? '',
    weight_grams: String(product?.weight_grams ?? ''), making_charge: String(product?.making_charge ?? 0),
    stock_pcs: String(product?.stock_pcs ?? 0), stock_grams: String(product?.stock_grams ?? 0),
    pricing_mode: product?.pricing_mode ?? 'weight', piece_rate: String(product?.piece_rate ?? ''),
  })
  const [active, setActive] = useState(product?.is_active ?? true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(product?.image_url ?? '')
  const [imageError, setImageError] = useState('')
  const previewUrl = useRef<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [state, formAction, pending] = useActionState(async (previous: ProductActionState, formData: FormData) => {
    // Retain the selected photo when a failed action resets the native file input.
    if (imageFile) formData.set('image', imageFile)
    return saveProduct(previous, formData)
  }, initialActionState)

  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current) }, [])

  function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > MAX_PRODUCT_IMAGE_BYTES) {
      setImageError(!file.type.startsWith('image/') ? 'Choose an image file.' : 'Choose a photo smaller than 5 MB.')
      event.target.value = ''
      return
    }
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    previewUrl.current = URL.createObjectURL(file)
    setPreview(previewUrl.current)
    setImageFile(file)
    setImageError('')
  }

  function resetPhoto() {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    previewUrl.current = null
    setPreview(product?.image_url ?? '')
    setImageFile(null)
    setImageError('')
    if (fileInput.current) fileInput.current.value = ''
  }

  function field(name: TextField, label: string, options: { type?: 'number'; min?: string; max?: string; step?: string; placeholder?: string } = {}) {
    const error = state.fieldErrors?.[name]
    return <div className="field">
      <label htmlFor={`product-${name}`}>{label}</label>
      <input id={`product-${name}`} name={name} className="input" required {...options}
        value={values[name]} onChange={event => setValues(current => ({ ...current, [name]: event.target.value }))}
        aria-invalid={Boolean(error)} aria-describedby={error ? `error-${name}` : undefined} />
      {error ? <span className="field-error" id={`error-${name}`}>{error}</span> : null}
    </div>
  }

  const weight = Number(values.weight_grams) || 0
  const makingCharge = Number(values.making_charge) || 0
  const piecePricing = values.pricing_mode === 'piece'
  const price = !piecePricing && rate === null ? null : sellingPrice({weight_grams:weight,making_charge:makingCharge,pricing_mode:piecePricing?'piece':'weight',piece_rate:Number(values.piece_rate)||0},rate||0)
  const outOfStock = Number(values.stock_pcs) <= 0 || (!piecePricing && Number(values.stock_grams) < weight)
  const photoError = imageError || state.fieldErrors?.image

  return <form action={formAction} className="product-editor" aria-busy={pending}>
    {product ? <><input type="hidden" name="id" value={product.id} /><input type="hidden" name="existing_image" value={product.image_url ?? ''} /></> : null}
    <div className="product-editor-main">
      {state.error ? <div className="notice auth-error" role="alert"><strong>Unable to save product</strong><p>{state.error}</p></div> : null}
      {!categories.length ? <div className="notice" role="status">Create an active category before adding a product. <Link className="text-link" href="/admin/categories/new">Add category</Link></div> : null}
      <fieldset className="product-panel" disabled={pending}>
        <legend>Product details</legend>
        <p className="field-help">Give each piece a clear name and a unique code.</p>
        <div className="form-grid">
          <div className="field span2">
            <label htmlFor="product-category_id">Main product category</label>
            <select id="product-category_id" name="category_id" className="input" required value={values.category_id}
              onChange={event => setValues(current => ({ ...current, category_id: event.target.value }))}
              aria-invalid={Boolean(state.fieldErrors?.category_id)} aria-describedby={state.fieldErrors?.category_id ? 'error-category_id' : undefined}>
              <option value="">Choose category</option>
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}{category.is_active === false ? ' (inactive)' : ''}</option>)}
            </select>
            {state.fieldErrors?.category_id ? <span className="field-error" id="error-category_id">{state.fieldErrors.category_id}</span> : null}
          </div>
          {field('name', 'Sub product name', { placeholder: 'e.g. Classic silver anklet' })}
          {field('code', 'Product code', { placeholder: 'e.g. SLV-001' })}
        </div>
      </fieldset>
      <fieldset className="product-panel" disabled={pending}>
        <legend>Weight & pricing</legend>
        <div className="pricing-options" role="group" aria-label="Pricing method">
          <label><input type="radio" name="pricing_mode" value="weight" checked={!piecePricing} onChange={()=>setValues(current=>({...current,pricing_mode:'weight'}))}/> Weight × rate</label>
          <label><input type="radio" name="pricing_mode" value="piece" checked={piecePricing} onChange={()=>setValues(current=>({...current,pricing_mode:'piece'}))}/> Single piece rate</label>
        </div>
        <p className="field-help">{piecePricing ? 'Customer price = piece rate + making charge.' : 'Customer price = weight × daily silver rate + making charge.'}</p>
        <div className="form-grid">
          {piecePricing ? field('piece_rate', 'Single piece rate (₹)', { type:'number', min:'0.01', max:'9999999999.99', step:'0.01' }) : field('weight_grams', 'Weight (grams)', { type: 'number', min: '0.001', max: '999999999.999', step: '0.001' })}
          <div className="field"><label>Calculated price (₹)</label><output className="input" aria-live="polite">{price === null ? 'Set daily silver rate' : formatPrice(price)}</output></div>
        </div>
      </fieldset>
      <fieldset className="product-panel" disabled={pending}><legend>Making charge</legend><p className="field-help">This amount is added to the price of each piece.</p>{field('making_charge', 'Making charge (₹)', { type: 'number', min: '0', max: '9999999999.99', step: '0.01' })}</fieldset>
      <fieldset className="product-panel" disabled={pending}>
        <legend>Stock & visibility</legend>
        <p className="field-help">Track available pieces and grams independently.</p>
        <div className="form-grid">
          {field('stock_pcs', 'Available stock (pieces)', { type: 'number', min: '0', max: '2147483647', step: '1' })}
          {field('stock_grams', 'Available stock (grams)', { type: 'number', min: '0', max: '999999999.999', step: '0.001' })}
        </div>
        <label className="product-visibility"><input name="is_active" type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} />
          <span><strong>Show on customer website</strong><span className="field-help">Hidden products remain available to manage here.</span></span>
        </label>
        <div className="product-stock-note"><span className={`status-pill ${outOfStock ? 'status-out' : 'status-active'}`}>{outOfStock ? 'Out of stock' : 'In stock'}</span>
          <span className="field-help">Customers only see Available or Sold out. {piecePricing ? 'Piece-priced products use piece stock; gram stock is kept for your records.' : 'Weight-priced products need enough pieces and grams.'}</span>
        </div>
      </fieldset>
      <div className="product-editor-actions">
        <button type="submit" className="btn btn-dark" disabled={pending || !categories.length || Boolean(imageError)}>{pending ? 'Saving product…' : product ? 'Save changes' : 'Save product'}</button>
        <Link className="btn btn-ghost" href="/admin/products">Cancel</Link>
        <span className="field-help" role="status">{pending ? 'Saving details and photo…' : 'All details except the photo are required.'}</span>
      </div>
    </div>
    <aside className="product-editor-side" aria-label="Product photo and price preview">
      <fieldset className="product-panel" disabled={pending}>
        <legend>Product photo</legend>
        <ProductImage src={preview} name={values.name || 'Product photo preview'} className="product-photo-preview" />
        <div className="field photo-upload">
          <label htmlFor="product-image">{product?.image_url ? 'Replace photo' : 'Upload photo'}</label>
          <input ref={fileInput} id="product-image" name="image" type="file" accept="image/*" onChange={changePhoto}
            aria-invalid={Boolean(photoError)} aria-describedby="photo-help photo-error" />
          <span className="field-help" id="photo-help">Image files up to 5 MB. A square photo works best.</span>
          <span className="field-error" id="photo-error" role={photoError ? 'alert' : undefined}>{photoError ?? ''}</span>
          {imageFile ? <><span className="photo-filename">Selected: {imageFile.name}</span><button className="text-link" type="button" onClick={resetPhoto}>Undo photo selection</button></> : null}
          {imageError && !imageFile ? <button className="text-link" type="button" onClick={resetPhoto}>Continue without a new photo</button> : null}
        </div>
      </fieldset>
      <section className="product-price-preview">
        <div className="eyebrow">Price preview</div>
        <h3>{values.name.trim() || 'Your new piece'}</h3>
        <div className="preview-price">{price !== null && (piecePricing || weight > 0) ? formatPrice(price) : '—'}</div>
        <dl>{piecePricing ? <div><dt>Piece rate</dt><dd>{formatPrice(Number(values.piece_rate)||0)}</dd></div> : <><div><dt>Silver rate</dt><dd>{rate === null ? 'Not available' : `${formatPrice(rate)}/g`}</dd></div><div><dt>Weight</dt><dd>{weight} g</dd></div></>}<div><dt>Making charge</dt><dd>{formatPrice(makingCharge)}</dd></div></dl>
        <p className="field-help">{piecePricing ? 'Fixed per-piece price, including the separate making charge.' : rate === null ? 'Set a silver rate to calculate the customer price. You can still save this product.' : 'Preview uses the latest saved silver rate. The price updates when the rate changes.'}</p>
        <span className={`status-pill ${active ? 'status-active' : 'status-hidden'}`}>{active ? 'Visible on storefront' : 'Hidden from storefront'}</span>
      </section>
    </aside>
  </form>
}
