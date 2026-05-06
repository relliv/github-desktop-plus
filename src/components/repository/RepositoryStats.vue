<template>
  <div class="h-full overflow-y-auto p-6" v-lenis>
    <!-- Loading state -->
    <div v-if="loading" class="text-muted-foreground flex h-full items-center justify-center">
      <Loader2 class="mr-2 h-5 w-5 animate-spin" />
      Loading statistics...
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="text-muted-foreground flex h-full flex-col items-center justify-center gap-2"
    >
      <AlertTriangle class="h-5 w-5" />
      <p class="text-sm">{{ error }}</p>
      <button class="hover:text-foreground text-xs underline" @click="loadStats">Retry</button>
    </div>

    <!-- Stats content -->
    <div v-else-if="stats" class="space-y-4 pb-6">
      <!-- Header with rescan button -->
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold">Repository Statistics</h2>
        <button
          @click="loadStats"
          class="hover:bg-accent rounded p-1 transition-colors"
          title="Rescan statistics"
        >
          <RefreshCw class="text-muted-foreground size-3.5" :stroke-width="1.5" />
        </button>
      </div>

      <!-- Overview cards -->
      <div class="grid grid-cols-5 gap-3">
        <Card v-for="card in overviewCards" :key="card.label" class="overflow-hidden">
          <CardContent class="flex items-center gap-3 p-4">
            <div
              class="flex size-9 shrink-0 items-center justify-center rounded-lg"
              :class="card.iconBg"
            >
              <component :is="card.icon" class="size-4" :class="card.iconColor" />
            </div>
            <div class="min-w-0">
              <div class="text-muted-foreground text-xs leading-none">
                {{ card.label }}
              </div>
              <div class="mt-0.5 truncate text-lg leading-tight font-semibold">
                {{ card.value }}
              </div>
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
              style="width: 100%; height: 280px"
            />
          </CardContent>
        </Card>

        <!-- Two column layout: Contributors + Languages -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Contributors -->
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium">Top Contributors</CardTitle>
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
              <CardTitle class="text-sm font-medium">Language Breakdown</CardTitle>
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
import { computed, nextTick, ref, watch } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  GitCommitHorizontal,
  Users,
  FileCode,
  GitBranch,
  Tag,
} from 'lucide-vue-next'
import { useRepositoriesStore } from '@/shared/stores'
import { useAppStore } from '@/stores/app.store'
import VChart from 'vue-echarts'
import 'vue-echarts/style.css'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
])

interface StatsData {
  contributors: Array<{ name: string; commits: number }>
  activityData: Array<{ week: string; commits: number }>
  activityByUser: Record<string, number[]>
  granularity: 'week' | 'month'
  languages: Array<{ name: string; count: number }>
  totalCommits: number
  totalFiles: number
  localBranches: number
  remoteBranches: number
  tagCount: number
}

const repositoriesStore = useRepositoriesStore()
const appStore = useAppStore()
const currentRepository = computed(() => repositoriesStore.currentRepository)

const loading = ref(false)
const error = ref<string | null>(null)
const stats = ref<StatsData | null>(null)
// Defer chart rendering until DOM is laid out so ECharts gets real dimensions
const chartsReady = ref(false)

