import { ref, onMounted, onUnmounted } from 'vue'
import type { CodeViewerTheme } from '@ngeenx/nx-code-viewer-utils'

/**
 * Reactively detects the current app theme by observing the `.dark` class
 * on `<html>`. This is the source of truth — it works regardless of whether
 * the Pinia store has initialized yet or how the theme was applied.
 */
export function useCodeViewerTheme() {
  const codeViewerTheme = ref<CodeViewerTheme>(
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  )

  let observer: MutationObserver | null = null

  onMounted(() => {
    observer = new MutationObserver(() => {
      codeViewerTheme.value = document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light'
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { codeViewerTheme }
}
