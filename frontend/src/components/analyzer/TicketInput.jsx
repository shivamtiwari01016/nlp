import { ArrowUpRight, FileText } from 'lucide-react'

const MAX_LENGTH = 2000
const EXAMPLES = [
  'My payment was deducted twice and I need a refund.',
  'I cannot access my account after resetting my password.',
  'The application crashes whenever I open the dashboard.',
]

export default function TicketInput({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  validationError,
}) {
  return (
    <form className="ticket-form" onSubmit={onSubmit} noValidate>
      <label className="field-label" htmlFor="ticket-text">
        <span>Ticket description</span>
        <span className="field-label__hint">Include the customer’s issue and any relevant context</span>
      </label>
      <div className="ticket-form__input-wrap">
        <FileText size={18} aria-hidden="true" className="ticket-form__icon" />
        <textarea
          id="ticket-text"
          name="text"
          rows={8}
          maxLength={MAX_LENGTH}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isSubmitting}
          placeholder="Describe what happened, what the customer expected, and what they need next…"
          aria-describedby="ticket-count ticket-validation"
          aria-invalid={Boolean(validationError)}
        />
      </div>
      <div className="ticket-form__meta">
        <p id="ticket-validation" className="form-error" role="alert">
          {validationError || ''}
        </p>
        <span id="ticket-count" className="character-count">
          {value.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
        </span>
      </div>
      <div className="ticket-form__actions">
        <button className="button button--primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <><span className="button-spinner" aria-hidden="true" /> Analyzing ticket</>
          ) : (
            <>Analyze ticket <ArrowUpRight size={16} aria-hidden="true" /></>
          )}
        </button>
        <span className="ticket-form__privacy">Text is sent to the configured support API.</span>
      </div>
      <div className="ticket-examples" aria-label="Example tickets">
        <span>Try an example</span>
        {EXAMPLES.map((example) => (
          <button
            className="text-action"
            key={example}
            type="button"
            disabled={isSubmitting}
            onClick={() => onChange(example)}
          >
            {example}
          </button>
        ))}
      </div>
    </form>
  )
}
