import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

export const useAppStore = defineStore('app', () => {
  // Theme management
  const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: ''
  })
  
  const toggleTheme = useToggle(isDark)
  
  // Sidebar state
  const isSidebarCollapsed = ref(false)
  
  // Window state
  const isMaximized = ref(false)
  const isFullScreen = ref(false)
  
  // Actions
  const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }
  
  const setMaximized = (value: boolean) => {
    isMaximized.value = value
  }
  
  const setFullScreen = (value: boolean) => {
    isFullScreen.value = value
  }
  
  // Persist theme preference
  watch(isDark, (newValue) => {
    localStorage.setItem('theme', newValue ? 'dark' : 'light')
  })
  
  return {
    // State
    isDark,
    isSidebarCollapsed,
    isMaximized,
    isFullScreen,
    
    // Actions
    toggleTheme,
    toggleSidebar,
    setMaximized,
    setFullScreen
  }
})