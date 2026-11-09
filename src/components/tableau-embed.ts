const TABLEAU_URL = 'https://public.tableau.com/views/BC_17941918077170/BeyondtheClassroom'

export function renderTableauEmbed(container: HTMLElement) {
  const isMobile = window.innerWidth < 768

  if (isMobile) {
    container.innerHTML = `
      <div class="tableau-mobile-fallback">
        <p>View the interactive dashboard on a larger screen, or</p>
        <a href="${TABLEAU_URL}?:showVizHome=no&:embed=true"
           class="btn btn--primary"
           target="_blank"
           rel="noopener noreferrer"
           aria-label="Open Tableau dashboard in new tab">
          Open Dashboard ↗
        </a>
      </div>
    `
    return
  }

  container.innerHTML = `
    <div class="tableau-outer">
      <div class="tableau-wrap" aria-label="Interactive Tableau dashboard — Medals by Sport and Semester">
        <div class="tableau-loading" aria-live="polite">Loading dashboard…</div>
        <tableau-viz
          id="tableau-viz"
          src="${TABLEAU_URL}"
          toolbar="hidden"
          hide-tabs="true"
          width="660"
          height="680"
        ></tableau-viz>
      </div>
      <p class="tableau-note">
        Dashboard rendered at published size (660 px). To fill the full container, change the workbook
        Dashboard Size from <em>Fixed</em> to <em>Automatic</em> in Tableau Public and republish.
      </p>
    </div>
  `

  // Load Tableau Embedding API v3 on demand
  const script = document.createElement('script')
  script.type = 'module'
  script.src = 'https://public.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js'
  script.onload = () => {
    container.querySelector<HTMLElement>('.tableau-loading')?.remove()
  }
  document.head.appendChild(script)
}
