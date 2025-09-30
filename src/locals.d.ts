// biome-ignore lint/correctness/noUnusedVariables: Overrides astro.
namespace App {
  /**
   * Used by middlewares to store information, that can be read by the user via the global `Astro.locals`
   */
  export interface Locals {
    isRtl: boolean;
    locale: string;
  }
}
