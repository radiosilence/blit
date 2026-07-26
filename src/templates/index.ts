import { html } from "hono/html";

import type { Catalog } from "#/i18n/catalogs.ts";

export const index = ({ t, urls }: { t: Catalog; urls: { cv: string } }) =>
  html`<section class="m-12 flex flex-col items-center space-y-4 text-center">
    <img src="/logo.png" alt="blit.cc logo" width="256" height="256" class="mt-12 mb-8" />
    <h1>${t.name}</h1>
    <p class="text-sm">${t.tagline}</p>
    <p>
      <a href="${urls.cv}">${t.cv}</a>
      /
      <a href="https://github.com/radiosilence" target="_blank" rel="noopener">${t.github}</a>
    </p>
  </section>`;
