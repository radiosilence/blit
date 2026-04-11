import { StartClient } from "@tanstack/react-start/client";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { loadCatalog } from "./i18n/catalogs";
import { sourceLocale } from "./i18n/config";

// Sync locale activation before hydration — zero flash
loadCatalog(document.documentElement.lang || sourceLocale);

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});
