'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'

export type Currency = 'BRL' | 'USD' | 'EUR'
export type Transaction = {
  id: string
  icon: string
  category: string
  date: string
  amount: number
  type: 'income' | 'expense'
  notes?: string
}
export type Goal = {
  id: string
  name: string
  current: number
  target: number
  monthlyContribution: number
  deadline: string
  color: string
}

interface FinanceContextValue {
  currency: Currency
  income: string
  bonus: string
  payday: string
  transactions: Transaction[]
  goals: Goal[]
  setCurrency: (value: Currency) => void
  setIncome: (value: string) => void
  setBonus: (value: string) => void
  setPayday: (value: string) => void
  addTransaction: (transaction: Omit<Transaction, 'id' | 'icon'>) => void
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'icon'>>) => void
  deleteTransaction: (id: string) => void
  addGoal: (goal: Omit<Goal, 'id' | 'current' | 'color'>) => void
  adjustGoal: (id: string, amount: number) => void
  formatAmount: (value: number) => string
}

const FinanceContext = createContext<FinanceContextValue | null>(null)
const STORAGE_KEY = 'finleaf-settings'
const STORAGE_EVENT = 'finleaf-settings-change'
const SETTINGS_VERSION = 2

export const CATEGORIES = [
  { name: 'Alimentacao', icon: '🍽️' },
  { name: 'Entretenimento', icon: '🎬' },
  { name: 'Saude', icon: '🏥' },
  { name: 'Educacao', icon: '📚' },
  { name: 'Contas', icon: '💡' },
  { name: 'Renda', icon: '💰' },
  { name: 'Transporte', icon: '🚗' },
  { name: 'Outros', icon: '📦' },
]

const defaultTransactions: Transaction[] = [
  { id: '1', icon: '💡', category: 'Contas', date: '2026-05-05', amount: 87.5, type: 'expense' },
  { id: '2', icon: '🍽️', category: 'Alimentacao', date: '2026-05-04', amount: 45.2, type: 'expense' },
  { id: '3', icon: '🏠', category: 'Contas', date: '2026-05-01', amount: 1250.0, type: 'expense' },
  { id: '4', icon: '💰', category: 'Renda', date: '2026-05-01', amount: 5400.0, type: 'income' },
  { id: '5', icon: '🍽️', category: 'Alimentacao', date: '2026-04-30', amount: 130.8, type: 'expense' },
]

const defaultGoals: Goal[] = [
  { id: '1', name: 'Comprar um PS5', current: 450, target: 2500, monthlyContribution: 120, deadline: '2026-12-15', color: 'bg-sky-500' },
  { id: '2', name: 'Férias em família', current: 1200, target: 4200, monthlyContribution: 250, deadline: '2027-03-01', color: 'bg-emerald-500' },
]

type FinanceSettings = Pick<FinanceContextValue, 'currency' | 'income' | 'bonus' | 'payday' | 'transactions' | 'goals'> & {
  version: number
}

const defaultSettings: FinanceSettings = {
  version: SETTINGS_VERSION,
  currency: 'EUR',
  income: '5400',
  bonus: '250',
  payday: '1',
  transactions: defaultTransactions,
  goals: defaultGoals,
}
let storedSettingsValue: string | null | undefined
let settingsSnapshot = defaultSettings

function getCategoryIcon(category: string) {
  const categoryMap = CATEGORIES.reduce((map, cat) => {
    map[cat.name] = cat.icon
    return map
  }, {} as Record<string, string>)
  return categoryMap[category] ?? '📦'
}

export function getCategoryTranslationKey(category: string) {
  const keyMap: Record<string, string> = {
    Alimentacao: 'categories.alimentacao',
    Entretenimento: 'categories.entretenimento',
    Saude: 'categories.saude',
    Educacao: 'categories.educacao',
    Contas: 'categories.contas',
    Renda: 'categories.renda',
    Transporte: 'categories.transporte',
    Outros: 'categories.outros',
  }

  return keyMap[category] ?? category
}

function getScheduledIncomeDate(payday: string) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const requestedDay = Math.min(Math.max(Number(payday) || 1, 1), 31)
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  const day = Math.min(requestedDay, lastDayOfMonth)

  return new Date(year, month, day)
}

