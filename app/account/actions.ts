'use server'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { validateProfile, type ProfileState } from '@/lib/profile'

export async function saveProfile(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Please sign in again to save your details.' }
    const result = validateProfile(formData)
    if (!result.values) return { error: result.error }
    // Identity comes only from the verified session, never from submitted fields.
    const { error } = await createAdminClient().from('profiles').upsert({ id: user.id, ...result.values })
    if (error) return { error: 'Your details could not be saved. Please try again.' }
    revalidatePath('/account')
    revalidatePath('/checkout')
    return { success: true }
  } catch { return { error: 'Your details could not be saved. Please try again.' } }
}
