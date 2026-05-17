// Injects a "Scan with Pause & Report" button into supported editors
(function () {
  'use strict'

  const BUTTON_ID = 'pause-and-report-btn'
  const API_URL = 'https://pause-and-report-ai-detector.vercel.app/api/analyze'

  let btn = null
  let overlay = null

  function createButton() {
    if (document.getElementById(BUTTON_ID)) return
    btn = document.createElement('button')
    btn.id = BUTTON_ID
    btn.textContent = 'Scan with Pause & Report'
    btn.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 10000;
      background: #059669; color: white; border: none;
      padding: 10px 18px; border-radius: 8px; font-size: 13px;
      font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transition: transform 0.15s, box-shadow 0.15s;
    `
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-1px)'
      btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
    })
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)'
      btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
    })
    btn.addEventListener('click', scanDocument)
    document.body.appendChild(btn)
  }

  function showOverlay(text) {
    removeOverlay()
    overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 99999;
      display: flex; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `
    overlay.addEventListener('click', (e) => { if (e.target === overlay) removeOverlay() })

    const card = document.createElement('div')
    card.style.cssText = `
      background: white; border-radius: 16px; padding: 32px;
      max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `

    const closeBtn = document.createElement('button')
    closeBtn.textContent = 'Close'
    closeBtn.style.cssText = `
      float: right; background: none; border: 1px solid #e7e5e4;
      border-radius: 6px; padding: 4px 12px; cursor: pointer;
      font-size: 13px; color: #78716c;
    `
    closeBtn.addEventListener('click', removeOverlay)

    const title = document.createElement('h2')
    title.textContent = 'Pause & Report Results'
    title.style.cssText = 'margin: 0 0 16px 0; font-size: 18px; font-weight: 700;'

    const scoreDiv = document.createElement('div')
    scoreDiv.style.cssText = 'text-align: center; margin-bottom: 20px;'

    const pct = document.createElement('div')
    pct.style.cssText = 'font-size: 42px; font-weight: 800; color: #059669;'
    pct.textContent = Math.round(text.human_score * 100) + '%'

    const label = document.createElement('div')
    label.style.cssText = 'font-size: 13px; color: #78716c; margin-top: 4px;'
    label.textContent = 'Human Score'

    const barOuter = document.createElement('div')
    barOuter.style.cssText = 'margin-top: 10px; height: 8px; background: #f5f5f4; border-radius: 4px; overflow: hidden;'

    const barInner = document.createElement('div')
    const pctVal = text.human_score * 100
    barInner.style.cssText = `height: 100%; border-radius: 4px; width: ${pctVal}%; background: ${pctVal >= 60 ? '#059669' : pctVal >= 40 ? '#d97706' : '#dc2626'}; transition: width 0.8s ease;`

    barOuter.appendChild(barInner)
    scoreDiv.appendChild(pct)
    scoreDiv.appendChild(label)
    scoreDiv.appendChild(barOuter)

    const flaggedLabel = document.createElement('p')
    flaggedLabel.style.cssText = 'font-size: 14px; color: #78716c; margin-bottom: 12px;'
    flaggedLabel.textContent = `${text.summary.flagged_count} of ${text.summary.total_sentences} sentences flagged`

    const list = document.createElement('div')
    list.style.cssText = 'display: flex; flex-direction: column; gap: 8px;'

    const flagged = text.flagged_sentences || []
    if (flagged.length === 0) {
      const none = document.createElement('p')
      none.style.cssText = 'text-align: center; color: #059669; font-size: 14px; padding: 16px;'
      none.textContent = 'No robotic-sounding sentences found!'
      list.appendChild(none)
    } else {
      flagged.slice(0, 10).forEach((s) => {
        const item = document.createElement('div')
        item.style.cssText = 'padding: 10px; background: #fee2e2; border-left: 3px solid #dc2626; border-radius: 4px; font-size: 13px; line-height: 1.5;'
        item.textContent = s.text.length > 120 ? s.text.slice(0, 120) + '...' : s.text
        list.appendChild(item)
      })
      if (flagged.length > 10) {
        const more = document.createElement('p')
        more.style.cssText = 'text-align: center; font-size: 12px; color: #78716c;'
        more.textContent = `...and ${flagged.length - 10} more flagged sentences`
        list.appendChild(more)
      }
    }

    card.appendChild(closeBtn)
    card.appendChild(title)
    card.appendChild(scoreDiv)
    card.appendChild(flaggedLabel)
    card.appendChild(list)
    overlay.appendChild(card)
    document.body.appendChild(overlay)
  }

  function removeOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay)
    overlay = null
  }

  function getDocumentText() {
    const sel = window.getSelection()
    const selectedText = sel ? sel.toString().trim() : ''
    if (selectedText.length > 20) return selectedText

    const body = document.body
    const paragraphs = body.querySelectorAll('p')
    const texts = Array.from(paragraphs).map(p => p.textContent).filter(Boolean)
    return texts.join('\n').trim()
  }

  async function scanDocument() {
    btn.textContent = 'Scanning...'
    btn.disabled = true

    try {
      const text = getDocumentText()
      if (!text || text.length < 20) {
        alert('Could not find enough text. Try selecting text manually first.')
        return
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!res.ok) throw new Error('API request failed')

      const data = await res.json()
      showOverlay(data)
    } catch (err) {
      alert('Analysis failed: ' + err.message)
    } finally {
      btn.textContent = 'Scan with Pause & Report'
      btn.disabled = false
    }
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createButton)
    } else {
      createButton()
    }
  }

  init()
})()
