import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "/simple_flasher/",
  resolve: {
    alias: {
      "atob-lite": fileURLToPath(new URL("./src/shims/atob-lite.js", import.meta.url)),
    },
  },
});
