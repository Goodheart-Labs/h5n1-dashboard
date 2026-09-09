// eslint-config-next 16 ships flat configs directly; FlatCompat is no longer needed.
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [...nextVitals, ...nextTs];

export default eslintConfig;
