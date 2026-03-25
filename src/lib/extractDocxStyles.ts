import JSZip from "jszip"
import { TemplateStyles, DEFAULT_STYLES } from "./templateStyles"

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
const A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"

// Get attribute value trying multiple access methods for cross-browser compat
function getAttr(el: Element, name: string, ns?: string): string | null {
  // Try namespace-aware access first
  if (ns) {
    const val = el.getAttributeNS(ns, name)
    if (val) return val
  }
  // Try prefixed form (e.g. "w:val")
  const prefix = ns === W_NS ? "w:" : ns === A_NS ? "a:" : ""
  if (prefix) {
    const val = el.getAttribute(prefix + name)
    if (val) return val
  }
  // Try unprefixed
  const val = el.getAttribute(name)
  if (val) return val
  return null
}

function getElementByNS(parent: Element | Document, ns: string, localName: string): Element | null {
  const els = parent.getElementsByTagNameNS(ns, localName)
  return els.length > 0 ? els[0] : null
}

function getAllByNS(parent: Element | Document, ns: string, localName: string): Element[] {
  return Array.from(parent.getElementsByTagNameNS(ns, localName))
}

function extractColorFromElement(el: Element | null): string | null {
  if (!el) return null
  const srgb = getElementByNS(el, A_NS, "srgbClr")
  if (srgb) {
    const val = getAttr(srgb, "val") || getAttr(srgb, "val", A_NS)
    if (val && /^[0-9A-Fa-f]{6}$/.test(val)) return val.toUpperCase()
  }
  const sys = getElementByNS(el, A_NS, "sysClr")
  if (sys) {
    const lastClr = getAttr(sys, "lastClr") || getAttr(sys, "lastClr", A_NS)
    if (lastClr && /^[0-9A-Fa-f]{6}$/.test(lastClr)) return lastClr.toUpperCase()
  }
  return null
}

interface ThemeData {
  headingFont: string | null
  bodyFont: string | null
  colorMap: Record<string, string>
}

function parseThemeXml(xml: string): ThemeData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, "application/xml")

  let headingFont: string | null = null
  let bodyFont: string | null = null

  const majorFont = getElementByNS(doc, A_NS, "majorFont")
  if (majorFont) {
    const latin = getElementByNS(majorFont, A_NS, "latin")
    if (latin) headingFont = getAttr(latin, "typeface")
  }

  const minorFont = getElementByNS(doc, A_NS, "minorFont")
  if (minorFont) {
    const latin = getElementByNS(minorFont, A_NS, "latin")
    if (latin) bodyFont = getAttr(latin, "typeface")
  }

  const colorMap: Record<string, string> = {}
  const colorScheme = getElementByNS(doc, A_NS, "clrScheme")
  if (colorScheme) {
    const colorNames = [
      "dk1", "dk2", "lt1", "lt2",
      "accent1", "accent2", "accent3", "accent4", "accent5", "accent6",
      "hlink", "folHlink",
    ]
    for (const name of colorNames) {
      const el = getElementByNS(colorScheme, A_NS, name)
      const color = extractColorFromElement(el)
      if (color) colorMap[name] = color
    }
  }

  console.log("[extractDocxStyles] Theme fonts:", { headingFont, bodyFont })
  console.log("[extractDocxStyles] Theme colors:", colorMap)

  return { headingFont, bodyFont, colorMap }
}

interface StyleInfo {
  headingColor: string | null
  bodyColor: string | null
  headingSizes: Record<string, number>
  bodySize: number | null
  bodyFontOverride: string | null
  headingFontOverride: string | null
}

