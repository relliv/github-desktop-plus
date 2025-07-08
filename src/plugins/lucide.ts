import { createApp } from 'vue'

// Configure default props for all Lucide icons
export function configureLucideIcons(app: ReturnType<typeof createApp>) {
  // Set global properties for Lucide icons
  app.config.globalProperties.$lucideProps = {
    strokeWidth: 1
  }
}

// Helper to get default Lucide props
export const lucideProps = {
  strokeWidth: 1
}