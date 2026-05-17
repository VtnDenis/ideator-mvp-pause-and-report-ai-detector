document.getElementById('scanBtn').addEventListener('click', async () => {
  const btn = document.getElementById('scanBtn')
  const resultDiv = document.getElementById('result')
  const errorDiv = document.getElementById('error')

  btn.disabled = true
  btn.textContent = 'Scanning...'
  resultDiv.style.display = 'none'
  errorDiv.style.display = 'none'

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab || !tab.id) throw new Error('No active tab found')

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const sel = window.getSelection()
        const text = sel ? sel.toString() : ''
        if (text.trim().length > 20) return text.trim()

        const body = document.body
        const article = body.querySelector('article') || body
        const paragraphs = article.querySelectorAll('p')
        const texts = Array.from(paragraphs).map(p => p.textContent).filter(Boolean)
        return texts.join('\n').trim()
      }
    })

    const text = results?.[0]?.result
    if (!text || text.length < 20) throw new Error('Could not find enough text on this page. Try selecting text manually first.')

    const API_URL = 'https://pause-and-report-ai-detector.vercel.app/api'
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })

    if (!res.ok) throw new Error('Analysis failed. Try again later.')

    const data = await res.json()

    const scoreEl = document.getElementById('humanScore')
    const barEl = document.getElementById('scoreBar')
    const countEl = document.getElementById('flaggedCount')

    const pct = Math.round(data.human_score * 100)
    scoreEl.textContent = pct + '%'
    barEl.style.width = pct + '%'
    barEl.style.background = pct >= 60 ? '#059669' : pct >= 40 ? '#d97706' : '#dc2626'
    countEl.textContent = data.summary.flagged_count

    resultDiv.style.display = 'block'
  } catch (err) {
    errorDiv.textContent = err.message
    errorDiv.style.display = 'block'
  } finally {
    btn.disabled = false
    btn.textContent = 'Scan Current Document'
  }
})
