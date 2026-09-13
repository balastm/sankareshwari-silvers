import ShoppingBag from '@/components/ShoppingBag'
import { getStorefront } from '@/lib/storefront'
export default async function CartClient() {
  const data = await getStorefront()
  return <ShoppingBag {...data}/>
}
