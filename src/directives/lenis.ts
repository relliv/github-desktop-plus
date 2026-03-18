import Lenis from 'lenis'
import type { Directive } from 'vue'

const lenisInstances = new WeakMap<HTMLElement, Lenis>()

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
  },
  unmounted(el) {
    const lenis = lenisInstances.get(el)
    if (lenis) {
      lenis.destroy()
      lenisInstances.delete(el)
    }
  },
}
