'use client'

import { useState, useCallback } from 'react'

type SentenceResult = {
  text: string
  ai_score: number
  flagged: boolean
  reasons: string[]
}

type AnalysisResult = {
  human_score: number
  ai_probability: number
  flagged_sentences: SentenceResult[]
  all_sentences: SentenceResult[]
  summary: {
    total_sentences: number
    flagged_count: number
    avg_ai_score: number
    word_count: number
    char_count: number
  }
}

const SAMPLES = [
  `The implementation of a comprehensive framework for optimizing pedagogical outcomes necessitates a multifaceted approach that leverages cutting-edge methodologies to facilitate enhanced learning experiences. It is important to note that in today's educational landscape, the utilization of innovative strategies has become increasingly paramount. Furthermore, the synergistic integration of technology and traditional instruction methodologies represents a paradigm shift in how we conceptualize academic achievement. Consequently, educators must prioritize the implementation of holistic assessment frameworks to adequately measure student progress across diverse learning modalities.`,
  `I was nervous about my presentation, so I practiced it three times in front of my roommate. She said I kept fidgeting with my hands, so I tried to keep them still. By the time class came around, I felt pretty ready. The professor asked a tough question at the end, but I managed to answer it using the research I'd done the night before. Honestly, I think it went better than I expected.`,
]

const REASON_LABELS: Record<string, string> = {
  formulaic_pattern: 'Formulaic phrasing',
  pompous_vocab: 'Overly formal vocabulary',
  repetitive_phrase: 'Overused transition phrase',
  fluff: 'Unnecessary filler word',
  verbose: 'Overly long sentence',
  overly_complex: 'Unnecessarily complex words',
}

const SCORE_COLORS = (score: number) => {
  if (score >= 0.8) return { text: 'text-emerald-600', bg: 'bg-emerald-500', label: 'Excellent' }
  if (score >= 0.6) return { text: 'text-emerald-500', bg: 'bg-emerald-400', label: 'Good' }
  if (score >= 0.4) return { text: 'text-amber-500', bg: 'bg-amber-400', label: 'Needs Work' }
  return { text: 'text-red-500', bg: 'bg-red-400', label: 'Robotic' }
}

export default function Home() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)

  const analyze = useCallback(async () => {
    if (text.trim().length < 20) {
      setError('Please enter at least 20 characters.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Analysis failed')
      }
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }, [text])

  const loadSample = (sample: string) => {
    setText(sample)
    setResult(null)
    setError('')
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">&#9888;</span>
            <span className="font-bold text-lg tracking-tight">Pause & Report</span>
          </div>
          <span className="text-sm text-[var(--muted)]">AI Detector for Students</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Does your writing <span className="text-[var(--accent)]">sound human</span>?
          </h1>
          <p className="text-lg text-[var(--muted)] max-w-xl mx-auto">
            Paste your draft below. We&apos;ll flag sentences that sound robotic so you can
            fix them before submitting.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="text-input" className="text-sm font-medium text-[var(--muted)]">
              Paste your text here
            </label>
            <div className="flex gap-2">
              {SAMPLES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => loadSample(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  Sample {i + 1}
                </button>
              ))}
            </div>
          </div>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => { setText(e.target.value); setResult(null); setError('') }}
            placeholder="Paste your essay, paper, or any text you want to check..."
            rows={8}
            className="w-full resize-none rounded-lg border border-[var(--border)] p-4 text-sm leading-relaxed outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-[var(--muted)]">
              {text.length > 0 ? `${text.length} characters` : 'Minimum 20 characters'}
            </span>
            <button
              onClick={analyze}
              disabled={loading || text.trim().length < 20}
              className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-lg font-medium text-sm hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                  <span className="loading-dot" />
                </span>
              ) : (
                'Analyze Text'
              )}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-[var(--danger)] bg-[var(--danger-light)] rounded-lg px-4 py-2">
              {error}
            </p>
          )}
        </div>

        {result && (
          <div className="mt-8 space-y-6 animate-fade-in">
            <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-sm text-[var(--muted)] mb-2">Human Score</div>
                  <div className={`text-4xl font-bold ${SCORE_COLORS(result.human_score).text}`}>
                    {Math.round(result.human_score * 100)}%
                  </div>
                  <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full score-bar ${SCORE_COLORS(result.human_score).bg}`}
                      style={{ width: `${result.human_score * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    {SCORE_COLORS(result.human_score).label}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-[var(--muted)] mb-2">AI Probability</div>
                  <div className="text-4xl font-bold text-[var(--danger)]">
                    {Math.round(result.ai_probability * 100)}%
                  </div>
                  <div className="mt-2 text-xs text-[var(--muted)]">
                    Confidence score
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-[var(--muted)] mb-2">Flagged Sentences</div>
                  <div className="text-4xl font-bold text-[var(--warning)]">
                    {result.summary.flagged_count}
                    <span className="text-lg text-[var(--muted)]">/{result.summary.total_sentences}</span>
                  </div>
                  <div className="mt-2 text-xs text-[var(--muted)]">
                    {result.summary.word_count} words
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Sentence Breakdown</h2>
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  {showAll ? 'Show flagged only' : 'Show all sentences'}
                </button>
              </div>
              <div className="space-y-2">
                {(showAll ? result.all_sentences : result.flagged_sentences).length === 0 && (
                  <p className="text-sm text-[var(--muted)] text-center py-6">
                    No flagged sentences found. Your writing looks natural!
                  </p>
                )}
                {(showAll ? result.all_sentences : result.flagged_sentences).map((s, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-sm leading-relaxed animate-fade-in-up ${
                      s.flagged ? 'sentence-flagged' : 'sentence-clean'
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`shrink-0 mt-0.5 ${s.flagged ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}>
                        {s.flagged ? '&#9888;' : '&#10003;'}
                      </span>
                      <div className="flex-1">
                        <p>{s.text}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            s.flagged ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            AI score: {Math.round(s.ai_score * 100)}%
                          </span>
                          {s.reasons.slice(0, 2).map((r) => (
                            <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              {REASON_LABELS[r] || r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 border-t border-[var(--border)] pt-8 text-center text-sm text-[var(--muted)]">
          <p>
            Pause & Report is a <strong>confidence tool</strong> — not a plagiarism checker.
            It helps you spot robotic phrasing so your work sounds authentically human.
          </p>
        </div>
      </main>
    </div>
  )
}
