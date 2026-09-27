export const CATEGORIES = [
  { name: 'Billing', color: '#147d72' },
  { name: 'Technical Support', color: '#d27655' },
  { name: 'Account', color: '#d5a746' },
  { name: 'General', color: '#617b99' },
]

export function categoryColor(name) {
  return CATEGORIES.find((category) => category.name === name)?.color || '#84928b'
}
