import re
import math
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


REPETITIVE_PATTERNS = [
    (r'\b(moreover|furthermore|additionally|consequently|notably|specifically|particularly)\b[,]?\s', 0.15),
    (r'\b(it is (important|noteworthy|crucial|essential|worth) to)\b', 0.20),
    (r'\b(in (order )?to (better )?(understand|comprehend|analyze|examine))\b', 0.18),
    (r'\b(as (previously|aforementioned|discussed|mentioned) (above|below|earlier))\b', 0.22),
    (r'\b(the (following|aforementioned|abovementioned|subsequent))\b', 0.15),
    (r'\b(this (underscores|highlights|illuminates|elucidates|demonstrates))\b', 0.18),
    (r'\b(a (plethora|multitude|myriad|dearth) of)\b', 0.20),
    (r'\b(in (today\'s|the (modern|contemporary|current)) (world|society|era|landscape))\b', 0.22),
    (r'\b(it is (widely|generally|commonly) (acknowledged|recognized|accepted|believed) that\b)', 0.20),
]

TRANSITION_WORDS = {
    'moreover', 'furthermore', 'additionally', 'consequently', 'therefore',
    'henceforth', 'thereafter', 'herein', 'hereby', 'heretofore',
    'notwithstanding', 'nevertheless', 'nonetheless', 'thusly',
    'utilize', 'utilizing', 'utilization', 'leverage', 'leveraging',
    'optimize', 'optimizing', 'optimization', 'facilitate', 'facilitating',
    'implementation', 'implementing', 'paradigm', 'paradigm shift',
    'groundbreaking', 'cutting-edge', 'state-of-the-art', 'world-class',
    'innovative', 'revolutionary', 'game-changing', 'best-in-class',
    'holistic', 'holistically', 'streamline', 'streamlining',
    'actionable', 'action items', 'circle back', 'touch base',
    'synergy', 'synergistic', 'synergize', 'deep dive',
}

REPETITIVE_PHRASES = [
    'in conclusion', 'to summarize', 'in summary', 'to conclude',
    'as can be seen', 'it can be seen that', 'it should be noted that',
    'it is worth noting that', 'it goes without saying',
    'all things considered', 'when all is said and done',
    'at the end of the day', 'in the final analysis',
]

FLUFF_WORDS = {
    'very', 'really', 'quite', 'somewhat', 'rather', 'highly',
    'extremely', 'incredibly', 'remarkably', 'significantly',
    'substantially', 'exceedingly', 'excessively', 'exceptionally',
}


def tokenize(text):
    return re.findall(r'\b\w+\b', text.lower())


def sentences(text):
    raw = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s for s in raw if len(s.strip()) > 10]


def score_sentence(sentence):
    score = 0.0
    reasons = []
    lower = sentence.lower()

    for pattern, weight in REPETITIVE_PATTERNS:
        if re.search(pattern, lower, re.IGNORECASE):
            score += weight
            reasons.append('formulaic_pattern')

    words = tokenize(lower)
    for w in words:
        if w in TRANSITION_WORDS:
            score += 0.04
            if len(reasons) < 5 and 'pompous_vocab' not in reasons:
                reasons.append('pompous_vocab')

    for phrase in REPETITIVE_PHRASES:
        if phrase in lower:
            score += 0.18
            if 'repetitive_phrase' not in reasons:
                reasons.append('repetitive_phrase')

    for w in words:
        if w in FLUFF_WORDS:
            score += 0.05
            if len(reasons) < 5 and 'fluff' not in reasons:
                reasons.append('fluff')

    if len(words) > 40:
        score += 0.08
        if 'verbose' not in reasons:
            reasons.append('verbose')

    avg_word_len = sum(len(w) for w in words) / max(len(words), 1)
    if avg_word_len > 6.5:
        score += 0.10
        if 'overly_complex' not in reasons:
            reasons.append('overly_complex')

    if len(words) < 5:
        score -= 0.1

    return min(max(score, 0.0), 1.0), list(set(reasons))


def analyze_text(text):
    sents = sentences(text)
    if not sents:
        return {
            'human_score': 1.0,
            'ai_probability': 0.0,
            'flagged_sentences': [],
            'summary': {'total_sentences': 0, 'flagged_count': 0, 'avg_score': 0.0}
        }

    results = []
    for s in sents:
        score, reasons = score_sentence(s)
        results.append({
            'text': s.strip(),
            'ai_score': round(score, 3),
            'flagged': score > 0.25,
            'reasons': reasons
        })

    flagged = [r for r in results if r['flagged']]
    avg_score = sum(r['ai_score'] for r in results) / len(results)
    # human_score is 1 - weighted avg, penalized by ratio of flagged sentences
    flagged_ratio = len(flagged) / max(len(results), 1)
    human_score = max(0.0, 1.0 - (avg_score * 0.6 + flagged_ratio * 0.4))

    word_count = len(tokenize(text))
    char_count = len(text)

    return {
        'human_score': round(human_score, 3),
        'ai_probability': round(1.0 - human_score, 3),
        'flagged_sentences': flagged,
        'all_sentences': results,
        'summary': {
            'total_sentences': len(results),
            'flagged_count': len(flagged),
            'avg_ai_score': round(avg_score, 3),
            'word_count': word_count,
            'char_count': char_count
        }
    }


@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400

    text = data['text'].strip()
    if len(text) < 20:
        return jsonify({'error': 'Text must be at least 20 characters'}), 400

    if len(text) > 50000:
        return jsonify({'error': 'Text too long (max 50,000 characters)'}), 400

    result = analyze_text(text)
    return jsonify(result)


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'version': '1.0.0'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
