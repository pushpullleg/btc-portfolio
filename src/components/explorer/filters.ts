import type { Achievement, ExplorerFilters, MedalTier } from '../../types/achievement'

export function buildFilters(_achievements: Achievement[]): ExplorerFilters {
  return {
    sports: new Set<string>(),
    semesters: new Set<string>(),
    medals: new Set<MedalTier>(),
    evidenceType: 'all',
  }
}

export function applyFilters(achievements: Achievement[], filters: ExplorerFilters): Achievement[] {
  return achievements.filter(a => {
    if (filters.sports.size > 0 && !filters.sports.has(a.sport_normalized)) return false
    if (filters.semesters.size > 0 && !filters.semesters.has(a.semester)) return false
    if (filters.medals.size > 0 && !filters.medals.has(a.medal_tier)) return false
    if (filters.evidenceType !== 'all' && a.placement_evidence_type !== filters.evidenceType) return false
    return true
  })
}

/**
 * Accessible disclosure dropdown with native checkboxes.
 * Pattern: button (aria-expanded + aria-controls) → div → fieldset/legend + label+input pairs.
 * No listbox/option ARIA roles — native checkbox semantics carry checked state.
 */
function buildMultiselect(
  groupEl: HTMLElement,
  id: string,
  labelText: string,
  allLabel: string,
  options: string[],
  selected: Set<string>,
  onChange: (selected: Set<string>) => void
): { reset: () => void } {
  const triggerId  = `${id}-trigger`
  const dropdownId = `${id}-dropdown`

  groupEl.innerHTML = `
    <span class="filter-label">${labelText}</span>
    <div class="multiselect">
      <button class="multiselect-trigger"
              id="${triggerId}"
              type="button"
              aria-expanded="false"
              aria-controls="${dropdownId}"
              aria-label="${labelText}: ${allLabel}">
        <span class="multiselect-value" aria-hidden="true">${allLabel}</span>
        <span class="multiselect-arrow" aria-hidden="true">▾</span>
      </button>
      <div class="multiselect-dropdown" id="${dropdownId}" hidden>
        <fieldset class="multiselect-fieldset">
          <legend class="sr-only">Filter by ${labelText.toLowerCase()}</legend>
          ${options.map(opt => `
            <label class="multiselect-option">
              <input type="checkbox" value="${opt}" ${selected.has(opt) ? 'checked' : ''} />
              <span>${opt}</span>
            </label>
          `).join('')}
        </fieldset>
      </div>
    </div>
  `

  const trigger    = groupEl.querySelector<HTMLButtonElement>(`#${triggerId}`)!
  const dropdown   = groupEl.querySelector<HTMLElement>(`#${dropdownId}`)!
  const valueSpan  = trigger.querySelector<HTMLElement>('.multiselect-value')!

  const computeLabel = (): string => {
    if (selected.size === 0) return allLabel
    if (selected.size === 1) return [...selected][0]
    return `${selected.size} selected`
  }

  const syncLabel = () => {
    const label = computeLabel()
    valueSpan.textContent = label
    // Keep the button aria-label in sync so screen readers announce current selection
    trigger.setAttribute('aria-label', `${labelText}: ${label}`)
  }

  const openDropdown = () => {
    dropdown.hidden = false
    trigger.setAttribute('aria-expanded', 'true')
    dropdown.querySelector<HTMLInputElement>('input')?.focus()
  }

  const closeDropdown = () => {
    dropdown.hidden = true
    trigger.setAttribute('aria-expanded', 'false')
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation()
    dropdown.hidden ? openDropdown() : closeDropdown()
  })

  dropdown.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeDropdown()
      trigger.focus()
    }
  })

  const outsideClick = (e: MouseEvent) => {
    if (!groupEl.contains(e.target as Node)) closeDropdown()
  }
  document.addEventListener('click', outsideClick)

  dropdown.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) selected.add(cb.value)
      else selected.delete(cb.value)
      syncLabel()
      onChange(new Set(selected))
    })
  })

  return {
    reset() {
      selected.clear()
      dropdown.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(cb => {
        cb.checked = false
      })
      syncLabel()
      closeDropdown()
    },
  }
}

