export function plusDiscount(months: number): number {
  return Math.min(25, Math.max(0, Math.trunc(months) - 1) * 2.5)
}

export function shopTotal(itemId: string, unitKopecks: number, quantity: number): number {
  const subtotal = unitKopecks * quantity
  const discount = itemId === 'subscription_plus' ? plusDiscount(quantity) : 0
  return subtotal - Math.floor(subtotal * discount / 100)
}
