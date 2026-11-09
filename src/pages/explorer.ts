import type { AppData, ExplorerFilters } from '../types/achievement'
import { buildFilters, applyFilters, renderFilters } from '../components/explorer/filters'
import { achievementCard } from '../components/explorer/card'
import { renderDetailPanel } from '../components/explorer/detail-panel'

export function renderExplorer(section: HTMLElement, data: AppData) {
  const { achievements } = data
  let filters: ExplorerFilters = buildFilters(achievements)
  let viewMode: 'card' | 'table' = 'card'

  section.innerHTML = `
    <div class="section-inner">
      <div class="section-header">
        <h2 class="section-title">Achievement Explorer</h2>
        <p class="section-desc">Browse and filter all 23 achievements. Click any card for full detail and evidence attribution.</p>
      </div>

      <div id="filters-container"></div>

      <div class="explorer-toolbar">
        <p class="result-count" id="result-count" aria-live="polite" aria-atomic="true">
          Showing 23 of 23 achievements
        </p>
        <div class="view-toggle" role="group" aria-label="View mode">
          <button class="view-btn view-btn--active" data-view="card" type="button" aria-pressed="true">Cards</button>
          <button class="view-btn" data-view="table" type="button" aria-pressed="false">Table</button>
        </div>
      </div>

      <div id="achievements-grid" class="achievements-grid" role="list" aria-label="Achievement cards"></div>
      <div id="achievements-table" class="achievements-table" hidden></div>
      <div id="detail-panel-container"></div>

      <p class="explorer-disclaimer">
        1 achievement (ACH-023) is firsthand-attested with no platform record.
        4 achievements carry an ambiguous review status where source evidence was partially illegible.
        All other achievements are sourced from IMLeagues PDF trophy records.
      </p>
    </div>
  `

  const filtersContainer  = section.querySelector<HTMLElement>('#filters-container')!
  const grid              = section.querySelector<HTMLElement>('#achievements-grid')!
  const tableContainer    = section.querySelector<HTMLElement>('#achievements-table')!
  const resultCount       = section.querySelector<HTMLElement>('#result-count')!
  const panelContainer    = section.querySelector<HTMLElement>('#detail-panel-container')!

  const panel = renderDetailPanel(panelContainer)

  function renderGrid(filtered: ReturnType<typeof applyFilters>) {
    grid.innerHTML = ''
    if (filtered.length === 0) {
      grid.innerHTML = `<p class="no-results">No achievements match the current filters.</p>`
      return
    }
    filtered.forEach(a => {
      const card = achievementCard(a, panel.open)
      card.setAttribute('role', 'listitem')
      grid.appendChild(card)
    })
  }

  function renderTable(filtered: ReturnType<typeof applyFilters>) {
    if (filtered.length === 0) {
      tableContainer.innerHTML = `<p class="no-results">No achievements match the current filters.</p>`
      return
    }
    tableContainer.innerHTML = `
      <table class="achievement-table" aria-label="Achievements">
        <thead>
          <tr>
            <th scope="col">Medal</th>
            <th scope="col">Sport</th>
            <th scope="col">Event</th>
            <th scope="col">Format</th>
            <th scope="col">Semester</th>
            <th scope="col">Evidence</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(a => `
            <tr class="table-row table-row--${a.medal_tier.toLowerCase()}" tabindex="0"
                data-id="${a.achievement_id}">
              <td><span class="table-medal table-medal--${a.medal_tier.toLowerCase()}">${a.medal_tier}</span></td>
              <td>${a.sport_normalized}</td>
              <td>${a.event_name_raw}${a.is_ambiguous ? ' <span class="badge badge--amber">?</span>' : ''}</td>
              <td>${a.event_format_display}</td>
              <td>${a.semester}</td>
              <td>${a.placement_evidence_type === 'platform_recorded' ? 'Platform' : '⚠ Firsthand'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    // Click on table row to open detail
    tableContainer.querySelectorAll<HTMLElement>('.table-row').forEach(row => {
      const id = row.dataset.id
      const ach = filtered.find(a => a.achievement_id === id)
      if (!ach) return
      const activate = () => panel.open(ach)
      row.addEventListener('click', activate)
      row.addEventListener('keydown', e => { if (e.key === 'Enter') activate() })
    })
  }

  function update(newFilters: ExplorerFilters) {
    filters = newFilters
    const filtered = applyFilters(achievements, filters)
    resultCount.textContent = `Showing ${filtered.length} of ${achievements.length} achievements`
    if (viewMode === 'card') renderGrid(filtered)
    else renderTable(filtered)
  }

  renderFilters(filtersContainer, achievements, filters, update)
  renderGrid(achievements)

  // View toggle
  section.querySelectorAll<HTMLButtonElement>('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      viewMode = btn.dataset.view as 'card' | 'table'
      section.querySelectorAll('.view-btn').forEach(b => {
        b.setAttribute('aria-pressed', String(b === btn))
        b.classList.toggle('view-btn--active', b === btn)
      })
      grid.hidden = viewMode === 'table'
      tableContainer.hidden = viewMode === 'card'
      const filtered = applyFilters(achievements, filters)
      if (viewMode === 'table') renderTable(filtered)
      else renderGrid(filtered)
    })
  })
}
