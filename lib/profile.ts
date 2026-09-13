export type ProfileState = { error?: string; success?: boolean }
export function validateProfile(formData: FormData) {
  const name = formData.get('full_name')
  const phone = formData.get('phone')
  const full_name = typeof name === 'string' ? name.trim() : ''
  const phoneNumber = typeof phone === 'string' ? phone.trim() : ''
  if (!full_name || full_name.length > 120) return { error: 'Enter your name using 1–120 characters.' }
  if (phoneNumber && (!/^\+?[\d\s()-]{10,20}$/.test(phoneNumber) || phoneNumber.replace(/\D/g, '').length < 10)) return { error: 'Enter a valid phone number, or leave it blank.' }
  return { values: { full_name, phone: phoneNumber } }
}