const loadStats = async () => {
  if (!currentRepository.value) return
  loading.value = true
  error.value = null
  chartsReady.value = false
  try {
    const result = await window.api.git.getStats(currentRepository.value.path)
    if (result.success) {
      stats.value = result.data
      // Wait for Vue to render the cards/containers, then show charts
      await nextTick()
      chartsReady.value = true
    } else {
      error.value = result.error || 'Failed to load stats'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load stats'
  } finally {
    loading.value = false
  }
}

watch(currentRepository, () => loadStats(), { immediate: true })

// Theme-aware colors
const textColor = computed(() => (appStore.isDark ? '#a1a1aa' : '#71717a'))
const borderColor = computed(() =>
  appStore.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
)
const accentColor = computed(() => (appStore.isDark ? 'hsl(220, 60%, 60%)' : 'hsl(220, 60%, 40%)'))

// Overview cards
const overviewCards = computed(() => {
  if (!stats.value) return []
  return [
    {
      label: 'Commits',
      value: stats.value.totalCommits.toLocaleString(),
      icon: GitCommitHorizontal,
      iconBg: 'bg-blue-500/10 dark:bg-blue-400/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Contributors',
      value: stats.value.contributors.length,
      icon: Users,
      iconBg: 'bg-violet-500/10 dark:bg-violet-400/10',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Files',
      value: stats.value.totalFiles.toLocaleString(),
      icon: FileCode,
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Branches',
      value: `${stats.value.localBranches} / ${stats.value.remoteBranches}`,
      icon: GitBranch,
      iconBg: 'bg-amber-500/10 dark:bg-amber-400/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Tags',
      value: stats.value.tagCount,
      icon: Tag,
      iconBg: 'bg-rose-500/10 dark:bg-rose-400/10',
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
  ]
})

// Color palette for per-user series
const seriesPalette = computed(() =>
  appStore.isDark
    ? ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#fb923c', '#e879f9', '#38bdf8']
    : ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#f97316', '#d946ef', '#0ea5e9'],
)

// Commit activity chart
const activityChartOption = computed(() => {
  if (!stats.value) return {}
  const data = stats.value.activityData
  const byUser = stats.value.activityByUser
  // Filter out authors with all-zero data — ECharts crashes on highlight
  // when a stacked line series has no rendered polygon element
  const authors = Object.keys(byUser).filter((a) => byUser[a].some((v) => v > 0))
  const palette = seriesPalette.value
  const isMonthly = stats.value.granularity === 'month'

  // Format a bucket key string (YYYY-MM or YYYY-MM-DD) into a readable label
  const formatKey = (v: string) => {
    if (isMonthly) {
      const [y, m] = v.split('-').map(Number)
      const d = new Date(y, m - 1, 1)
      return `${d.toLocaleString('default', { month: 'short' })} ${y}`
    }
    const d = new Date(v + 'T00:00:00')
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`
  }
  // dataZoom labelFormatter receives a numeric category index, not the string value
  const formatLabel = (idx: number) => {
    const key = data[Math.round(idx)]?.week
    return key ? formatKey(key) : ''
  }

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: appStore.isDark ? '#27272a' : '#fff',
      borderColor: borderColor.value,
      textStyle: { color: textColor.value, fontSize: 12 },
    },
    legend: {
      data: authors,
      top: 4,
      left: 'center',
      textStyle: { color: textColor.value, fontSize: 10 },
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
    },
    grid: { left: 40, right: 16, top: 30, bottom: 56 },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        bottom: 4,
        height: 22,
        borderColor: 'transparent',
        backgroundColor: appStore.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        fillerColor: appStore.isDark ? 'rgba(96,165,250,0.2)' : 'rgba(59,130,246,0.15)',
        handleStyle: { color: accentColor.value },
        textStyle: { color: textColor.value, fontSize: 9 },
        labelFormatter: formatLabel,
        brushSelect: false,
      },
    ],
    xAxis: {
      type: 'category',
      data: data.map((d) => d.week),
      axisLabel: {
        color: textColor.value,
        fontSize: 10,
        formatter: formatKey,
        interval: Math.max(Math.floor(data.length / 8) - 1, 0),
      },
      axisLine: { lineStyle: { color: borderColor.value } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: borderColor.value } },
      axisLabel: { color: textColor.value, fontSize: 10 },
    },
    series: authors.length
      ? authors.map((author, i) => ({
          name: author,
          type: 'line',
          stack: 'total',
          smooth: true,
          smoothMonotone: 'x',
          data: byUser[author],
          showSymbol: false,
          lineStyle: { width: 1.5, color: palette[i % palette.length] },
          areaStyle: { color: palette[i % palette.length], opacity: 0.25 },
          emphasis: { disabled: true },
        }))
      : [
          {
            type: 'line',
            smooth: true,
            smoothMonotone: 'x',
            data: data.map((d) => d.commits),
            showSymbol: false,
            lineStyle: { width: 1.5, color: accentColor.value },
            areaStyle: { color: accentColor.value, opacity: 0.25 },
            emphasis: { disabled: true },
          },
        ],
  }
})

// Contributors horizontal bar chart (top 10)
const contributorsChartOption = computed(() => {
  if (!stats.value) return {}
  const top = stats.value.contributors.slice(0, 10).reverse()
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: appStore.isDark ? '#27272a' : '#fff',
      borderColor: borderColor.value,
      textStyle: { color: textColor.value, fontSize: 12 },
    },
    grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: borderColor.value } },
      axisLabel: { color: textColor.value, fontSize: 10 },
    },
    yAxis: {
      type: 'category',
      data: top.map((c) => c.name),
      axisLabel: { color: textColor.value, fontSize: 11, width: 100, overflow: 'truncate' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: top.map((c) => c.commits),
        barWidth: 14,
        itemStyle: {
          color: accentColor.value,
          borderRadius: [0, 3, 3, 0],
        },
      },
    ],
  }
})

// Language pie/donut chart
const languageChartOption = computed(() => {
  if (!stats.value) return {}
  const palette = appStore.isDark
    ? [
        '#60a5fa',
        '#a78bfa',
        '#34d399',
        '#fbbf24',
        '#f87171',
        '#fb923c',
        '#e879f9',
        '#38bdf8',
        '#94a3b8',
      ]
    : [
        '#3b82f6',
        '#8b5cf6',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#f97316',
        '#d946ef',
        '#0ea5e9',
        '#64748b',
      ]
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: appStore.isDark ? '#27272a' : '#fff',
      borderColor: borderColor.value,
      textStyle: { color: textColor.value, fontSize: 12 },
      formatter: (p: any) => `${p.name}<br/><strong>${p.value}</strong> files (${p.percent}%)`,
    },
    legend: {
      orient: 'vertical',
      right: 8,
      top: 'center',
      textStyle: { color: textColor.value, fontSize: 11 },
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: stats.value.languages.map((l, i) => ({
          name: l.name,
          value: l.count,
          itemStyle: { color: palette[i % palette.length] },
        })),
      },
    ],
  }
})
</script>