function getStoredSettings(): FinanceSettings {
  if (typeof window === 'undefined') {
    return defaultSettings
  }

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === storedSettingsValue) {
    return settingsSnapshot
  }

  storedSettingsValue = saved
  if (!saved) {
    settingsSnapshot = defaultSettings
    return settingsSnapshot
  }

  try {
    const parsed = JSON.parse(saved) as Partial<FinanceSettings>
    const isCurrentSettingsVersion = parsed.version === SETTINGS_VERSION
    const parsedCurrency = parsed.currency
    const isValidCurrency = parsedCurrency && ['BRL', 'USD', 'EUR'].includes(parsedCurrency)
    settingsSnapshot = {
      version: SETTINGS_VERSION,
      currency: isValidCurrency && (parsedCurrency !== 'BRL' || isCurrentSettingsVersion) ? parsedCurrency : defaultSettings.currency,
      income: typeof parsed.income === 'string' ? parsed.income : defaultSettings.income,
      bonus: typeof parsed.bonus === 'string' ? parsed.bonus : defaultSettings.bonus,
      payday: typeof parsed.payday === 'string' ? parsed.payday : defaultSettings.payday,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : defaultSettings.transactions,
      goals: Array.isArray(parsed.goals) ? parsed.goals : defaultSettings.goals,
    }
    return settingsSnapshot
  } catch {
    settingsSnapshot = defaultSettings
    return settingsSnapshot
  }
}

function subscribeFinanceStore(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(STORAGE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(STORAGE_EVENT, onStoreChange)
  }
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { currency, income, bonus, payday, transactions, goals } = useSyncExternalStore(
    subscribeFinanceStore,
    getStoredSettings,
    () => defaultSettings
  )

  const saveSettings = useCallback((updateSettings: (current: FinanceSettings) => FinanceSettings) => {
    if (typeof window === 'undefined') {
      return
    }

    const nextSettings = updateSettings(getStoredSettings())
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings))
    window.dispatchEvent(new Event(STORAGE_EVENT))
  }, [])

  useEffect(() => {
    const monthlyIncome = Number(income)
    if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) {
      return
    }

    const scheduledDate = getScheduledIncomeDate(payday)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    scheduledDate.setHours(0, 0, 0, 0)

    if (today < scheduledDate) {
      return
    }

    const monthKey = `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth() + 1).padStart(2, '0')}`
    const transactionId = `monthly-income-${monthKey}`

    if (
      transactions.some(
        (transaction) =>
          transaction.id === transactionId ||
          (transaction.type === 'income' &&
            transaction.category === 'Renda' &&
            transaction.date === scheduledDate.toISOString().split('T')[0] &&
            transaction.amount === monthlyIncome)
      )
    ) {
      return
    }

    saveSettings((current) => ({
      ...current,
      transactions: [
        {
          id: transactionId,
          icon: getCategoryIcon('Renda'),
          category: 'Renda',
          date: scheduledDate.toISOString().split('T')[0],
          amount: monthlyIncome,
          type: 'income',
          notes: 'Automatic monthly income',
        },
        ...current.transactions,
      ],
    }))
  }, [income, payday, saveSettings, transactions])

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'icon'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      icon: getCategoryIcon(transaction.category),
    }
    saveSettings((current) => ({ ...current, transactions: [newTransaction, ...current.transactions] }))
  }

  const updateTransaction = (id: string, updates: Partial<Omit<Transaction, 'id' | 'icon'>>) => {
    saveSettings((current) => ({
      ...current,
      transactions: current.transactions.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              ...updates,
              icon: updates.category ? getCategoryIcon(updates.category) : transaction.icon,
            }
          : transaction
      )
    }))
  }

  const deleteTransaction = (id: string) => {
    saveSettings((current) => ({
      ...current,
      transactions: current.transactions.filter((transaction) => transaction.id !== id),
    }))
  }

  const addGoal = (goal: Omit<Goal, 'id' | 'current' | 'color'>) => {
    const newGoal: Goal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      current: 0,
      color: 'bg-amber-500',
      ...goal,
    }
    saveSettings((current) => ({ ...current, goals: [newGoal, ...current.goals] }))
  }

  const adjustGoal = (id: string, amount: number) => {
    saveSettings((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              current: Math.max(0, goal.current + amount),
            }
          : goal
      )
    }))
  }

  const formatAmount = useMemo(() => {
    const settings = {
      BRL: { locale: 'pt-BR', currency: 'BRL' },
      USD: { locale: 'en-US', currency: 'USD' },
      EUR: { locale: 'de-DE', currency: 'EUR' },
    }[currency]

    return (value: number) => {
      return new Intl.NumberFormat(settings.locale, {
        style: 'currency',
        currency: settings.currency,
        maximumFractionDigits: 2,
      }).format(value)
    }
  }, [currency])

  return (
    <FinanceContext.Provider
      value={{
        currency,
        income,
        bonus,
        payday,
        transactions,
        goals,
        setCurrency: (value) => saveSettings((current) => ({ ...current, currency: value })),
        setIncome: (value) => saveSettings((current) => ({ ...current, income: value })),
        setBonus: (value) => saveSettings((current) => ({ ...current, bonus: value })),
        setPayday: (value) => saveSettings((current) => ({ ...current, payday: value })),
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addGoal,
        adjustGoal,
        formatAmount,
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider')
  }
  return context
}
