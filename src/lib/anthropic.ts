import Anthropic from "@anthropic-ai/sdk"

export function createAnthropicClient(apiKey: string) {
  return new Anthropic({ apiKey })
}

export const ANALYZE_PROMPT = `You are an expert proposal analyst. You've been given one or more example business proposals. Your job is to deeply analyze them and extract:

1. STRUCTURE: What sections appear in each proposal? What's the typical order? (e.g., Cover Page, Executive Summary, About Us, Scope of Work, Timeline, Pricing, Terms & Conditions, etc.)

2. BOILERPLATE: What content appears to be reused across proposals (or would be reused)? This is typically 80%+ of the content. Extract the exact text of reusable sections like About Us, company descriptions, methodology, terms, etc. Keep all formatting cues.

3. VARIABLE SECTIONS: What parts change per client? Typically: client name, contact info, specific scope, pricing, timelines, custom messaging.

4. TONE & STYLE: What's the writing style? Formal/casual? First person/third person? Technical/simple? What patterns do you notice?

5. FORMATTING: How are sections formatted? Headers, bullet points, tables, etc.

Output your analysis as JSON:
{
  "systemPrompt": "A detailed system prompt that instructs an AI to generate proposals matching this exact style, structure, and tone. Include specific instructions about formatting, section order, writing style, and what to include in each section.",
  "boilerplate": "The full text of all reusable/boilerplate content, organized by section. This should be ready to paste into future proposals with only minor adjustments.",
  "structure": "A JSON-stringified array of section objects: [{name, description, isBoilerplate, typicalContent}]"
}`

export const GENERATE_PROMPT = `You are a professional proposal writer. Generate a complete, polished business proposal based on the provided template, boilerplate content, and client-specific details.

Output the proposal as a JSON object with this structure:
{
  "title": "Proposal title",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Full section content in HTML format (use <p>, <ul>, <li>, <h3>, <table>, <tr>, <td>, <strong>, <em> tags)",
      "type": "cover|executive_summary|about|scope|timeline|pricing|terms|custom"
    }
  ]
}

Rules:
- Use the boilerplate content exactly as provided for reusable sections
- Personalize all variable sections with the client's name and details
- Make the scope section detailed and specific based on the provided description
- Format pricing clearly, use tables if appropriate
- Keep the tone and style consistent with the template
- Output ONLY the JSON. No other text.`
