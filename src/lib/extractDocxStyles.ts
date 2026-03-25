import JSZip from "jszip"
import { TemplateStyles, DEFAULT_STYLES } from "./templateStyles"

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
const A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"

function getElementByNS(
  parent: Element | Document,
  ns: string,
  localName: string
): Element | null {
  const els = parent.getElementsByTagNameNS(ns, localName)
  return els.length > 0 ? els[0] : null
}

function getAllByNS(
  parent: Element | Document,
  ns: string,
  localName: string
): Element[] {
  return Array.from(parent.getElementsByTagNameNS(ns, localName))
}

function extractColorFromElement(el: Element | null): string | null {
  if (!el) return null
  // Check for <a:srgbClr val="XXXXXX"/> child
  const srgb = getElementByNS(el, A_NS, "srgbClr")
  if (srgb) {
    const val = srgb.getAttribute("val")
    if (val && val.length === 6) return val
  }
  // Check for <a:sysClr lastClr="XXXXXX"/> child
  const sys = getElementByNS(el, A_NS, "sysClr")
  if (sys) {
    const lastClr = sys.getAttribute("lastClr")
    if (lastClr && lastClr.length === 6) return lastClr
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

  // Extract fonts
  let headingFont: string | null = null
  let bodyFont: string | null = null

  const majorFont = getElementByNS(doc, A_NS, "majorFont")
  if (majorFont) {
    const latin = getElementByNS(majorFont, A_NS, "latin")
    if (latin) headingFont = latin.getAttribute("typeface")
  }

  const minorFont = getElementByNS(doc, A_NS, "minorFont")
  if (minorFont) {
    const latin = getElementByNS(minorFont, A_NS, "latin")
    if (latin) bodyFont = latin.getAttribute("typeface")
  }

  // Extract theme colors
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

  const styleMap: Record<string, Element> = {}
  const styles = getAllByNS(doc, W_NS, "style")
  for (const style of styles) {
    const id = style.getAttribute("w:styleId")
    if (id) styleMap[id] = style
  }

  function getSizeFromStyle(styleId: string): number | null {
    const style = styleMap[styleId]
    if (!style) return null
    const rPr = getElementByNS(style, W_NS, "rPr")
    if (!rPr) return null
    const sz = getElementByNS(rPr, W_NS, "sz")
    if (!sz) return null
    const val = sz.getAttribute("w:val")
    return val ? parseInt(val, 10) : null
  }

  function getColorFromStyle(styleId: string): string | null {
    const style = styleMap[styleId]
    if (!style) return null
    const rPr = getElementByNS(style, W_NS, "rPr")
    if (!rPr) return null
    const color = getElementByNS(rPr, W_NS, "color")
    if (!color) return null

    // Direct hex color
    const val = color.getAttribute("w:val")
    if (val && val !== "auto" && val.length === 6) return val

    // Theme color reference
    const themeColor = color.getAttribute("w:themeColor")
    if (themeColor && themeColors[themeColor]) return themeColors[themeColor]

    return null
  }

  function getFontFromStyle(styleId: string): string | null {
    const style = styleMap[styleId]
    if (!style) return null
    const rPr = getElementByNS(style, W_NS, "rPr")
    if (!rPr) return null
    const rFonts = getElementByNS(rPr, W_NS, "rFonts")
    if (!rFonts) return null
    return (
      rFonts.getAttribute("w:ascii") ||
      rFonts.getAttribute("w:hAnsi") ||
      rFonts.getAttribute("w:cs") ||
      null
    )
  }

  return {
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
}

export async function extractDocxStyles(
  arrayBuffer: ArrayBuffer
): Promise<TemplateStyles> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer)

    // Parse theme
    let theme: ThemeData = { headingFont: null, bodyFont: null, colorMap: {} }
    const themeFile = zip.file("word/theme/theme1.xml")
    if (themeFile) {
      const themeXml = await themeFile.async("text")
      theme = parseThemeXml(themeXml)
    }

    // Parse styles
    let styleInfo: StyleInfo = {
      headingColor: null,
      bodyColor: null,
      headingSizes: {},
      bodySize: null,
      bodyFontOverride: null,
      headingFontOverride: null,
    }
    const stylesFile = zip.file("word/styles.xml")
    if (stylesFile) {
      const stylesXml = await stylesFile.async("text")
      styleInfo = parseStylesXml(stylesXml, theme.colorMap)
    }

    // Resolve fonts: style overrides take priority over theme
    const headingFont = styleInfo.headingFontOverride || theme.headingFont
    const bodyFont = styleInfo.bodyFontOverride || theme.bodyFont

    // Resolve accent colors
    const accentColors: string[] = []
    for (let i = 1; i <= 6; i++) {
      const c = theme.colorMap[`accent${i}`]
      if (c) accentColors.push(c)
    }

    // Resolve heading color
    const headingColor =
      styleInfo.headingColor || theme.colorMap.accent1 || null

    // Resolve body color
    const bodyColor =
      styleInfo.bodyColor || theme.colorMap.dk1 || null

    return {
      headingFont,
      bodyFont,
      headingColor,
      bodyColor,
      accentColors,
      headingSizes: {
        title:
          styleInfo.headingSizes.Title || DEFAULT_STYLES.headingSizes.title,
        h1:
          styleInfo.headingSizes.Heading1 || DEFAULT_STYLES.headingSizes.h1,
        h2:
          styleInfo.headingSizes.Heading2 || DEFAULT_STYLES.headingSizes.h2,
        h3:
          styleInfo.headingSizes.Heading3 || DEFAULT_STYLES.headingSizes.h3,
        body: styleInfo.bodySize || DEFAULT_STYLES.headingSizes.body,
      },
    }
  } catch (error) {
    console.error("Failed to extract DOCX styles:", error)
    return { ...DEFAULT_STYLES }
  }
}
