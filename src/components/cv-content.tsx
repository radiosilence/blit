import { useLingui } from "@lingui/react";
import { sourceLocale } from "../i18n/config";
import CV from "./cv.mdx";
import logo from "./logo.png";

export function CvContent() {
  const { i18n } = useLingui();
  const locale = i18n.locale;
  const homePath = locale !== sourceLocale ? `/${locale}/` : "/";

  return (
    <section className="flex items-center flex-col mbe-24 px-4 lg:px-0">
      <article className="prose prose-sm">
        <a href={homePath}>
          <img src={logo} alt="blit.cc logo" width={128} height={128} className="mbs-12 mbe-16" />
        </a>
        <CV />
      </article>
    </section>
  );
}
