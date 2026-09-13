import Header from '@/components/Header'
import CartClient from './CartClient'
import StoreFooter from '@/components/StoreFooter'
export default function Cart(){return <><Header/><main className="container section"><div className="eyebrow">Your selection</div><h1 className="page-title">The pieces you love.</h1><CartClient/></main><StoreFooter/></>}
