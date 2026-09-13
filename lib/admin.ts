import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
export async function requireAdmin(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser()
 if(!user)redirect('/login?next=/admin')
 const {data}=await supabase.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle()
 if(!data)redirect('/login?next=/admin&error=admin_required')
 return {supabase,user}
}
