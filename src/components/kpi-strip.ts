import type { AppData } from '../types/achievement'

interface KpiTile {
  label: string
  value: number
  accent?: string
  sublabel?: string
}

function countUpAnimation(el: HTMLElement, target: number, duration = 1200) {
  const start = performance.now()
  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    el.textContent = String(Math.round(eased * target))
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export function renderKpiStrip(container: HTMLElement, data: AppData) {
  const summary = data.kpiMedal
  const gold   = summary.find(r => r.medal_tier === 'Gold')?.total_count ?? 0
  const silver = summary.find(r => r.medal_tier === 'Silver')?.total_count ?? 0
  const bronze = summary.find(r => r.medal_tier === 'Bronze')?.total_count ?? 0
  const total  = gold + silver + bronze
  const sports = new Set(data.achievements.map(a => a.sport_normalized)).size
  const semesters = new Set(data.achievements.map(a => a.semester)).size

  const tiles: KpiTile[] = [
    { label: 'Total Medals',    value: total,     sublabel: 'across all sports' },
    { label: 'Gold',            value: gold,       accent: 'gold' },
    { label: 'Silver',          value: silver,     accent: 'silver' },
    { label: 'Bronze',          value: bronze,     accent: 'bronze' },
    { label: 'Sports',          value: sports,     sublabel: 'distinct disciplines' },
    { label: 'Semesters',       value: semesters,  sublabel: 'of competition' },
  ]

  container.innerHTML = `
    <div class="kpi-strip" role="list" aria-label="Career statistics">
      ${tiles.map(t => `
        <div class="kpi-tile${t.accent ? ` kpi-tile--${t.accent}` : ''}" role="listitem">
          <span class="kpi-value" data-target="${t.value}">0</span>
          <span class="kpi-label">${t.label}</span>
          ${t.sublabel ? `<span class="kpi-sublabel">${t.sublabel}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `

  // Animate on first scroll-enter
  const strip = container.querySelector('.kpi-strip')!
  let animated = false
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !animated) {
      animated = true
      container.querySelectorAll<HTMLElement>('.kpi-value').forEach(el => {
        const target = parseInt(el.dataset.target ?? '0', 10)
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduced) { el.textContent = String(target) }
        else { countUpAnimation(el, target) }
      })
    }
  }, { threshold: 0.3 })
  obs.observe(strip)
}
