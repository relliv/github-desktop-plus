<template>
  <div class="h-full overflow-y-auto p-6" v-lenis>
    <!-- Loading state -->
    <div
      v-if="loading"
      class="flex items-center justify-center h-full text-muted-foreground"
    >
      <Loader2 class="w-5 h-5 animate-spin mr-2" />
      Loading statistics...
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center h-full text-muted-foreground gap-2"
    >
      <AlertTriangle class="w-5 h-5" />
      <p class="text-sm">{{ error }}</p>
      <button
        class="text-xs underline hover:text-foreground"
        @click="loadStats"
      >
        Retry
      </button>
    </div>

    <!-- Stats content -->
    <div v-else-if="stats" class="space-y-4 pb-6">
      <!-- Overview cards -->
      <div class="grid grid-cols-4 gap-3">
        <Card v-for="card in overviewCards" :key="card.label">
          <CardContent class="p-4">
            <div class="text-2xl font-bold">{{ card.value }}</div>
            <div class="text-xs text-muted-foreground mt-1">
              {{ card.label }}
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Charts render after DOM layout so ECharts gets real dimensions -->
      <template v-if="chartsReady">
        <!-- Commit Activity chart -->
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Commit Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <VChart
              :option="activityChartOption"
              :autoresize="true"
              style="width: 100%; height: 200px"
            />
          </CardContent>
        </Card>

        <!-- Two column layout: Contributors + Languages -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Contributors -->
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium"
                >Top Contributors</CardTitle
              >
            </CardHeader>
            <CardContent>
              <VChart
                :option="contributorsChartOption"
                :autoresize="true"
                style="width: 100%; height: 260px"
              />
            </CardContent>
          </Card>

          <!-- Language Breakdown -->
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium"
                >Language Breakdown</CardTitle
              >
            </CardHeader>
            <CardContent>
              <VChart
                :option="languageChartOption"
                :autoresize="true"
                style="width: 100%; height: 260px"
              />
            </CardContent>
          </Card>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-vue-next";
import { useRepositoriesStore } from "@/shared/stores";
import { useAppStore } from "@/stores/app.store";
import VChart from "vue-echarts";
import "vue-echarts/style.css";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
]);

interface StatsData {
  contributors: Array<{ name: string; commits: number }>;
  activityData: Array<{ week: string; commits: number }>;
  languages: Array<{ name: string; count: number }>;
  totalCommits: number;
  totalFiles: number;
  localBranches: number;
  remoteBranches: number;
  tagCount: number;
}

const repositoriesStore = useRepositoriesStore();
const appStore = useAppStore();
const currentRepository = computed(() => repositoriesStore.currentRepository);

const loading = ref(false);
const error = ref<string | null>(null);
const stats = ref<StatsData | null>(null);
// Defer chart rendering until DOM is laid out so ECharts gets real dimensions
const chartsReady = ref(false);

const loadStats = async () => {
  if (!currentRepository.value) return;
  loading.value = true;
  error.value = null;
  chartsReady.value = false;
  try {
    const result = await window.api.git.getStats(currentRepository.value.path);
    if (result.success) {
      stats.value = result.data;
      // Wait for Vue to render the cards/containers, then show charts
      await nextTick();
      chartsReady.value = true;
    } else {
      error.value = result.error || "Failed to load stats";
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load stats";
  } finally {
    loading.value = false;
  }
};

watch(currentRepository, () => loadStats(), { immediate: true });

// Theme-aware colors
const textColor = computed(() => (appStore.isDark ? "#a1a1aa" : "#71717a"));
const borderColor = computed(() =>
  appStore.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
);
const accentColor = computed(() =>
  appStore.isDark ? "hsl(220, 60%, 60%)" : "hsl(220, 60%, 40%)",
);

// Overview cards
const overviewCards = computed(() => {
  if (!stats.value) return [];
  return [
    { label: "Total Commits", value: stats.value.totalCommits.toLocaleString() },
    { label: "Contributors", value: stats.value.contributors.length },
    { label: "Files", value: stats.value.totalFiles.toLocaleString() },
    {
      label: "Branches",
      value: `${stats.value.localBranches} / ${stats.value.remoteBranches}`,
    },
  ];
});

// Commit activity line chart
const activityChartOption = computed(() => {
  if (!stats.value) return {};
  const data = stats.value.activityData;
  return {
    tooltip: {
      trigger: "axis",
      backgroundColor: appStore.isDark ? "#27272a" : "#fff",
      borderColor: borderColor.value,
      textStyle: { color: textColor.value, fontSize: 12 },
    },
    grid: { left: 40, right: 16, top: 12, bottom: 24 },
    xAxis: {
      type: "category",
      data: data.map((d) => d.week),
      axisLabel: {
        color: textColor.value,
        fontSize: 10,
        formatter: (v: string) => {
          const d = new Date(v);
          return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
        },
        interval: Math.max(Math.floor(data.length / 8) - 1, 0),
      },
      axisLine: { lineStyle: { color: borderColor.value } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: borderColor.value } },
      axisLabel: { color: textColor.value, fontSize: 10 },
    },
    series: [
      {
        type: "line",
        data: data.map((d) => d.commits),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: accentColor.value, width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: appStore.isDark ? "rgba(96,165,250,0.25)" : "rgba(37,99,235,0.15)" },
              { offset: 1, color: "transparent" },
            ],
          },
        },
      },
    ],
  };
});

// Contributors horizontal bar chart (top 10)
const contributorsChartOption = computed(() => {
  if (!stats.value) return {};
  const top = stats.value.contributors.slice(0, 10).reverse();
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: appStore.isDark ? "#27272a" : "#fff",
      borderColor: borderColor.value,
      textStyle: { color: textColor.value, fontSize: 12 },
    },
    grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      splitLine: { lineStyle: { color: borderColor.value } },
      axisLabel: { color: textColor.value, fontSize: 10 },
    },
    yAxis: {
      type: "category",
      data: top.map((c) => c.name),
      axisLabel: { color: textColor.value, fontSize: 11, width: 100, overflow: "truncate" },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        data: top.map((c) => c.commits),
        barWidth: 14,
        itemStyle: {
          color: accentColor.value,
          borderRadius: [0, 3, 3, 0],
        },
      },
    ],
  };
});

// Language pie/donut chart
const languageChartOption = computed(() => {
  if (!stats.value) return {};
  const palette = appStore.isDark
    ? ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#f87171", "#fb923c", "#e879f9", "#38bdf8", "#94a3b8"]
    : ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#f97316", "#d946ef", "#0ea5e9", "#64748b"];
  return {
    tooltip: {
      trigger: "item",
      backgroundColor: appStore.isDark ? "#27272a" : "#fff",
      borderColor: borderColor.value,
      textStyle: { color: textColor.value, fontSize: 12 },
      formatter: (p: any) =>
        `${p.name}<br/><strong>${p.value}</strong> files (${p.percent}%)`,
    },
    legend: {
      orient: "vertical",
      right: 8,
      top: "center",
      textStyle: { color: textColor.value, fontSize: 11 },
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
    },
    series: [
      {
        type: "pie",
        radius: ["42%", "70%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: false,
        label: { show: false },
        data: stats.value.languages.map((l, i) => ({
          name: l.name,
          value: l.count,
          itemStyle: { color: palette[i % palette.length] },
        })),
      },
    ],
  };
});
</script>
