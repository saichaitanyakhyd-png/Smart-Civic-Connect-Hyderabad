import js from "@eslint/js";

const browserGlobals = {
  document: "readonly",
  window: "readonly",
  navigator: "readonly",
  fetch: "readonly",
  FileReader: "readonly",
  Image: "readonly",
  Intl: "readonly",
};

const nodeGlobals = {
  Buffer: "readonly",
  __dirname: "readonly",
  console: "readonly",
  fetch: "readonly",
  process: "readonly",
  require: "readonly",
  URL: "readonly",
};

export default [
  {
    ignores: ["node_modules/", "data/", "uploads/"],
  },
  js.configs.recommended,
  {
    files: ["app.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "script",
      globals: browserGlobals,
    },
  },
  {
    files: ["server.js", "frontend-server.js", "test/**/*.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "commonjs",
      globals: nodeGlobals,
    },
  },
];
