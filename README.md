# GitHub Desktop Plus

A modern Git client built with Electron, Vue 3, and Tailwind CSS.

## Tech Stack

- **Electron** - Desktop application framework
- **Vue 3** - UI framework with Composition API
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **[Reka UI](https://reka-ui.com)** - Accessible component primitives
- **Drizzle ORM** - Database (SQLite)
- **simple-git** - Git operations

## Development

```sh
# Install dependencies
pnpm install

# Rebuild native modules for Electron
npx electron-rebuild

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Window Vibrancy (macOS)

The app uses native macOS vibrancy to create a frosted glass effect where the desktop wallpaper blurs through the window background. This is enabled automatically on macOS via `BrowserWindow.vibrancy: 'under-window'`.

### DevTools Note

In development, DevTools opens in a **detached (separate) window** by default. This is intentional — if DevTools is docked inside the app window, its opaque background covers the vibrancy effect. If you manually dock DevTools back into the app, the transparent background will be hidden behind the DevTools panel. To restore vibrancy visibility, undock DevTools by clicking the "pop out" icon (top-right of DevTools) or pressing `Cmd+Shift+D`.

## License

MIT
