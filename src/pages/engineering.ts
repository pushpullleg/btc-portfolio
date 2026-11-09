export function renderEngineering(section: HTMLElement) {
  section.innerHTML = `
    <div class="section-inner">
      <div class="section-header">
        <h2 class="section-title">Engineering Case Study</h2>
        <p class="section-desc">
          How 22 pages of image-only PDFs became a reproducible, validated analytics pipeline.
        </p>
      </div>

      <div class="eng-stack">
        <span class="stack-badge">Python 3.13</span>
        <span class="stack-badge">DuckDB 1.5</span>
        <span class="stack-badge">TypeScript</span>
        <span class="stack-badge">Vite</span>
        <span class="stack-badge">Tableau Public</span>
        <span class="stack-badge">GitHub Actions (planned)</span>
      </div>

      <section class="eng-section" aria-labelledby="eng-overview-heading">
        <h3 id="eng-overview-heading" class="eng-heading">Project Overview</h3>
        <p>
          The goal: turn 5 semesters of intramural records — stored across 22 pages of image-only PDF trophy
          screenshots — into a clean, verifiable, reproducible dataset suitable for portfolio publication.
          No OCR. No scraping. Every value read manually, with an evidence chain documenting where each
          data point came from and what confidence level it carries.
        </p>
        <p>
          The result is <strong>M1</strong> (data foundation), <strong>M2</strong> (DuckDB transformation
          pipeline), <strong>M3</strong> (Tableau dashboard), and <strong>M4</strong> (this site) —
          each milestone with its own validation layer and promotion gate.
        </p>
      </section>

      <section class="eng-section" aria-labelledby="eng-arch-heading">
        <h3 id="eng-arch-heading" class="eng-heading">Architecture</h3>
        <div class="arch-diagram" role="img" aria-label="Data pipeline architecture diagram">
          <div class="arch-flow">
            <div class="arch-node arch-node--source">
              <span class="arch-icon">📄</span>
              <span>IMLeagues PDFs</span>
              <small>22 pages, image-only</small>
            </div>
            <div class="arch-arrow">→</div>
            <div class="arch-node arch-node--m1">
              <span class="arch-icon">📊</span>
              <span>M1 CSV Sources</span>
              <small>achievements.csv · evidence_manifest.csv</small>
            </div>
            <div class="arch-arrow">→</div>
            <div class="arch-node arch-node--m2">
              <span class="arch-icon">🦆</span>
              <span>M2 Pipeline</span>
              <small>Python · DuckDB · 30 validation rules</small>
            </div>
            <div class="arch-arrow">→</div>
            <div class="arch-node arch-node--output">
              <span class="arch-icon">📤</span>
              <span>Public Exports</span>
              <small>5 reviewed CSVs</small>
            </div>
            <div class="arch-arrow">→</div>
            <div class="arch-node arch-node--viz">
              <span class="arch-icon">📈</span>
              <span>Tableau + Site</span>
              <small>M3 dashboard · M4 portfolio</small>
            </div>
          </div>
        </div>
      </section>

      <section class="eng-section" aria-labelledby="eng-pipeline-heading">
        <h3 id="eng-pipeline-heading" class="eng-heading">Pipeline Design</h3>
        <p>
          The M2 pipeline (<code>pipeline/run_pipeline.py</code>) runs in 10 deterministic steps:
        </p>
        <ol class="eng-steps">
          <li><strong>Preflight</strong> — M1 validation (49 rules) must pass before any transform runs</li>
          <li><strong>Hash inputs</strong> — SHA-256 of both source CSVs recorded for determinism tracking</li>
          <li><strong>Rebuild DuckDB</strong> — Full database drop and recreate on every run; no incremental state</li>
          <li><strong>Ingest</strong> — Raw CSVs loaded into staging tables without transformation</li>
          <li><strong>Transform</strong> — Fact tables and 4 KPI aggregations computed in SQL</li>
          <li><strong>Export to _tmp</strong> — 5 public CSVs written to a temporary staging directory</li>
          <li><strong>Validate</strong> — 30 PIPE rules run against the staged exports; hard failures block promotion</li>
          <li><strong>Promote with rollback</strong> — <code>_tmp → public</code> directory swap; <code>_old_backup</code> is restored on any failure, keeping <code>public/</code> intact</li>
          <li><strong>Write manifest</strong> — Input/output hashes and run metadata persisted to JSON</li>
          <li><strong>Exit</strong> — Code 0 (success) or 1 (failure); public/ unchanged on any failure</li>
        </ol>
        <div class="code-block" aria-label="Pipeline command">
          <pre><code>cd beyond-the-classroom
source .venv/bin/activate
python pipeline/run_pipeline.py</code></pre>
        </div>
      </section>

      <section class="eng-section" aria-labelledby="eng-validation-heading">
        <h3 id="eng-validation-heading" class="eng-heading">Validation Strategy</h3>
        <p>
          Two independent validation layers protect data integrity:
        </p>
        <div class="validation-grid">
          <div class="validation-card">
            <h4>M1 — Data Foundation (49 rules)</h4>
            <ul>
              <li>Schema integrity: required fields, type constraints</li>
              <li>ID uniqueness: 23 achievement records, 26 evidence entries</li>
              <li>Referential integrity: every evidence_id in achievements resolves in manifest</li>
              <li>Enumeration checks: medal_tier, event_format, review_status, evidence_type</li>
              <li>Business rules: firsthand attestation must carry a context_note</li>
            </ul>
          </div>
          <div class="validation-card">
            <h4>M2 — Pipeline (30 PIPE rules)</h4>
            <ul>
              <li>Row count preservation: fact tables must match M1 source counts</li>
              <li>Aggregation correctness: KPI totals must cross-check against achievement rows</li>
              <li>Column allowlist: public exports must exclude internal tracking fields</li>
              <li>Null policy: required public fields must not be null</li>
              <li>Determinism: output hashes compared across runs; no silent mutations</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="eng-section" aria-labelledby="eng-evidence-heading">
        <h3 id="eng-evidence-heading" class="eng-heading">Evidence Provenance</h3>
        <p>
          Every achievement carries a <code>placement_evidence_type</code> field:
        </p>
        <ul class="evidence-list">
          <li>
            <strong>platform_recorded (22 of 23):</strong> Placement is documented in an IMLeagues
            PDF trophy screenshot. The PDF is image-only; values were read manually and cross-checked.
          </li>
          <li>
            <strong>firsthand_attested (1 of 23 — ACH-023):</strong> Spring 2026 Badminton Doubles Gold.
            IMLeagues did not generate a championship record for this event. The 5–0–0 season record
            and Gold placement are documented through firsthand attestation, with a registration
            screenshot proving enrollment but not outcome.
          </li>
        </ul>
        <p>
          Four achievements carry <code>review_status = ambiguous</code> where source evidence was
          partially illegible or cropped. These are included with explicit flags rather than excluded —
          the ambiguity is data, not noise.
        </p>
      </section>

      <section class="eng-section" aria-labelledby="eng-decisions-heading">
        <h3 id="eng-decisions-heading" class="eng-heading">Key Design Decisions</h3>
        <dl class="decision-list">
          <div class="decision">
            <dt>ADR-001: No match-level statistics in M1</dt>
            <dd>IMLeagues W-L-T data is inconsistent across events and not reliably recoverable from PDF screenshots. Trophy-level records only; lifetime aggregation deferred to future work.</dd>
          </div>
          <div class="decision">
            <dt>Column allowlist on public exports</dt>
            <dd><code>evidence_id</code>, <code>placement_source</code>, and <code>record_source</code> are excluded from all public CSVs. Internal tracking fields have no place in published data.</dd>
          </div>
          <div class="decision">
            <dt>Full-rebuild pipeline strategy</dt>
            <dd>DuckDB is deleted and recreated on every run. This eliminates incremental state bugs and guarantees that the pipeline is reproducible from source CSVs alone.</dd>
          </div>
          <div class="decision">
            <dt>Rollback-protected directory promotion</dt>
            <dd>Exports are written to <code>_tmp</code>, validated, then moved to <code>public/</code> as a directory swap. On any failure, <code>_old_backup</code> is restored. This is not a globally atomic filesystem operation, but the <code>public/</code> directory is never left in a partial state under normal failure modes.</dd>
          </div>
          <div class="decision">
            <dt>Separate public repository</dt>
            <dd>The pipeline workspace (private evidence, source CSVs, DuckDB) is kept private and not published. Only reviewed public exports and site source ship in this repository. No secrets in CI.</dd>
          </div>
        </dl>
      </section>

      <section class="eng-section" aria-labelledby="eng-lessons-heading">
        <h3 id="eng-lessons-heading" class="eng-heading">Engineering Lessons</h3>
        <ul class="lessons-list">
          <li>Validation layers compound: 49 M1 rules + 30 M2 rules (79 total) caught every schema drift before it reached public outputs.</li>
          <li>Evidence provenance should be a first-class data field, not a comment. Flagging ambiguity explicitly is more honest and more useful than silent exclusion.</li>
          <li>Full-rebuild pipelines are simpler to reason about than incremental ones — the cost of rebuilding a 23-row DuckDB is zero.</li>
          <li>Separating public and private repositories removes an entire class of accidental disclosure risk; gitignore alone is not sufficient assurance.</li>
          <li>Building the Explorer in TypeScript rather than Tableau Dashboard 2 produced a better mobile experience and a stronger engineering signal with no data integrity trade-off.</li>
        </ul>
      </section>
    </div>
  `
}
