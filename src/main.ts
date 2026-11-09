import './design/tokens.css'
import './style.css'
import { loadAppData } from './data/loader'
import { renderNav } from './components/nav'
import { renderOverview } from './pages/overview'
import { renderExplorer } from './pages/explorer'
import { renderJourney } from './pages/journey'
import { renderEngineering } from './pages/engineering'

async function init() {
  const overviewEl  = document.getElementById('overview')!
  const explorerEl  = document.getElementById('explorer')!
  const journeyEl   = document.getElementById('journey')!
  const engineerEl  = document.getElementById('engineering')!

  renderNav()

  overviewEl.innerHTML = `<div class="section-loading"><span>Loading data…</span></div>`

  try {
    const data = await loadAppData()
    renderOverview(overviewEl, data)
    renderExplorer(explorerEl, data)
    renderJourney(journeyEl, data)
    renderEngineering(engineerEl)
  } catch (err) {
    document.getElementById('main-content')!.innerHTML = `<div class="load-error">
      <h2>Failed to load data</h2>
      <p>${err instanceof Error ? err.message : 'Unknown error'}</p>
    </div>`
    console.error(err)
  }
}

init()
