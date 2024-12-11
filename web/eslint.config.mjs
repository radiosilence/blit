import { sheriff } from "eslint-config-sheriff";
import { defineFlatConfig } from "eslint-define-config";
import eslintPluginAstro from "eslint-plugin-astro";

export default defineFlatConfig([
  ...sheriff({
    react: true,
    astro: false,
  }),
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      "no-console": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-empty-interface": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-var-requires": "warn",
      "react/no-multi-comp": "off",
      "react/function-component-definition": [
        "error",
        {
          namedComponents: "arrow-function",
          unnamedComponents: "arrow-function",
        },
      ],
      "func-style": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "warn",
        {
          allow: [{ name: ["Error", "URL", "URLSearchParams"], from: "lib" }],
          allowAny: true,
          allowBoolean: true,
          allowNullish: true,
          allowNumber: true,
          allowRegExp: true,
        },
      ],
    },
  },
]);
