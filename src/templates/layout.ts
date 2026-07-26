import type { HtmlEscapedString } from "hono/utils/html";
import { html } from "hono/html";

import type { Catalog } from "#/i18n/catalogs.ts";

/**
 * The document every page is rendered into. `hono/html` has no slot machinery —
 * it exports `html` and `raw` and nothing else — so the slot is just a prop
 * holding already-rendered markup, which `html` splices in without re-escaping.
 */
export const layout = ({
  children,
  dir,
  locale,
  localeLinks,
  path,
  styleHref,
  t,
}: {
  children: HtmlEscapedString | Promise<HtmlEscapedString>;
  dir: "ltr" | "rtl";
  locale: string;
  localeLinks: { code: string; href: string; current: boolean; name?: string; place?: string }[];
  path: string;
  styleHref: string;
  t: Catalog;
}) =>
  html`<!doctype html>
    <html lang="${locale}" dir="${dir}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${t.tagline}</title>

        <meta name="theme-color" content="#ffffff" />
        <meta name="application-name" content="blit.cc" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="blit.cc" />
        <meta name="mobile-web-app-capable" content="yes" />

        <meta property="og:title" content="${t.tagline}" />
        <meta property="og:url" content="https://blit.cc${path}" />
        <meta property="og:image" content="https://blit.cc/logo.png" />

        <link rel="stylesheet" href="${styleHref}" />
        <link rel="preload" href="/geist-mono.woff2" as="font" type="font/woff2" crossorigin />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>

      <body>
        ${children}

        <nav class="fixed end-2 bottom-2 text-xs">
          <button
            type="button"
            command="show-modal"
            commandfor="locale-dialog"
            class="cursor-pointer p-1 underline"
          >
            ${locale}
          </button>
        </nav>

        <!--
      \`open:flex\` rather than \`flex\`: an unconditional display would defeat the UA's
      \`dialog:not([open]) { display: none }\` and leak the dialog into the page.
    -->
        <dialog
          id="locale-dialog"
          closedby="any"
          aria-labelledby="locale-heading"
          class="m-auto max-h-[80vh] w-[min(44rem,calc(100vw-2rem))] flex-col overflow-hidden bg-white p-0 text-brand-dark open:flex backdrop:bg-black/60 backdrop:backdrop-blur-sm dark:bg-brand-surface dark:text-brand-light"
        >
          <header class="flex items-center justify-between px-4 py-3">
            <h2 id="locale-heading" class="text-sm font-semibold normal-case">${t.language}</h2>
            <form method="dialog">
              <button
                class="flex size-8 cursor-pointer items-center justify-center text-xl leading-none opacity-70 hover:opacity-100"
                aria-label="${t.close}"
              >
                ×
              </button>
            </form>
          </header>

          <ul class="grid grid-cols-2 overflow-y-auto p-2 sm:grid-cols-3">
            ${localeLinks.map(
              ({ code, current, href, name, place }) => html`<li>
                <a
                  href="${href}"
                  hreflang="${code}"
                  lang="${code}"
                  aria-current="${current ? "true" : "false"}"
                  ${current ? "autofocus" : ""}
                  class="block px-3 py-2 no-underline hover:bg-brand-mid/20 ${current
                    ? "text-brand"
                    : "text-inherit"}"
                >
                  <span class="block truncate text-sm">${name}</span>
                  <span class="block truncate text-xs opacity-60">${place}</span>
                </a>
              </li>`,
            )}
          </ul>
        </dialog>
      </body>
    </html>`;
