export function adminErrorMessage(error: unknown, fallback: string) {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : ''
  if (/invalid api key|missing supabase|invalid jwt/i.test(message)) {
    return 'The store connection could not be verified. Please check the server’s Supabase credentials.'
  }
  if (/column|schema cache|does not exist/i.test(message)) return 'The database needs the category and pricing update. Please apply the latest store migration.'
  if (/bucket not found/i.test(message)) return 'The photo could not be uploaded. Please create the product-images bucket.'
  return fallback
}
