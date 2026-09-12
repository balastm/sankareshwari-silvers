import {notFound} from 'next/navigation'
import CategoryForm from '@/components/admin/CategoryForm'
import {createAdminClient} from '@/lib/supabase/server'
export default async function EditCategory({params}:{params:Promise<{id:string}>}){const {id}=await params;const {data}=await createAdminClient().from('categories').select('*').eq('id',id).maybeSingle();if(!data)notFound();return <div className="fade-page"><h2>Edit category</h2><CategoryForm category={data}/></div>}