function parseStylesXml(xml: string, themeColors: Record<string, string>): StyleInfo {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, "application/xml")

  // Build style map using multiple attribute access strategies
  const styleMap: Record<string, Element> = {}
  const styles = getAllByNS(doc, W_NS, "style")
  for (const style of styles) {
    const id = getAttr(style, "styleId", W_NS) || getAttr(style, "styleId")
    if (id) styleMap[id] = style
  }

  console.log("[extractDocxStyles] Found style IDs:", Object.keys(styleMap))

  function getSizeFromStyle(styleId: string): number | null {
    const style = styleMap[styleId]
    if (!style) return null
    // Search for sz element anywhere in the style (not just direct rPr child)
    const szElements = getAllByNS(style, W_NS, "sz")
    for (const sz of szElements) {
      const val = getAttr(sz, "val", W_NS) || getAttr(sz, "val")
      if (val) {
        const num = parseInt(val, 10)
        if (!isNaN(num) && num > 0) return num
      }
    }
    return null
  }

  function getColorFromStyle(styleId: string): string | null {
    const style = styleMap[styleId]
    if (!style) return null
    const colorElements = getAllByNS(style, W_NS, "color")
    for (const color of colorElements) {
      // Direct hex color
      const val = getAttr(color, "val", W_NS) || getAttr(color, "val")
      if (val && val !== "auto" && /^[0-9A-Fa-f]{6}$/.test(val)) return val.toUpperCase()

      // Theme color reference
      const themeColor = getAttr(color, "themeColor", W_NS) || getAttr(color, "themeColor")
      if (themeColor && themeColors[themeColor]) return themeColors[themeColor]
    }
    return null
  }

  function getFontFromStyle(styleId: string): string | null {
    const style = styleMap[styleId]
    if (!style) return null
    const rFontsElements = getAllByNS(style, W_NS, "rFonts")
    for (const rFonts of rFontsElements) {
      const font =
        getAttr(rFonts, "ascii", W_NS) || getAttr(rFonts, "ascii") ||
        getAttr(rFonts, "hAnsi", W_NS) || getAttr(rFonts, "hAnsi") ||
        getAttr(rFonts, "cs", W_NS) || getAttr(rFonts, "cs")
      if (font) return font
    }
    return null
  }

  const result: StyleInfo = {
    headingColor:
      getColorFromStyle("Heading1") ||
      getColorFromStyle("Heading2") ||
      getColorFromStyle("Title") ||
      null,
    bodyColor: getColorFromStyle("Normal") || null,
    headingSizes: {
      Title: getSizeFromStyle("Title") || 0,
      Heading1: getSizeFromStyle("Heading1") || 0,
      Heading2: getSizeFromStyle("Heading2") || 0,
      Heading3: getSizeFromStyle("Heading3") || 0,
    },
    bodySize: getSizeFromStyle("Normal") || null,
    bodyFontOverride: getFontFromStyle("Normal"),
    headingFontOverride:
      getFontFromStyle("Heading1") ||
      getFontFromStyle("Title") ||
      null,
  }

  console.log("[extractDocxStyles] Style info:", result)

  return result
}

// Find a file in the zip case-insensitively
function findFile(zip: JSZip, path: string): JSZip.JSZipObject | null {
  // Try exact path first
  const exact = zip.file(path)
  if (exact) return exact
  // Try case-insensitive
  const lowerPath = path.toLowerCase()
  let found: JSZip.JSZipObject | null = null
  zip.forEach((relativePath, file) => {
    if (relativePath.toLowerCase() === lowerPath && !found) {
      found = file
    }
  })
  return found
}

export async function extractDocxStyles(
  arrayBuffer: ArrayBuffer
): Promise<TemplateStyles> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer)

    // List files for debugging
    const files: string[] = []
    zip.forEach((path) => files.push(path))
    console.log("[extractDocxStyles] ZIP files:", files.filter(f =>
      f.toLowerCase().includes("theme") || f.toLowerCase().includes("style")
    ))

    // Parse theme (case-insensitive file lookup)
    let theme: ThemeData = { headingFont: null, bodyFont: null, colorMap: {} }
    const themeFile = findFile(zip, "word/theme/theme1.xml")
    if (themeFile) {
      const themeXml = await themeFile.async("text")
      theme = parseThemeXml(themeXml)
    } else {
      console.warn("[extractDocxStyles] No theme file found")
    }

    // Parse styles (case-insensitive file lookup)
    let styleInfo: StyleInfo = {
      headingColor: null,
      bodyColor: null,
      headingSizes: {},
      bodySize: null,
      bodyFontOverride: null,
      headingFontOverride: null,
    }
    const stylesFile = findFile(zip, "word/styles.xml")
    if (stylesFile) {
      const stylesXml = await stylesFile.async("text")
      styleInfo = parseStylesXml(stylesXml, theme.colorMap)
    } else {
      console.warn("[extractDocxStyles] No styles file found")
    }

    // Resolve fonts: style-level overrides take priority over theme fonts
    const headingFont = styleInfo.headingFontOverride || theme.headingFont
    const bodyFont = styleInfo.bodyFontOverride || theme.bodyFont

    // Resolve accent colors
    const accentColors: string[] = []
    for (let i = 1; i <= 6; i++) {
      const c = theme.colorMap[`accent${i}`]
      if (c) accentColors.push(c)
    }

    const headingColor = styleInfo.headingColor || theme.colorMap.accent1 || null
    const bodyColor = styleInfo.bodyColor || theme.colorMap.dk1 || null

    const result: TemplateStyles = {
      headingFont,
      bodyFont,
      headingColor,
      bodyColor,
      accentColors,
      headingSizes: {
        title: styleInfo.headingSizes.Title || DEFAULT_STYLES.headingSizes.title,
        h1: styleInfo.headingSizes.Heading1 || DEFAULT_STYLES.headingSizes.h1,
        h2: styleInfo.headingSizes.Heading2 || DEFAULT_STYLES.headingSizes.h2,
        h3: styleInfo.headingSizes.Heading3 || DEFAULT_STYLES.headingSizes.h3,
        body: styleInfo.bodySize || DEFAULT_STYLES.headingSizes.body,
      },
    }

    console.log("[extractDocxStyles] Final result:", result)

    return result
  } catch (error) {
    console.error("[extractDocxStyles] Failed:", error)
    return { ...DEFAULT_STYLES }
  }
}
