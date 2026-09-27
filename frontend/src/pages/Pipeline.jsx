import { GitBranch, TrendingUp } from 'lucide-react'
import PipelineStep from '../components/pipeline/PipelineStep'

const CATEGORY_STEPS = [
  { name: 'Raw ticket', technique: 'INPUT', description: 'The subject and customer description enter the system as plain text.', detail: 'subject + description' },
  { name: 'Text cleaning', technique: 'NORMALIZATION', description: 'URLs, email addresses, non-ASCII artifacts, punctuation and standalone numbers are removed; whitespace is normalized.', detail: 'clean_text(ticket)' },
  { name: 'Tokenization', technique: 'SPACY', description: 'The cleaned text is split into tokens, then validated for ASCII Latin-script words.', detail: 'en_core_web_sm · token.is_alpha' },
  { name: 'Stop-word removal', technique: 'LINGUISTIC FILTERING', description: 'Common English function words are excluded so issue-bearing terms receive more weight.', detail: 'spaCy English stop-word list' },
  { name: 'Lemmatization', technique: 'LINGUISTIC NORMALIZATION', description: 'Words are reduced to readable dictionary base forms rather than crude stem fragments.', detail: 'charged → charge' },
  { name: 'N-grams', technique: 'FEATURE ENGINEERING', description: 'Unigrams and adjacent bigrams preserve both individual terms and informative phrases.', detail: 'ngram_range=(1, 2)' },
  { name: 'POS tagging + chunking', technique: 'NOUN-PHRASE FEATURES', description: 'spaCy grammatical analysis identifies noun chunks, which are added as phrase features.', detail: 'phrase_internet_connection' },
  { name: 'Named entity recognition', technique: 'SPACY NER', description: 'Dates, monetary amounts and organizations are extracted; entity types become compact model features.', detail: 'DATE · MONEY · ORG' },
  { name: 'TF-IDF', technique: 'SPARSE REPRESENTATION', description: 'Term frequency is weighted by inverse document frequency to form an inspectable sparse vector.', detail: 'sublinear_tf · unigrams + bigrams' },
  { name: 'Logistic Regression', technique: 'SUPERVISED CLASSIFICATION', description: 'Class-weighted Logistic Regression maps ticket features to one of four support categories.', detail: 'class_weight=balanced' },
  { name: 'Category', technique: 'API RESPONSE', description: 'The trained model returns Billing, Technical Support, Account or General.', detail: '{ category }', last: true },
]

const URGENCY_STEPS = [
  { name: 'Ticket text', technique: 'INPUT', description: 'The original ticket wording is scored independently of category classification.', detail: 'original message' },
  { name: 'Sentiment analysis', technique: 'VADER', description: 'VADER produces a compound polarity value between -1 and 1.', detail: 'compound polarity' },
  { name: 'Urgency score', technique: 'TRANSPARENT HEURISTIC', description: 'More negative sentiment maps to a higher 0–100 urgency score and High, Medium or Low level.', detail: 'round((1 - compound) × 50)', last: true },
]

function PipelineTrack({ steps, title, description, kind }) {
  return (
    <section className={`pipeline-track pipeline-track--${kind}`}>
      <div className="pipeline-track__heading">
        <span className="pipeline-track__icon">{kind === 'category' ? <GitBranch size={17} aria-hidden="true" /> : <TrendingUp size={17} aria-hidden="true" />}</span>
        <div><p className="eyebrow">{kind === 'category' ? 'CLASSIFICATION PATH' : 'INDEPENDENT SIGNAL'}</p><h2>{title}</h2></div>
      </div>
      <p className="pipeline-track__description">{description}</p>
      <div className="pipeline-track__steps">
        {steps.map((step, index) => <PipelineStep key={step.name} number={index + 1} {...step} />)}
      </div>
    </section>
  )
}

export default function Pipeline() {
  return (
    <div className="page pipeline-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SYSTEM DESIGN / INFERENCE FLOW</p>
          <h1>NLP Pipeline</h1>
          <p className="page-heading__subtitle">Two independent outputs, with each transformation visible and explainable.</p>
        </div>
        <span className="pipeline-count">11 text stages <i /> 3 urgency stages</span>
      </div>
      <div className="pipeline-intro">
        <span className="pipeline-intro__index">01</span>
        <p>Ticket text is shared as input, then follows separate category and urgency paths. The browser only displays the backend response; it does not run NLP.</p>
      </div>
      <div className="pipeline-tracks">
        <PipelineTrack kind="category" title="Category classification" description="Linguistic features feed a sparse TF-IDF representation and an explainable linear classifier." steps={CATEGORY_STEPS} />
        <PipelineTrack kind="urgency" title="Sentiment-based urgency" description="A separate sentiment heuristic estimates urgency; it is not an SLA or learned priority label." steps={URGENCY_STEPS} />
      </div>
    </div>
  )
}
