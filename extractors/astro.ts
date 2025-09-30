/**
 * Custom Lingui extractor for Astro files
 * This allows i18n strings in .astro files to be extracted
 */

import { convertToTSX } from "@astrojs/compiler";
import { extractor as defaultExtractor } from "@lingui/cli/api";
import type { ExtractorType } from "@lingui/conf";

/**
 * Lingui custom extractor for .astro files
 * Follows the Lingui v4+ extractor API
 */
export const astroExtractor: ExtractorType = {
  match(filename: string): boolean {
    return filename.endsWith(".astro");
  },

  async extract(filename, code, onMessageExtracted, ctx) {
    const { code: transformedCode, map } = await convertToTSX(code);

    return defaultExtractor.extract(
      `${filename}.tsx`,
      transformedCode,
      onMessageExtracted,
      { ...ctx, sourceMaps: [map] },
    );
  },
};

export default astroExtractor;
