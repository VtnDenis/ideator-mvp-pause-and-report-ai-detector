import { NextRequest, NextResponse } from 'next/server'

const REPETITIVE_PATTERNS: [RegExp, number][] = [
  [/(moreover|furthermore|additionally|consequently|notably|specifically|particularly)\b[,]?\s/i, 0.15],
  [/(it is (important|noteworthy|crucial|essential|worth) to)\b/i, 0.20],
  [/(in (order )?to (better )?(understand|comprehend|analyze|examine))\b/i, 0.18],
  [/(as (previously|aforementioned|discussed|mentioned) (above|below|earlier))/i, 0.22],
  [/(the (following|aforementioned|abovementioned|subsequent))/i, 0.15],
  [/(this (underscores|highlights|illuminates|elucidates|demonstrates))/i, 0.18],
  [/(a (plethora|multitude|myriad|dearth) of)/i, 0.20],
  [/(in (today's|the (modern|contemporary|current)) (world|society|era|landscape))/i, 0.22],
  [/(it is (widely|generally|commonly) (acknowledged|recognized|accepted|believed) that)/i, 0.20],
]

const TRANSITION_WORDS = new Set([
  'moreover', 'furthermore', 'additionally', 'consequently', 'therefore',
  'henceforth', 'thereafter', 'herein', 'hereby', 'heretofore',
  'notwithstanding', 'nevertheless', 'nonetheless', 'thusly',
  'utilize', 'utilizing', 'utilization', 'leverage', 'leveraging',
  'optimize', 'optimizing', 'optimization', 'facilitate', 'facilitating',
  'implementation', 'implementing', 'paradigm', 'paradigm shift',
  'groundbreaking', 'cutting-edge', 'state-of-the-art', 'world-class',
  'innovative', 'revolutionary', 'game-changing', 'best-in-class',
  'holistic', 'holistically', 'streamline', 'streamlining',
  'actionable', 'synergy', 'synergistic', 'synergize',
])

const REPETITIVE_PHRASES = [
  'in conclusion', 'to summarize', 'in summary', 'to conclude',
  'as can be seen', 'it can be seen that', 'it should be noted that',
  'it is worth noting that', 'it goes without saying',
  'all things considered', 'when all is said and done',
  'at the end of the day', 'in the final analysis',
]

const FLUFF_WORDS = new Set([
  'very', 'really', 'quite', 'somewhat', 'rather', 'highly',
  'extremely', 'incredibly', 'remarkably', 'significantly',
  'substantially', 'exceedingly', 'excessively', 'exceptionally',
])

function tokenize(text: string): string[] {
  return Array.from(text.toLowerCase().matchAll(/\b\w+\b/g)).map(m => m[0])
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10)
}

function scoreSentence(sentence: string): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []
  const lower = sentence.toLowerCase()

  for (const [pattern, weight] of REPETITIVE_PATTERNS) {
    if (pattern.test(lower)) {
      score += weight
      if (!reasons.includes('formulaic_pattern')) reasons.push('formulaic_pattern')
    }
  }

  const words = tokenize(lower)
  for (const w of words) {
    if (TRANSITION_WORDS.has(w)) {
      score += 0.04
      if (!reasons.includes('pompous_vocab')) reasons.push('pompous_vocab')
    }
  }

  for (const phrase of REPETITIVE_PHRASES) {
    if (lower.includes(phrase)) {
      score += 0.18
      if (!reasons.includes('repetitive_phrase')) reasons.push('repetitive_phrase')
    }
  }

  for (const w of words) {
    if (FLUFF_WORDS.has(w)) {
      score += 0.05
      if (!reasons.includes('fluff')) reasons.push('fluff')
    }
  }

  if (words.length > 40) {
    score += 0.08
    if (!reasons.includes('verbose')) reasons.push('verbose')
  }

  const avgWordLen = words.reduce((a, w) => a + w.length, 0) / Math.max(words.length, 1)
  if (avgWordLen > 6.5) {
    score += 0.10
    if (!reasons.includes('overly_complex')) reasons.push('overly_complex')
  }

  if (words.length < 5) score -= 0.1

  return { score: Math.min(Math.max(score, 0), 1), reasons: [...new Set(reasons)] }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body || !body.text || typeof body.text !== 'string') {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const text = body.text.trim()
    if (text.length < 20) {
      return NextResponse.json({ error: 'Text must be at least 20 characters' }, { status: 400 })
    }
    if (text.length > 50000) {
      return NextResponse.json({ error: 'Text too long (max 50,000 characters)' }, { status: 400 })
    }

    const sents = sentences(text)
    if (sents.length === 0) {
      return NextResponse.json({
        human_score: 1.0,
        ai_probability: 0.0,
        flagged_sentences: [],
        all_sentences: [],
        summary: { total_sentences: 0, flagged_count: 0, avg_ai_score: 0, word_count: 0, char_count: 0 }
      })
    }

    const results = sents.map(s => {
      const { score, reasons } = scoreSentence(s)
      return { text: s.trim(), ai_score: Math.round(score * 1000) / 1000, flagged: score > 0.25, reasons }
    })

    const flagged = results.filter(r => r.flagged)
    const avgScore = results.reduce((a, r) => a + r.ai_score, 0) / results.length
    const flaggedRatio = flagged.length / results.length
    const humanScore = Math.max(0, 1 - (avgScore * 0.6 + flaggedRatio * 0.4))

    return NextResponse.json({
      human_score: Math.round(humanScore * 1000) / 1000,
      ai_probability: Math.round((1 - humanScore) * 1000) / 1000,
      flagged_sentences: flagged,
      all_sentences: results,
      summary: {
        total_sentences: results.length,
        flagged_count: flagged.length,
        avg_ai_score: Math.round(avgScore * 1000) / 1000,
        word_count: tokenize(text).length,
        char_count: text.length
      }
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
