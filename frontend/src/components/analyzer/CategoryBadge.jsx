const CATEGORY_LABELS = {
  billing: 'Billing',
  'technical support': 'Technical Support',
  technical: 'Technical Support',
  account: 'Account',
  general: 'General',
}

export default function CategoryBadge({ category }) {
  const label = CATEGORY_LABELS[String(category || '').trim().toLowerCase()] || category
  const tone = String(label || 'other').toLowerCase().replace(/\s+/g, '-')

  return <span className={`category-badge category-badge--${tone}`}>{label}</span>
}
