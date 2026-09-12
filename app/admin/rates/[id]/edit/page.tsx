import {notFound} from 'next/navigation'
import RateForm from '@/components/admin/RateForm'
import {createAdminClient} from '@/lib/supabase/server'
export default async function EditRate({params}:{params:Promise<{id:string}>}){const {id}=await params;const {data}=await createAdminClient().from('silver_rates').select('*').eq('id',id).maybeSingle();if(!data)notFound();return <div className="fade-page"><h2>Edit silver rate</h2><RateForm rate={data}/></div>}
