export type MedalTier = 'Gold' | 'Silver' | 'Bronze'
export type EventFormat = 'Singles' | 'Doubles' | 'Team' | 'Unknown'
export type EvidenceType = 'platform_recorded' | 'firsthand_attested'
export type ReviewStatus = 'verified' | 'ambiguous' | 'pending'

export interface Achievement {
  achievement_id: string
  semester: string
  season: string
  year: number
  semester_sort_key: number
  sport_normalized: string
  sport_raw: string
  event_name_raw: string
  event_format: EventFormat
  event_format_display: string
  medal_tier: MedalTier
  medal_rank: number
  wins_reported: number | null
  losses_reported: number | null
  ties_reported: number | null
  has_record: boolean
  placement_evidence_type: EvidenceType
  is_ambiguous: boolean
  review_status: ReviewStatus
  context_note: string
}

export interface KpiMedalSummary {
  medal_tier: MedalTier
  medal_rank: number
  total_count: number
  platform_recorded_count: number
  firsthand_attested_count: number
}

export interface KpiSport {
  sport_normalized: string
  total_medals: number
  gold: number
  silver: number
  bronze: number
  platform_recorded_count: number
  firsthand_attested_count: number
}

export interface KpiSemester {
  semester: string
  season: string
  year: number
  semester_sort_key: number
  total_medals: number
  gold_count: number
  silver_count: number
  bronze_count: number
}

export interface KpiFormat {
  event_format_display: string
  total_count: number
  gold: number
  silver: number
  bronze: number
}

export interface AppData {
  achievements: Achievement[]
  kpiMedal: KpiMedalSummary[]
  kpiSport: KpiSport[]
  kpiSemester: KpiSemester[]
  kpiFormat: KpiFormat[]
}

export interface ExplorerFilters {
  sports: Set<string>
  semesters: Set<string>
  medals: Set<MedalTier>
  evidenceType: 'all' | EvidenceType
}
