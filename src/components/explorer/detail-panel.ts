import type { Achievement } from '../../types/achievement'

export function renderDetailPanel(container: HTMLElement) {
  container.innerHTML = `
    <aside class="detail-panel" id="detail-panel" role="complementary" aria-label="Achievement detail" hidden>
      <div class="detail-panel-inner">
        <button class="detail-close" aria-label="Close detail panel" type="button">✕</button>
        <div class="detail-content" id="detail-content"></div>
      </div>
    </aside>
    <div class="detail-backdrop" id="detail-backdrop" hidden></div>
  `

  const panel    = container.querySelector<HTMLElement>('#detail-panel')!
  const backdrop = container.querySelector<HTMLElement>('#detail-backdrop')!
  const closeBtn = container.querySelector<HTMLButtonElement>('.detail-close')!

  const close = () => {
    panel.hidden = true
    backdrop.hidden = true
    document.body.classList.remove('panel-open')
  }

  closeBtn.addEventListener('click', close)
  backdrop.addEventListener('click', close)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })

  return {
    open(a: Achievement) {
      const content = container.querySelector<HTMLElement>('#detail-content')!
      content.innerHTML = `
        <div class="detail-header detail-header--${a.medal_tier.toLowerCase()}">
          <span class="detail-medal">${a.medal_tier} Medal</span>
          <h2 class="detail-sport">${a.sport_normalized}</h2>
        </div>
        <dl class="detail-fields">
          <div class="detail-field"><dt>Event</dt><dd>${a.event_name_raw}</dd></div>
          <div class="detail-field"><dt>Format</dt><dd>${a.event_format_display}</dd></div>
          <div class="detail-field"><dt>Semester</dt><dd>${a.semester}</dd></div>
          <div class="detail-field"><dt>Record</dt><dd>${
            a.has_record
              ? `${a.wins_reported ?? '—'}W · ${a.losses_reported ?? '—'}L · ${a.ties_reported ?? '—'}T`
              : 'Not recorded'
          }</dd></div>
          <div class="detail-field"><dt>Evidence</dt><dd>${
            a.placement_evidence_type === 'platform_recorded'
              ? 'IMLeagues platform record (PDF trophy screenshot)'
              : '⚠ Firsthand attestation — no platform record for this championship'
          }</dd></div>
          <div class="detail-field"><dt>Review Status</dt><dd>${
            a.is_ambiguous
              ? '⚠ Ambiguous — source review incomplete or evidence partially illegible'
              : '✓ Verified'
          }</dd></div>
          ${a.context_note ? `<div class="detail-field detail-field--full"><dt>Notes</dt><dd>${a.context_note}</dd></div>` : ''}
          <div class="detail-field"><dt>ID</dt><dd class="detail-id">${a.achievement_id}</dd></div>
        </dl>
      `
      panel.hidden = false
      backdrop.hidden = false
      document.body.classList.add('panel-open')
      closeBtn.focus()
    }
  }
}
