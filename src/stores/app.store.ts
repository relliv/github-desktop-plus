import { defineStore } from "pinia";
import { ref, computed, watch, onMounted } from "vue";

export type Theme = "light" | "dark" | "system";

export const useAppStore = defineStore("app", () => {
  // Theme management
  const theme = ref<Theme>("system");
  const systemTheme = ref<"light" | "dark">("light");

  // Detect system theme preference
  const detectSystemTheme = () => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      systemTheme.value = "dark";
    } else {
      systemTheme.value = "light";
    }
  };

  // Listen for system theme changes
  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        systemTheme.value = e.matches ? "dark" : "light";
        if (theme.value === "system") {
          applyTheme();
        }
      });
  }

  // Computed property for actual theme
  const actualTheme = computed(() => {
    if (theme.value === "system") {
      return systemTheme.value;
    }
    return theme.value;
  });

  const isDark = computed(() => actualTheme.value === "dark");

  // Apply theme to HTML element
  const applyTheme = () => {
    const root = document.documentElement;
    if (actualTheme.value === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  // Set theme
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme;
    localStorage.setItem("theme", newTheme);
    applyTheme();
  };

  // Toggle theme with cycle: light -> dark -> system -> light
  const toggleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme.value);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Sidebar state
  const isSidebarCollapsed = ref(false);
  const sidebarSize = ref(20); // percentage of viewport width
  const minSidebarSize = 20;
  const maxSidebarSize = 30;

  // Window state
  const isMaximized = ref(false);
  const isFullScreen = ref(false);

  // Actions
  const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
  };

  const setSidebarSize = (size: number) => {
    sidebarSize.value = Math.max(
      minSidebarSize,
      Math.min(maxSidebarSize, size)
    );
    localStorage.setItem("sidebarSize", String(sidebarSize.value));
  };

  const initializeSidebarSize = () => {
    const savedSize = localStorage.getItem("sidebarSize");
    if (savedSize) {
      sidebarSize.value = Number(savedSize);
    }
  };

  const setMaximized = (value: boolean) => {
    isMaximized.value = value;
  };

  const setFullScreen = (value: boolean) => {
    isFullScreen.value = value;
  };

  // Initialize theme on mount
  const initializeTheme = () => {
    // Detect system theme first
    detectSystemTheme();

    // Load saved theme preference
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      theme.value = savedTheme;
    }

    // Apply the theme
    applyTheme();
  };

  // Watch for theme changes
  watch(theme, () => {
    applyTheme();
  });

  watch(systemTheme, () => {
    if (theme.value === "system") {
      applyTheme();
    }
  });

  return {
    // State
    theme,
    actualTheme,
    isDark,
    isSidebarCollapsed,
    sidebarSize,
    minSidebarSize,
    maxSidebarSize,
    isMaximized,
    isFullScreen,

    // Actions
    setTheme,
    toggleTheme,
    toggleSidebar,
    setSidebarSize,
    initializeSidebarSize,
    setMaximized,
    setFullScreen,
    initializeTheme,
  };
});
