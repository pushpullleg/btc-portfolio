import type { AppData, KpiSemester } from '../types/achievement'

// Draft narratives — factual summaries from dataset. Personal reflections marked with [YOUR STORY].
const SEMESTER_NARRATIVES: Record<string, { summary: string; reflection: string }> = {
  'Fall 2024': {
    summary: 'Competed in four sports — Badminton, Table Tennis, Cornhole, and Volleyball — earning 6 medals in the first semester: 2 Gold, 2 Silver, and 2 Bronze. Podium finishes in every discipline entered.',
    reflection: '[YOUR STORY: What was your first semester like? Any memorable matches or moments from Fall 2024?]',
  },
  'Spring 2025': {
    summary: 'The most decorated semester: 7 medals across Badminton, Table Tennis, Pickleball, and Tennis. 2 Gold, 1 Silver, and 4 Bronze — including multiple finishes in racket and paddle sports.',
    reflection: '[YOUR STORY: Spring 2025 was your highest-medal semester. What drove that run?]',
  },
  'Fall 2025': {
    summary: '6 medals across Badminton, Table Tennis, Tennis, Dodgeball, and Cricket. 3 Gold, 0 Silver, 3 Bronze — a strong Gold-to-Bronze ratio and a first appearance in team sports.',
    reflection: '[YOUR STORY: Fall 2025 saw you branch into Cricket and Dodgeball. How did that feel?]',
  },
  'Spring 2026': {
    summary: '2 medals: 1 Gold (Badminton Doubles) and 1 Silver (Pickleball). The Badminton Doubles Gold is firsthand-attested with a 5–0–0 record — no IMLeagues platform championship record was generated.',
    reflection: '[YOUR STORY: The Badminton Doubles Gold this semester has a unique evidence story. What do you remember about that tournament?]',
  },
  'Fall 2026': {
    summary: '2 Gold medals — both in Badminton (Singles and Doubles). A focused, high-precision semester with a 100% Gold rate.',
    reflection: '[YOUR STORY: Finishing with 2 Golds in Fall 2026 — how did you close out your intramural career?]',
  },
}

function semesterNode(sem: KpiSemester, achievements: AppData['achievements']): string {
  const semAchs = achievements
    .filter(a => a.semester === sem.semester)
    .sort((a, b) => a.medal_rank - b.medal_rank)

  const narrative = SEMESTER_NARRATIVES[sem.semester] ?? {
    summary: '',
    reflection: '[YOUR STORY]',
  }

  const gold   = Number(sem.gold_count ?? 0)
  const silver = Number(sem.silver_count ?? 0)
  const bronze = Number(sem.bronze_count ?? 0)

  const medalBar = [
    gold   > 0 ? `<span class="sem-medal sem-medal--gold">${gold} Gold</span>` : '',
    silver > 0 ? `<span class="sem-medal sem-medal--silver">${silver} Silver</span>` : '',
    bronze > 0 ? `<span class="sem-medal sem-medal--bronze">${bronze} Bronze</span>` : '',
  ].filter(Boolean).join('')

  const achievementItems = semAchs.map(a => `
    <li class="timeline-ach timeline-ach--${a.medal_tier.toLowerCase()}">
      <span class="timeline-ach-medal">${a.medal_tier}</span>
      <span class="timeline-ach-sport">${a.sport_normalized}</span>
      <span class="timeline-ach-event">${a.event_format_display}</span>
      ${a.placement_evidence_type === 'firsthand_attested' ? `<span class="badge badge--blue">Firsthand</span>` : ''}
    </li>
  `).join('')

  return `
    <div class="timeline-node" data-semester="${sem.semester}">
      <div class="timeline-connector" aria-hidden="true">
        <div class="timeline-dot"></div>
        <div class="timeline-line"></div>
      </div>
      <div class="timeline-card">
        <button class="timeline-header" aria-expanded="false" aria-controls="sem-body-${sem.semester.replace(' ', '-')}">
          <div class="timeline-header-left">
            <h3 class="timeline-semester">${sem.semester}</h3>
            <div class="timeline-medals" aria-label="${sem.total_medals} medals">${medalBar}</div>
          </div>
          <span class="timeline-toggle-icon" aria-hidden="true">▸</span>
        </button>
        <div class="timeline-body" id="sem-body-${sem.semester.replace(' ', '-')}" hidden>
          <p class="timeline-summary">${narrative.summary}</p>
          <ul class="timeline-ach-list" aria-label="Achievements in ${sem.semester}">${achievementItems}</ul>
          <div class="timeline-reflection">
            <p class="reflection-label">Your story</p>
            <p class="reflection-text">${narrative.reflection}</p>
          </div>
        </div>
      </div>
    </div>
  `
}

export function renderJourney(section: HTMLElement, data: AppData) {
  const sorted = [...data.kpiSemester].sort((a, b) => a.semester_sort_key - b.semester_sort_key)

  section.innerHTML = `
    <div class="section-inner">
      <div class="section-header">
        <h2 class="section-title">University Journey</h2>
        <p class="section-desc">
          Five semesters of intramural competition at East Texas A&amp;M University, Fall 2024 through Fall 2026.
        </p>
      </div>

      <div class="career-arc">
        <p>
          <strong>23 medals</strong> across <strong>9 sports</strong> —
          from a 6-medal debut semester to back-to-back Golds in the final semester.
        </p>
      </div>

      <div class="timeline" aria-label="Semester timeline">
        ${sorted.map(sem => semesterNode(sem, data.achievements)).join('')}
      </div>
    </div>
  `

  // Expand/collapse
  section.querySelectorAll<HTMLButtonElement>('.timeline-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true'
      const bodyId = btn.getAttribute('aria-controls')!
      const body = document.getElementById(bodyId)
      const icon = btn.querySelector('.timeline-toggle-icon')
      btn.setAttribute('aria-expanded', String(!expanded))
      if (body) body.hidden = expanded
      if (icon) icon.textContent = expanded ? '▸' : '▾'
    })
  })
}
