import Link from 'next/link'
import Form from 'next/form'
import { formatPrice, isOutOfStock, sellingPrice, type CategoryOption, type ProductListItem } from '@/lib/products'
import { productListUrl, type ProductFilters } from '@/lib/product-search'
import DeleteProductButton from './DeleteProductButton'
import ProductImage from './ProductImage'

type Props = {
  products: ProductListItem[]; categories: CategoryOption[]; rate: number | null
  filters: ProductFilters; count: number; pageSize: number; saved: boolean
  summary: { total: number; active: number; out: number }
}

export default function ProductCatalog({ products, categories, rate, filters, count, pageSize, saved, summary }: Props) {
  const pages = Math.max(1, Math.ceil(count / pageSize))
  const filtered = Boolean(filters.q || filters.category || filters.status)
  return <div className="fade-page product-page">
    <div className="product-page-heading"><div><div className="eyebrow">Your collection</div><h2>Products</h2><p className="muted">A clear view of every piece, price and stock level.</p></div>
      <Link href="/admin/products/new" className="btn btn-dark"><span aria-hidden="true">＋</span> Add product</Link></div>
    {saved ? <div className="notice auth-success" role="status">Product saved successfully.</div> : null}
    <div className="product-summary">
      <div><span>Total products</span><strong>{summary.total.toLocaleString('en-IN')}</strong></div>
      <div><span>Visible on storefront</span><strong>{summary.active.toLocaleString('en-IN')}</strong></div>
      <div><span>Out of stock</span><strong>{summary.out.toLocaleString('en-IN')}</strong></div>
      <div><span>Latest silver rate</span><strong className="summary-rate">{rate === null ? 'Not set' : formatPrice(rate)}{rate !== null ? <small>/g</small> : null}</strong><Link href="/admin/rates" className="text-link">Manage rates <span aria-hidden="true">↗</span></Link></div>
    </div>
    <div className="product-catalog">
      <Form action="/admin/products" className="product-filters" key={productListUrl(filters, 1)}>
        <div className="field product-search"><label htmlFor="product-search">Search products</label><input id="product-search" type="search" className="input" name="q" defaultValue={filters.q} placeholder="Search by name or product code" maxLength={150} /></div>
        <div className="field"><label htmlFor="category-filter">Category</label><select id="category-filter" className="input" name="category" defaultValue={filters.category}><option value="">All categories</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <div className="field"><label htmlFor="status-filter">Status</label><select id="status-filter" className="input" name="status" defaultValue={filters.status}><option value="">All products</option><option value="active">Visible</option><option value="hidden">Hidden</option><option value="out">Out of stock</option></select></div>
        <div className="field"><label htmlFor="sort-filter">Sort by</label><select id="sort-filter" className="input" name="sort" defaultValue={filters.sort}><option value="recent">Newest first</option><option value="name">Name A–Z</option><option value="stock">Lowest piece stock</option></select></div>
        <button className="btn btn-dark">Apply filters</button>
      </Form>
      <div className="product-results-heading"><span role="status">{count ? `${(filters.page - 1) * pageSize + 1}–${Math.min(filters.page * pageSize, count)} of ${count} products` : '0 products'}{filtered ? ' matching your filters' : ''}</span>
        {filtered || filters.sort !== 'recent' ? <Link className="text-link" href="/admin/products">Clear filters</Link> : null}</div>
      {products.length ? <>
        <div className="product-table-scroll" tabIndex={0} role="region" aria-label="Product inventory">
          <table className="table product-table"><caption className="sr-only">Jewellery products, live prices, stock and management actions</caption>
            <thead><tr><th scope="col">Product</th><th scope="col">Category</th><th scope="col">Price / weight</th><th scope="col">Available stock</th><th scope="col">Visibility</th><th scope="col">Actions</th></tr></thead>
            <tbody>{products.map(product => <tr key={product.id}>
              <td><div className="product-identity"><ProductImage src={product.image_url} name={product.name} className="product-thumbnail" /><div><Link className="product-name" href={`/admin/products/${product.id}/edit`}>{product.name}</Link><span className="product-code">{product.code}</span></div></div></td>
              <td><span className="product-category">{product.category?.name ?? 'Uncategorised'}</span></td>
              <td><strong className="product-table-price">{rate === null && product.pricing_mode !== 'piece' ? 'Rate not set' : formatPrice(sellingPrice(product, rate || 0))}</strong><span className="product-cell-detail">{Number(product.weight_grams).toLocaleString('en-IN', { maximumFractionDigits: 3 })} g · {formatPrice(Number(product.making_charge))} making</span></td>
              <td><strong>{product.stock_pcs} pcs</strong><span className="product-cell-detail">{Number(product.stock_grams).toLocaleString('en-IN', { maximumFractionDigits: 3 })} g available</span>{isOutOfStock(product) ? <span className="status-pill status-out">Out of stock</span> : null}</td>
              <td><span className={`status-pill ${product.is_active ? 'status-active' : 'status-hidden'}`}><span aria-hidden="true">●</span> {product.is_active ? 'Visible' : 'Hidden'}</span></td>
              <td><div className="actions product-row-actions"><Link className="btn btn-ghost small" aria-label={`Edit ${product.name}`} href={`/admin/products/${product.id}/edit`}>Edit</Link><DeleteProductButton id={product.id} name={product.name} /></div></td>
            </tr>)}</tbody>
          </table>
        </div>
        <nav className="product-pagination" aria-label="Product pagination"><span className="field-help">Page {filters.page} of {pages}</span><div className="actions">
          {filters.page > 1 ? <Link className="btn btn-ghost small" href={productListUrl(filters, filters.page - 1)}>Previous</Link> : <button className="btn btn-ghost small" disabled>Previous</button>}
          {filters.page < pages ? <Link className="btn btn-ghost small" href={productListUrl(filters, filters.page + 1)}>Next</Link> : <button className="btn btn-ghost small" disabled>Next</button>}
        </div></nav>
      </> : <div className="product-empty"><span className="empty-gem" aria-hidden="true">◇</span><h3>{filtered ? 'No matching pieces' : 'Your collection starts here'}</h3><p className="muted">{filtered ? 'Try a different name, code or category to find your product.' : 'Add your first product with a photo, weight and stock details.'}</p><Link className="btn btn-dark" href={filtered ? '/admin/products' : '/admin/products/new'}>{filtered ? 'Clear filters' : 'Add your first product'}</Link></div>}
    </div>
  </div>
}

