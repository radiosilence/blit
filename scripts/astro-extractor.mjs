/**
 * Custom Lingui extractor for Astro files
 * This allows i18n strings in .astro files to be extracted
 */

import { parse } from "@astrojs/compiler";
import fs from "fs";
import path from "path";

/**
 * Extract i18n strings from Astro files
 * Looks for i18n._("...") patterns in both frontmatter and template sections
 */
function extractFromAstro(filePath, content) {
  try {
    // Parse the Astro file
    const parsed = parse(content);

    const messages = new Set();

    // Extract from frontmatter (JavaScript section)
    if (parsed.frontmatter) {
      const frontmatterMatches = parsed.frontmatter.match(
        /i18n\._\(["'`]([^"'`]+)["'`]\)/g,
      );
      if (frontmatterMatches) {
        frontmatterMatches.forEach((match) => {
          const msgMatch = match.match(/i18n\._\(["'`]([^"'`]+)["'`]\)/);
          if (msgMatch) {
            messages.add(msgMatch[1]);
          }
        });
      }
    }

    // Extract from template content (HTML + expressions)
    const templateMatches = content.match(/i18n\._\(["'`]([^"'`]+)["'`]\)/g);
    if (templateMatches) {
      templateMatches.forEach((match) => {
        const msgMatch = match.match(/i18n\._\(["'`]([^"'`]+)["'`]\)/);
        if (msgMatch) {
          messages.add(msgMatch[1]);
        }
      });
    }

    // Also look for {i18n._("...")} patterns
    const expressionMatches = content.match(
      /\{[^}]*i18n\._\(["'`]([^"'`]+)["'`]\)[^}]*\}/g,
    );
    if (expressionMatches) {
      expressionMatches.forEach((match) => {
        const msgMatch = match.match(/i18n\._\(["'`]([^"'`]+)["'`]\)/);
        if (msgMatch) {
          messages.add(msgMatch[1]);
        }
      });
    }

    return Array.from(messages).map((message) => ({
      id: message,
      message,
      origin: [[filePath, 1]],
    }));
  } catch (error) {
    console.warn(`Failed to parse Astro file ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Process all .astro files in the src directory
 */
function extractFromAstroFiles(srcDir) {
  const astroFiles = [];

  function findAstroFiles(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        findAstroFiles(fullPath);
      } else if (file.endsWith(".astro")) {
        astroFiles.push(fullPath);
      }
    }
  }

  findAstroFiles(srcDir);

  const allMessages = [];

  for (const filePath of astroFiles) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const messages = extractFromAstro(filePath, content);
      allMessages.push(...messages);
    } catch (error) {
      console.warn(`Failed to read ${filePath}:`, error.message);
    }
  }

  return allMessages;
}

// Export for Lingui
export default function extractor(filePath, content) {
  return extractFromAstro(filePath, content);
}

// Run as standalone script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const srcDir = path.join(process.cwd(), "src");
  const messages = extractFromAstroFiles(srcDir);

  console.log(`Found ${messages.length} translatable strings in .astro files:`);
  messages.forEach((msg) => {
    console.log(`  "${msg.id}" in ${msg.origin[0][0]}`);
  });
}