export function renderFilters(
  container: HTMLElement,
  achievements: Achievement[],
  filters: ExplorerFilters,
  onChange: (filters: ExplorerFilters) => void
) {
  const sports    = [...new Set(achievements.map(a => a.sport_normalized))].sort()
  const semesters = [...new Set(achievements.map(a => a.semester))]
    .sort((a, b) => {
      const keyOf = (s: string) => achievements.find(x => x.semester === s)?.semester_sort_key ?? 0
      return keyOf(a) - keyOf(b)
    })

  container.innerHTML = `
    <div class="explorer-filters" role="search" aria-label="Filter achievements">
      <div class="filter-group" id="fg-sport"></div>
      <div class="filter-group" id="fg-semester"></div>

      <div class="filter-group">
        <span class="filter-label" id="filter-medal-label">Medal</span>
        <div class="filter-chips" role="group" aria-labelledby="filter-medal-label">
          ${(['Gold', 'Silver', 'Bronze'] as MedalTier[]).map(m => `
            <button class="chip chip--${m.toLowerCase()}" data-medal="${m}"
                    aria-pressed="${filters.medals.has(m)}"
                    type="button">
              ${m}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label" id="filter-evidence-label">Evidence</span>
        <div class="filter-chips" role="group" aria-labelledby="filter-evidence-label">
          <button class="chip" data-evidence="all"               aria-pressed="${filters.evidenceType === 'all'}"               type="button">All</button>
          <button class="chip" data-evidence="platform_recorded"  aria-pressed="${filters.evidenceType === 'platform_recorded'}"  type="button">Platform</button>
          <button class="chip" data-evidence="firsthand_attested" aria-pressed="${filters.evidenceType === 'firsthand_attested'}" type="button">Firsthand</button>
        </div>
      </div>

      <button class="filter-reset btn btn--ghost" type="button" aria-label="Clear all filters">
        Reset
      </button>
    </div>
  `

  // Build multi-select controls
  const sportControl = buildMultiselect(
    container.querySelector('#fg-sport')!,
    'sport-ms', 'Sport', 'All Sports',
    sports, filters.sports,
    (sel) => { filters.sports = sel; onChange({ ...filters }) }
  )

  const semControl = buildMultiselect(
    container.querySelector('#fg-semester')!,
    'sem-ms', 'Semester', 'All Semesters',
    semesters, filters.semesters,
    (sel) => { filters.semesters = sel; onChange({ ...filters }) }
  )

  // Medal chips
  container.querySelectorAll<HTMLButtonElement>('[data-medal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const medal = btn.dataset.medal as MedalTier
      if (filters.medals.has(medal)) filters.medals.delete(medal)
      else filters.medals.add(medal)
      btn.setAttribute('aria-pressed', String(filters.medals.has(medal)))
      onChange({ ...filters })
    })
  })

  // Evidence chips
  container.querySelectorAll<HTMLButtonElement>('[data-evidence]').forEach(btn => {
    btn.addEventListener('click', () => {
      filters.evidenceType = btn.dataset.evidence as ExplorerFilters['evidenceType']
      container.querySelectorAll('[data-evidence]').forEach(b =>
        b.setAttribute('aria-pressed', String(b === btn))
      )
      onChange({ ...filters })
    })
  })

  // Reset — full re-render resets medal/evidence chips too
  container.querySelector('.filter-reset')!.addEventListener('click', () => {
    sportControl.reset()
    semControl.reset()
    filters.sports    = new Set()
    filters.semesters = new Set()
    filters.medals.clear()
    filters.evidenceType = 'all'
    renderFilters(container, achievements, filters, onChange)
    onChange({ ...filters })
  })
}
