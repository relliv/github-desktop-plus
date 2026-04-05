<template>
  <span
    v-if="iconSvg"
    class="inline-flex items-center justify-center"
    :class="className"
    :style="{ color: iconColor }"
    v-html="iconSvg"
  />
  <File v-else class="text-muted-foreground" :class="className" :stroke-width="1.5" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { File } from "lucide-vue-next";
import { useAppStore } from "@/stores/app.store";
import {
  siTypescript,
  siJavascript,
  siReact,
  siVuedotjs,
  siSvelte,
  siAngular,
  siHtml5,
  siCss,
  siSass,
  siJson,
  siMarkdown,
  siPython,
  siRust,
  siGo,
  siCplusplus,
  siC,
  siSwift,
  siKotlin,
  siPhp,
  siRuby,
  siDocker,
  siYaml,
  siToml,
  siGnubash,
  siNodedotjs,
  siGit,
  siEslint,
  siPrettier,
  siTailwindcss,
  siVite,
  siWebpack,
  siPostcss,
  siGraphql,
  siSqlite,
} from "simple-icons";
import type { SimpleIcon } from "simple-icons";

interface Props {
  filename: string;
  className?: string;
}

const props = defineProps<Props>();
const appStore = useAppStore();

const extensionMap: Record<string, SimpleIcon> = {
  ts: siTypescript,
  tsx: siReact,
  js: siJavascript,
  jsx: siReact,
  vue: siVuedotjs,
  svelte: siSvelte,
  angular: siAngular,
  html: siHtml5,
  htm: siHtml5,
  css: siCss,
  scss: siSass,
  sass: siSass,
  less: siCss,
  json: siJson,
  jsonc: siJson,
  md: siMarkdown,
  mdx: siMarkdown,
  py: siPython,
  rs: siRust,
  go: siGo,
  cpp: siCplusplus,
  cc: siCplusplus,
  cxx: siCplusplus,
  c: siC,
  h: siC,
  hpp: siCplusplus,
  swift: siSwift,
  kt: siKotlin,
  kts: siKotlin,
  php: siPhp,
  rb: siRuby,
  sh: siGnubash,
  bash: siGnubash,
  zsh: siGnubash,
  yaml: siYaml,
  yml: siYaml,
  toml: siToml,
  graphql: siGraphql,
  gql: siGraphql,
  sql: siSqlite,
  postcss: siPostcss,
};

const filenameMap: Record<string, SimpleIcon> = {
  dockerfile: siDocker,
  "docker-compose.yml": siDocker,
  "docker-compose.yaml": siDocker,
  ".gitignore": siGit,
  ".gitattributes": siGit,
  ".gitmodules": siGit,
  ".eslintrc": siEslint,
  ".eslintrc.js": siEslint,
  ".eslintrc.cjs": siEslint,
  "eslint.config.js": siEslint,
  "eslint.config.mjs": siEslint,
  "eslint.config.ts": siEslint,
  ".prettierrc": siPrettier,
  ".prettierrc.js": siPrettier,
  "prettier.config.js": siPrettier,
  "tailwind.config.js": siTailwindcss,
  "tailwind.config.ts": siTailwindcss,
  "vite.config.ts": siVite,
  "vite.config.js": siVite,
  "webpack.config.js": siWebpack,
  "webpack.config.ts": siWebpack,
  "package.json": siNodedotjs,
  "package-lock.json": siNodedotjs,
  "pnpm-lock.yaml": siNodedotjs,
  "yarn.lock": siNodedotjs,
  "tsconfig.json": siTypescript,
  "tsconfig.node.json": siTypescript,
  "tsconfig.app.json": siTypescript,
  "postcss.config.js": siPostcss,
  "postcss.config.cjs": siPostcss,
};

function lightenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const lighten = (c: number) =>
    Math.min(255, Math.round(c + (255 - c) * amount));
  return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
}

const resolvedIcon = computed(() => {
  const name = props.filename.split("/").pop()?.toLowerCase() || "";
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return filenameMap[name] ?? extensionMap[ext] ?? null;
});

const iconSvg = computed(() => {
  if (!resolvedIcon.value) return null;
  return resolvedIcon.value.svg.replace(
    "<svg ",
    `<svg fill="currentColor" width="100%" height="100%" `,
  );
});

const iconColor = computed(() => {
  if (!resolvedIcon.value) return undefined;
  const hex = resolvedIcon.value.hex;
  return appStore.isDark ? lightenHex(hex, 0.6) : `#${hex}`;
});
</script>
