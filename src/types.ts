export type LanguageResponse = {
  /** Language ID */
  id: number
  /** English language Name */
  name: string
  /** Locale tag */
  tag: string
  /** Local language name */
  originalName: string
  /** Unicode flag emoji */
  flagEmoji: string
  /** Whether this locale is the project's base locale */
  base: boolean
}[][]