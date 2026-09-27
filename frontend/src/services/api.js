import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
const API_V1_URL = `${API_BASE_URL}/api/v1`
const PREDICTION_TIMEOUT_MS = 45000
const HEALTH_TIMEOUT_MS = 5000
const DATA_TIMEOUT_MS = 10000

let healthCheckPromise

function normalizeUrgency(value) {
  if (typeof value === 'number') {
    if (Number.isFinite(value) && value >= 0 && value <= 1) return value
  } else if (value && typeof value === 'object' && Number.isFinite(value.score)) {
    const normalizedScore = value.score / 100
    if (normalizedScore >= 0 && normalizedScore <= 1) return normalizedScore
  }

  throw new Error('Received an invalid response from the NLP service.')
}

function normalizeTicket(record) {
  if (
    !record ||
    typeof record.ticket_id !== 'string' ||
    typeof record.text !== 'string' ||
    !['open', 'in_progress', 'resolved'].includes(record.status) ||
    typeof record.category !== 'string' ||
    typeof record.assigned_team !== 'string' ||
    !['Low', 'Medium', 'High'].includes(record.urgency_level) ||
    typeof record.created_at !== 'string'
  ) {
    throw new Error('Received an invalid response from the NLP service.')
  }

  const urgency = normalizeUrgency(record.urgency)
  return {
    id: record.ticket_id,
    ticketId: record.ticket_id,
    text: record.text,
    status: record.status,
    category: record.category,
    assignedTeam: record.assigned_team,
    urgency,
    score: urgency,
    urgencyLevel: record.urgency_level,
    level: record.urgency_level,
    createdAt: record.created_at,
  }
}

function apiError(error, notFoundMessage = 'The requested support data is unavailable.') {
  if (!axios.isAxiosError(error)) return error
  if (!error.response) {
    return new Error('Unable to connect to the NLP backend. Please verify that the FastAPI server is running.')
  }
  if (error.response.status === 404) return new Error(notFoundMessage)
  if (error.response.status === 422) return new Error('Please enter a valid support ticket.')
  if (error.response.status === 503) {
    return new Error('The support service or database is unavailable. Please try again shortly.')
  }
  if (error.response.status >= 500) {
    return new Error('The NLP service encountered an error. Please try again.')
  }
  return new Error('The NLP service could not complete the request. Please try again.')
}

export async function analyzeTicket(text) {
  try {
    const { data } = await axios.post(
      `${API_V1_URL}/predictions`,
      { text },
      { timeout: PREDICTION_TIMEOUT_MS },
    )

    if (!data || typeof data.category !== 'string' || !data.category.trim()) {
      throw new Error('Received an invalid response from the NLP service.')
    }

    return { ...normalizeTicket(data), category: data.category.trim() }
  } catch (error) {
    if (axios.isAxiosError(error)) throw apiError(error)
    throw error
  }
}

export async function getTickets(limit = 20) {
  try {
    const { data } = await axios.get(`${API_V1_URL}/tickets`, {
      params: { limit },
      timeout: DATA_TIMEOUT_MS,
    })
    if (!Array.isArray(data)) throw new Error('Received an invalid response from the NLP service.')
    return data.map(normalizeTicket)
  } catch (error) {
    throw apiError(error, 'Ticket history is unavailable from the backend.')
  }
}

export async function getTicket(ticketId) {
  try {
    const { data } = await axios.get(`${API_V1_URL}/tickets/${encodeURIComponent(ticketId)}`, {
      timeout: DATA_TIMEOUT_MS,
    })
    return normalizeTicket(data)
  } catch (error) {
    throw apiError(error, 'Ticket not found.')
  }
}

export async function getStatistics() {
  try {
    const { data } = await axios.get(`${API_V1_URL}/statistics`, { timeout: DATA_TIMEOUT_MS })
    if (
      !data ||
      !Number.isFinite(data.total_tickets) ||
      data.total_tickets < 0 ||
      !Number.isFinite(data.average_urgency) ||
      data.average_urgency < 0 ||
      data.average_urgency > 1 ||
      !data.category_distribution ||
      typeof data.category_distribution !== 'object' ||
      Array.isArray(data.category_distribution) ||
      Object.values(data.category_distribution).some((count) => !Number.isInteger(count) || count < 0)
    ) {
      throw new Error('Received an invalid response from the NLP service.')
    }
    return {
      totalTickets: data.total_tickets,
      averageUrgency: data.average_urgency,
      categoryDistribution: data.category_distribution,
    }
  } catch (error) {
    throw apiError(error)
  }
}

export async function getMetrics() {
  try {
    const { data } = await axios.get(`${API_V1_URL}/metrics`, { timeout: DATA_TIMEOUT_MS })
    const scoreFields = [
      'accuracy',
      'precision',
      'recall',
      'f1_score',
      'macro_precision',
      'macro_recall',
      'macro_f1',
      'majority_baseline_accuracy',
    ]
    if (
      !data ||
      scoreFields.some((field) => !Number.isFinite(data[field]) || data[field] < 0 || data[field] > 1)
    ) {
      throw new Error('Received an invalid response from the NLP service.')
    }
    return data
  } catch (error) {
    throw apiError(error)
  }
}

export function checkBackendHealth() {
  if (!healthCheckPromise) {
    healthCheckPromise = axios
      .get(`${API_V1_URL}/health`, { timeout: HEALTH_TIMEOUT_MS })
      .then(({ data }) =>
        data?.status === 'ok' &&
        data?.database === 'connected' &&
        data?.model === 'loaded' &&
        data?.nlp === 'ready',
      )
      .catch(() => false)
      .finally(() => {
        healthCheckPromise = undefined
      })
  }

  return healthCheckPromise
}
