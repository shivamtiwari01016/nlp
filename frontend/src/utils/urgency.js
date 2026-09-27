export function getUrgencyPresentation(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { score: null, percentage: null, level: 'Unavailable', tone: 'neutral' }
  }

  const score = Math.min(1, Math.max(0, value))
  const percentage = Math.round(score * 100)
  const level = score < 0.34 ? 'Low' : score < 0.67 ? 'Medium' : 'High'
  const tone = level.toLowerCase()

  return { score, percentage, level, tone }
}

export function getUrgencyLevel(score) {
  return getUrgencyPresentation(score).level
}
