import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/kit/vite";

const config = {
  preprocess: vitePreprocess(),

  paths: {
    relative: false,
  },

  kit: {
    adapter: adapter(),
    paths: {
      base: "/secronet",
    },
  },
  baseUrl: "/secronet/",
};

export default config;
