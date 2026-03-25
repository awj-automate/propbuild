export interface TemplateStyles {
  headingFont: string | null
  bodyFont: string | null
  headingColor: string | null
  bodyColor: string | null
  accentColors: string[]
  headingSizes: {
    title: number // half-points (e.g. 52 = 26pt)
    h1: number
    h2: number
    h3: number
    body: number
  }
}

export const DEFAULT_STYLES: TemplateStyles = {
  headingFont: null,
  bodyFont: null,
  headingColor: null,
  bodyColor: null,
  accentColors: [],
  headingSizes: {
    title: 52,
    h1: 32,
    h2: 28,
    h3: 24,
    body: 22,
  },
}

export function parseStyles(json: string | null | undefined): TemplateStyles {
  if (!json) return { ...DEFAULT_STYLES }
  try {
    const parsed = JSON.parse(json)
    return {
      headingFont: parsed.headingFont || null,
      bodyFont: parsed.bodyFont || null,
      headingColor: parsed.headingColor || null,
      bodyColor: parsed.bodyColor || null,
      accentColors: Array.isArray(parsed.accentColors) ? parsed.accentColors : [],
      headingSizes: {
        title: parsed.headingSizes?.title || DEFAULT_STYLES.headingSizes.title,
        h1: parsed.headingSizes?.h1 || DEFAULT_STYLES.headingSizes.h1,
        h2: parsed.headingSizes?.h2 || DEFAULT_STYLES.headingSizes.h2,
        h3: parsed.headingSizes?.h3 || DEFAULT_STYLES.headingSizes.h3,
        body: parsed.headingSizes?.body || DEFAULT_STYLES.headingSizes.body,
      },
    }
  } catch {
    return { ...DEFAULT_STYLES }
  }
}
