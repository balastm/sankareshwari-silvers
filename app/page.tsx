import Header from '@/components/Header'
import GiftUnboxing from '@/components/GiftUnboxing'
import Reveal from '@/components/Reveal'
import Collection from '@/components/Collection'
import { createClient } from '@/lib/supabase/server'
import { todayInIndia } from '@/lib/dates'
import { PRODUCT_COLUMNS, type ProductListItem } from '@/lib/products'

export const revalidate = 30

export default async function Home() {
  const supabase = await createClient()
  const [{data:products,error:productError},{data:rateRow,error:rateError},{data:categories,error:categoryError}] = await Promise.all([
    supabase.from('products').select(`${PRODUCT_COLUMNS},category:categories(name)`).eq('is_active',true).order('created_at',{ascending:false}).returns<ProductListItem[]>(),
    supabase.from('silver_rates').select('rate_per_gram,effective_date').lte('effective_date',todayInIndia()).order('effective_date',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('categories').select('id,name,image_url').eq('is_active',true).order('name')
  ])
  const rate = rateError ? 0 : Number(rateRow?.rate_per_gram || 0)
  return <>
    <Header/>
    <main>
      <GiftUnboxing rate={rate}/>

      <section id="products" className="section"><div className="container">
        <Reveal><div className="section-head"><div><div className="eyebrow">Current collection</div><h2>Made for everyday shine.</h2></div><p className="muted">Explore our categories and find your next treasured piece. Displayed prices include making charges.</p></div></Reveal>
        {productError || categoryError ? <div className="notice" role="status">The collection could not be loaded. Please try again shortly.</div> : <Collection categories={categories||[]} products={products||[]} rate={rate}/>}
      </div></section>
      <section id="contact" className="contact-section"><div className="container"><Reveal><div className="eyebrow">Contact Us · Visit our store</div><h2>A blessing. A celebration.<br/><em>A gift to remember.</em></h2><p>Product enquiries, silver gifting and pooja collections.</p><address>65, Sossaiyappar Kadai Street,<br/>Eral – 628801</address><div className="contact-actions"><a className="btn btn-dark" href="tel:+919655570730">Call +91 96555 70730</a><a className="btn btn-ghost" href="https://wa.me/919655570730" target="_blank" rel="noopener noreferrer">Chat on WhatsApp ↗</a></div></Reveal></div></section>
    </main>
    <footer className="footer"><div className="container">© {new Date().getFullYear()} Sankareshwari Silvers · Crafted with care.</div></footer>
  </>
}

