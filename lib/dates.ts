export function todayInIndia(date = new Date()) {
  return new Date(date.getTime() + 330 * 60 * 1000).toISOString().slice(0, 10)
}
