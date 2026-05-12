'use client'

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'

type Language = 'pt' | 'en' | 'auto'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  currentLanguage: 'pt' | 'en'
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'finleaf-language'
const STORAGE_EVENT = 'finleaf-language-change'
const DEFAULT_LANGUAGE = 'pt'

function getStoredLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'auto'
  }

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    return 'auto'
  }

  try {
    const parsed = JSON.parse(saved) as Language
    return ['pt', 'en', 'auto'].includes(parsed) ? parsed : 'auto'
  } catch (error) {
    console.error('Error parsing language from localStorage:', error)
    return 'auto'
  }
}

function resolveLanguage(language: Language): 'pt' | 'en' {
  if (language !== 'auto') {
    return language
  }

  if (typeof window !== 'undefined') {
    return navigator.language.startsWith('pt') ? 'pt' : 'en'
  }

  return DEFAULT_LANGUAGE
}

function subscribeLanguageStore(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(STORAGE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(STORAGE_EVENT, onStoreChange)
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore<Language>(subscribeLanguageStore, getStoredLanguage, () => 'auto')
  const currentLanguage = useSyncExternalStore<'pt' | 'en'>(
    subscribeLanguageStore,
    () => resolveLanguage(getStoredLanguage()),
    () => DEFAULT_LANGUAGE
  )

  useEffect(() => {
    document.documentElement.lang = currentLanguage === 'pt' ? 'pt-BR' : 'en'
  }, [currentLanguage])

  const setLanguage = (newLanguage: Language) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newLanguage))
      window.dispatchEvent(new Event(STORAGE_EVENT))
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
