import { createContext, useContext, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark' | 'system'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
} | null>(null)

let listeners: Array<() => void> = []

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function subscribeToTheme(listener: () => void) {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function getThemeSnapshot(): Theme {
  return (localStorage.getItem('theme') || 'system') as Theme
}

function getThemeServerSnapshot(): Theme {
  return 'system'
}

function subscribeToSystemPreference(listener: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', listener)
  return () => mq.removeEventListener('change', listener)
}

function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getSystemPrefersDarkServer(): boolean {
  return false
}

function applyThemeToDocument(theme: Theme, systemPrefersDark: boolean) {
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark)
  document.documentElement.classList.toggle('dark', isDark)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  )

  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemPreference,
    getSystemPrefersDark,
    getSystemPrefersDarkServer
  )

  if (typeof window !== 'undefined') {
    applyThemeToDocument(theme, systemPrefersDark)
  }

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme)
    emitChange()
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
