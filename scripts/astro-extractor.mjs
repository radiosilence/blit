/**
 * Custom Lingui extractor for Astro files
 * This allows i18n strings in .astro files to be extracted
 */

import { parse } from "@astrojs/compiler";

/**
 * Lingui custom extractor for .astro files
 * Follows the Lingui v4+ extractor API
 */
export const astroExtractor = {
  match(filename) {
    return filename.endsWith(".astro");
  },

  async extract(filename, code, onMessageExtracted, ctx) {
    try {
      // Parse the Astro file
      const parsed = parse(code);

      // Extract from frontmatter (JavaScript section)
      if (parsed.frontmatter) {
        extractFromCode(parsed.frontmatter, filename, onMessageExtracted);
      }

      // Extract from template content (HTML + expressions)
      extractFromCode(code, filename, onMessageExtracted);
    } catch (error) {
      console.warn(`Failed to parse Astro file ${filename}:`, error.message);
    }
  },
};

/**
 * Extract i18n strings from code content
 * Looks for i18n._("...") patterns
 */
function extractFromCode(content, filename, onMessageExtracted) {
  // Match i18n._("..."), i18n._('...'), and i18n._(`...`)
  const patterns = [
    /i18n\._\(["'`]([^"'`]+)["'`]\)/g,
    /\{[^}]*i18n\._\(["'`]([^"'`]+)["'`]\)[^}]*\}/g,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const message = match[1];
      if (message) {
        onMessageExtracted({
          id: message,
          message,
          origin: [filename, getLineNumber(content, match.index)],
        });
      }
    }
  });
}

/**
 * Get line number for a character index in the content
 */
function getLineNumber(content, index) {
  return content.substring(0, index).split("\n").length;
}

export default astroExtractor;
