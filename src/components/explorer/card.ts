import type { Achievement } from '../../types/achievement'

const MEDAL_EMOJI: Record<string, string> = { Gold: '🥇', Silver: '🥈', Bronze: '🥉' }

export function achievementCard(a: Achievement, onClick: (a: Achievement) => void): HTMLElement {
  const el = document.createElement('article')
  el.className = `achievement-card achievement-card--${a.medal_tier.toLowerCase()}`
  el.setAttribute('tabindex', '0')
  el.setAttribute('role', 'button')
  el.setAttribute('aria-label', `${a.medal_tier} medal — ${a.sport_normalized} — ${a.semester}`)

  el.innerHTML = `
    <div class="card-medal-band">
      <span class="card-medal-badge card-medal-badge--${a.medal_tier.toLowerCase()}" aria-hidden="true">
        ${MEDAL_EMOJI[a.medal_tier]}
      </span>
      <span class="card-medal-text">${a.medal_tier}</span>
      ${a.is_ambiguous ? `<span class="badge badge--amber" title="Source review ambiguous">Ambiguous</span>` : ''}
      ${a.placement_evidence_type === 'firsthand_attested' ? `<span class="badge badge--blue" title="Firsthand attestation">Firsthand</span>` : ''}
    </div>
    <div class="card-body">
      <h3 class="card-sport">${a.sport_normalized}</h3>
      <p class="card-event">${a.event_name_raw}</p>
      <p class="card-meta">${a.event_format_display} · ${a.semester}</p>
    </div>
    ${a.has_record ? `
    <div class="card-record">
      <span>${a.wins_reported ?? '—'}W · ${a.losses_reported ?? '—'}L · ${a.ties_reported ?? '—'}T</span>
    </div>` : ''}
  `

  const activate = () => onClick(a)
  el.addEventListener('click', activate)
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() } })

  return el
}
