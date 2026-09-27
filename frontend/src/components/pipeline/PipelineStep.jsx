export default function PipelineStep({ number, name, technique, description, detail, last = false }) {
  return (
    <article className={`pipeline-step${last ? ' pipeline-step--last' : ''}`}>
      <div className="pipeline-step__rail">
        <span className="pipeline-step__number">{String(number).padStart(2, '0')}</span>
        {!last && <span className="pipeline-step__connector" aria-hidden="true" />}
      </div>
      <div className="pipeline-step__body">
        <div className="pipeline-step__meta">
          <span className="pipeline-step__technique">{technique}</span>
        </div>
        <h3>{name}</h3>
        <p>{description}</p>
        {detail && <code className="pipeline-step__detail">{detail}</code>}
      </div>
    </article>
  )
}
