import Papa from 'papaparse'
import type { Achievement, KpiMedalSummary, KpiSport, KpiSemester, KpiFormat, AppData } from '../types/achievement'

const BASE = import.meta.env.BASE_URL

function parseCsv<T>(url: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    })
  })
}

export async function loadAppData(): Promise<AppData> {
  const [achievements, kpiMedal, kpiSport, kpiSemester, kpiFormat] = await Promise.all([
    parseCsv<Achievement>(`${BASE}data/achievements_public.csv`),
    parseCsv<KpiMedalSummary>(`${BASE}data/kpi_medal_summary.csv`),
    parseCsv<KpiSport>(`${BASE}data/kpi_sport.csv`),
    parseCsv<KpiSemester>(`${BASE}data/kpi_semester.csv`),
    parseCsv<KpiFormat>(`${BASE}data/kpi_format.csv`),
  ])

  // Coerce string booleans from CSV
  const coercedAchievements = achievements.map(a => ({
    ...a,
    has_record: String(a.has_record).toLowerCase() === 'true',
    is_ambiguous: String(a.is_ambiguous).toLowerCase() === 'true',
  }))

  return { achievements: coercedAchievements, kpiMedal, kpiSport, kpiSemester, kpiFormat }
}
