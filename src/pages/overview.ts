import type { AppData } from '../types/achievement'
import { renderKpiStrip } from '../components/kpi-strip'
import { renderTableauEmbed } from '../components/tableau-embed'

export function renderOverview(section: HTMLElement, data: AppData) {
  section.innerHTML = `
    <div class="section-inner">
      <div class="hero">
        <div class="hero-text">
          <p class="hero-eyebrow">Beyond the Classroom</p>
          <h1 class="hero-title">Mukesh Ravichandran</h1>
          <p class="hero-subtitle">MS Computer Science · East Texas A&amp;M University</p>
          <p class="hero-tagline">
            23 intramural medals across 9 sports and 5 semesters —
            tracked, validated, and engineered into a reproducible analytics pipeline.
          </p>
        </div>
      </div>

      <div id="kpi-strip-container"></div>

      <div class="overview-intro">
        <p>
          This portfolio documents every intramural podium finish from Fall 2024 through Fall 2026,
          backed by IMLeagues platform records and a Python/DuckDB data pipeline with 79 validation rules.
          Explore the data, the semester-by-semester journey, and the engineering decisions behind it.
        </p>
      </div>

      <div class="tableau-section">
        <h2 class="section-heading">Medal Distribution</h2>
        <div id="tableau-embed-container"></div>
      </div>
    </div>
  `

  renderKpiStrip(section.querySelector('#kpi-strip-container')!, data)
  renderTableauEmbed(section.querySelector('#tableau-embed-container')!)
}
