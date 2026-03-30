import Lenis from 'lenis'
import type { Directive } from 'vue'

const lenisInstances = new WeakMap<HTMLElement, Lenis>()
const resizeObservers = new WeakMap<HTMLElement, ResizeObserver>()

export function getLenisInstance(el: HTMLElement): Lenis | undefined {
  return lenisInstances.get(el)
}

export const vLenis: Directive<HTMLElement> = {
  mounted(el) {
    const lenis = new Lenis({
      wrapper: el,
      content: el,
      autoRaf: true,
    })
    lenisInstances.set(el, lenis)

    // Watch for content size changes so Lenis recalculates scroll limits
    const ro = new ResizeObserver(() => {
      lenis.resize()
    })
    // Observe all direct children (the actual scrollable content)
    for (const child of el.children) {
      ro.observe(child)
    }
    resizeObservers.set(el, ro)
  },
  unmounted(el) {
    const ro = resizeObservers.get(el)
    if (ro) {
      ro.disconnect()
      resizeObservers.delete(el)
    }
    const lenis = lenisInstances.get(el)
    if (lenis) {
      lenis.destroy()
      lenisInstances.delete(el)
    }
  },
}
