import { i18n } from "@lingui/core";
import type { ComponentType } from "react";
import Logo from "@/components/Logo.tsx";

const { locale } = i18n;

export const HomePage: ComponentType = () => {
  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <Logo width={256} className="mbs-12 mbe-8" />
      <h1>{i18n._("james cleveland")}</h1>
      <p className="text-sm">
        {i18n._("james cleveland : senior full stack engineer")}
      </p>
      <p>
        <a href={`${locale !== "en-GB" ? `/${locale}` : ""}/cv`}>
          {i18n._("cv-2025.01")}
        </a>
        {" / "}
        <a href="https://github.com/radiosilence">{i18n._("github")}</a>
      </p>
    </section>
  );
};
