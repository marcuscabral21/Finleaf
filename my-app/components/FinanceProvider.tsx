'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseclient'

export type Currency = 'BRL' | 'USD' | 'EUR'
export type Transaction = {
  id: string
  icon: string
  category: string
  categoryId?: string | null
  createdAt?: string
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
  user: User | null
  loading: boolean
  currency: Currency
  income: string
  bonus: string
  investmentBase: string
  payday: string
  transactions: Transaction[]
  goals: Goal[]
  setCurrency: (value: Currency) => void
  setIncome: (value: string) => void
  setBonus: (value: string) => void
  setInvestmentBase: (value: string) => void
  setPayday: (value: string) => void
  addTransaction: (transaction: Omit<Transaction, 'id' | 'icon'>) => void
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'icon'>>) => void
  deleteTransaction: (id: string) => void
  addGoal: (goal: Omit<Goal, 'id' | 'current' | 'color'>) => void
  updateGoal: (id: string, updates: Partial<Pick<Goal, 'name' | 'target' | 'deadline'>>) => void
  adjustGoal: (id: string, amount: number) => void
  deleteGoal: (id: string) => void
  formatAmount: (value: number) => string
}

type DbCategory = {
  id: string
  name: string
  icon_light: string
  icon_dark: string
  color_light: string
  color_dark: string
}

type DbTransaction = {
  id: string
  category_id: string | null
  amount: string | number
  description: string | null
  notes: string | null
  type: 'income' | 'expense'
  transaction_date: string | null
  created_at: string | null
  categories: DbCategory | null
}

type DbGoal = {
  id: string
  name: string
  target_amount: string | number
  current_amount: string | number | null
  deadline: string | null
  color_light: string | null
}

const FinanceContext = createContext<FinanceContextValue | null>(null)
const PROFILE_STORAGE_PREFIX = 'finleaf-profile-settings'
const SKIPPED_MONTHLY_INCOME_PREFIX = 'finleaf-skipped-monthly-income'
const SKIPPED_MONTHLY_INVESTMENT_PREFIX = 'finleaf-skipped-monthly-investment'

export const CATEGORIES = [
  { name: 'Alimentacao', icon: '🍽️' },
  { name: 'Entretenimento', icon: '🎬' },
  { name: 'Saude', icon: '🏥' },
  { name: 'Educacao', icon: '📚' },
  { name: 'Contas', icon: '💡' },
  { name: 'Investimentos', icon: '📈' },
  { name: 'Renda', icon: '💰' },
  { name: 'Transporte', icon: '🚗' },
  { name: 'Outros', icon: '📦' },
]

const defaultCurrency: Currency = 'EUR'
const defaultProfileSettings = {
  income: '0',
  bonus: '0',
  investmentBase: '0',
  payday: '1',
}

function getCategoryIcon(category: string) {
  if (category === 'Investimentos') {
    return '📈'
  }

  const categoryMap = CATEGORIES.reduce((map, cat) => {
    map[cat.name] = cat.icon
    return map
  }, {} as Record<string, string>)
  return categoryMap[category] ?? '📦'
}

function normalizeCategoryIcon(category: string, icon?: string | null) {
  const iconMap: Record<string, string> = {
    MdAccountBalance: '🏦',
    MdAttachMoney: '💰',
    MdSavings: '💰',
    MdHome: '🏠',
    MdHouse: '🏠',
    MdRestaurant: '🍽️',
    MdFastfood: '🍽️',
    MdLocalGroceryStore: '🛒',
    MdMovie: '🎬',
    MdSportsEsports: '🎮',
    MdLocalHospital: '🏥',
    MdSchool: '📚',
    MdDirectionsCar: '🚗',
    MdDirectionsBus: '🚌',
    MdReceipt: '🧾',
    MdLightbulb: '💡',
    MdStar: '⭐',
    MdCategory: '📦',
    MdInventory: '📦',
    MdTrendingUp: '📈',
    MdShowChart: '📈',
    MdTimeline: '📈',
    MdBarChart: '📊',
  }

  if (!icon) {
    return getCategoryIcon(category)
  }

  return iconMap[icon] ?? (icon.startsWith('Md') ? getCategoryIcon(category) : icon)
}

function getCategoryColor(color: string | null | undefined) {
  const colorMap: Record<string, string> = {
    '#6366f1': 'bg-indigo-500',
    '#818cf8': 'bg-indigo-400',
    '#10b981': 'bg-emerald-500',
    '#0ea5e9': 'bg-sky-500',
    '#f59e0b': 'bg-amber-500',
    '#ef4444': 'bg-rose-500',
  }

  return color ? colorMap[color.toLowerCase()] ?? 'bg-amber-500' : 'bg-amber-500'
}

export function getCategoryTranslationKey(category: string) {
  const keyMap: Record<string, string> = {
    Alimentacao: 'categories.alimentacao',
    Entretenimento: 'categories.entretenimento',
    Saude: 'categories.saude',
    Educacao: 'categories.educacao',
    Contas: 'categories.contas',
    Investimentos: 'categories.investimentos',
    Renda: 'categories.renda',
    Transporte: 'categories.transporte',
    Outros: 'categories.outros',
  }

  return keyMap[category] ?? category
}

function getProfileStorageKey(userId: string) {
  return `${PROFILE_STORAGE_PREFIX}-${userId}`
}

function getSkippedMonthlyIncomeStorageKey(userId: string) {
  return `${SKIPPED_MONTHLY_INCOME_PREFIX}-${userId}`
}

function getSkippedMonthlyInvestmentStorageKey(userId: string) {
  return `${SKIPPED_MONTHLY_INVESTMENT_PREFIX}-${userId}`
}

function getStoredProfileSettings(userId: string) {
  if (typeof window === 'undefined') {
    return defaultProfileSettings
  }

  const saved = window.localStorage.getItem(getProfileStorageKey(userId))
  if (!saved) {
    return defaultProfileSettings
  }

  try {
    const parsed = JSON.parse(saved) as Partial<typeof defaultProfileSettings>
    return {
      income: typeof parsed.income === 'string' ? parsed.income : defaultProfileSettings.income,
      bonus: typeof parsed.bonus === 'string' ? parsed.bonus : defaultProfileSettings.bonus,
      investmentBase: typeof parsed.investmentBase === 'string' ? parsed.investmentBase : defaultProfileSettings.investmentBase,
      payday: typeof parsed.payday === 'string' ? parsed.payday : defaultProfileSettings.payday,
    }
  } catch {
    return defaultProfileSettings
  }
}

function saveProfileSettings(userId: string, settings: typeof defaultProfileSettings) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(getProfileStorageKey(userId), JSON.stringify(settings))
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

function getMonthlyIncomeNote(monthKey: string) {
  return `finleaf-monthly-income:${monthKey}`
}

function getMonthlyInvestmentNote(monthKey: string) {
  return `finleaf-monthly-investment:${monthKey}`
}

function getMonthKeyFromDate(date: string) {
  return date.slice(0, 7)
}

function getSkippedMonthlyIncomeMonths(userId: string) {
  if (typeof window === 'undefined') {
    return []
  }

  const saved = window.localStorage.getItem(getSkippedMonthlyIncomeStorageKey(userId))
  if (!saved) {
    return []
  }

  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function getSkippedMonthlyInvestmentMonths(userId: string) {
  if (typeof window === 'undefined') {
    return []
  }

  const saved = window.localStorage.getItem(getSkippedMonthlyInvestmentStorageKey(userId))
  if (!saved) {
    return []
  }

  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function skipMonthlyIncomeForMonth(userId: string, monthKey: string) {
  if (typeof window === 'undefined') {
    return
  }

  const skippedMonths = getSkippedMonthlyIncomeMonths(userId)
  if (skippedMonths.includes(monthKey)) {
    return
  }

  window.localStorage.setItem(getSkippedMonthlyIncomeStorageKey(userId), JSON.stringify([...skippedMonths, monthKey]))
}

function skipMonthlyInvestmentForMonth(userId: string, monthKey: string) {
  if (typeof window === 'undefined') {
    return
  }

  const skippedMonths = getSkippedMonthlyInvestmentMonths(userId)
  if (skippedMonths.includes(monthKey)) {
    return
  }

  window.localStorage.setItem(getSkippedMonthlyInvestmentStorageKey(userId), JSON.stringify([...skippedMonths, monthKey]))
}

function mapTransaction(row: DbTransaction): Transaction {
  const categoryName = row.categories?.name ?? row.description ?? 'Outros'
  return {
    id: row.id,
    categoryId: row.category_id,
    icon: normalizeCategoryIcon(categoryName, row.categories?.icon_light),
    category: categoryName,
    date: row.transaction_date ?? new Date().toISOString().split('T')[0],
    createdAt: row.created_at ?? undefined,
    amount: Number(row.amount),
    type: row.type,
    notes: row.notes ?? undefined,
  }
}

function mapGoal(row: DbGoal): Goal {
  return {
    id: row.id,
    name: row.name,
    current: Number(row.current_amount ?? 0),
    target: Number(row.target_amount),
    monthlyContribution: 0,
    deadline: row.deadline ?? '',
    color: getCategoryColor(row.color_light),
  }
}

function compareTransactionsNewestFirst(first: Transaction, second: Transaction) {
  const dateCompare = second.date.localeCompare(first.date)
  if (dateCompare !== 0) {
    return dateCompare
  }

  return (second.createdAt ?? '').localeCompare(first.createdAt ?? '')
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrencyState] = useState<Currency>(defaultCurrency)
  const [income, setIncomeState] = useState(defaultProfileSettings.income)
  const [bonus, setBonusState] = useState(defaultProfileSettings.bonus)
  const [investmentBase, setInvestmentBaseState] = useState(defaultProfileSettings.investmentBase)
  const [payday, setPaydayState] = useState(defaultProfileSettings.payday)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] = useState<DbCategory[]>([])

  const loadFinanceData = useCallback(async (currentUser: User) => {
    setLoading(true)

    const profileSettings = getStoredProfileSettings(currentUser.id)
    setIncomeState(profileSettings.income)
    setBonusState(defaultProfileSettings.bonus)
    setInvestmentBaseState(profileSettings.investmentBase)
    setPaydayState(profileSettings.payday)

    const [settingsResult, categoriesResult, transactionsResult, goalsResult] = await Promise.all([
      supabase.from('user_settings').select('currency').eq('user_id', currentUser.id).maybeSingle(),
      supabase.from('categories').select('id,name,icon_light,icon_dark,color_light,color_dark').or(`user_id.eq.${currentUser.id},user_id.is.null`),
      supabase
        .from('transactions')
        .select('id,category_id,amount,description,notes,type,transaction_date,created_at,categories(id,name,icon_light,icon_dark,color_light,color_dark)')
        .eq('user_id', currentUser.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('goals')
        .select('id,name,target_amount,current_amount,deadline,color_light')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false }),
    ])

    if (settingsResult.data?.currency && ['BRL', 'USD', 'EUR'].includes(settingsResult.data.currency)) {
      setCurrencyState(settingsResult.data.currency as Currency)
    } else {
      setCurrencyState(defaultCurrency)
    }

    setCategories(categoriesResult.data ?? [])
    setTransactions(((transactionsResult.data ?? []) as unknown as DbTransaction[]).map(mapTransaction))
    setGoals(((goalsResult.data ?? []) as DbGoal[]).map(mapGoal))
    setLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return

      const currentUser = data.user
      setUser(currentUser)

      if (currentUser) {
        void loadFinanceData(currentUser)
      } else {
        setTransactions([])
        setGoals([])
        setCategories([])
        setLoading(false)
        if (pathname !== '/login' && pathname !== '/reset-password') {
          router.replace('/login')
        }
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        void loadFinanceData(currentUser)
      } else {
        setTransactions([])
        setGoals([])
        setCategories([])
        setCurrencyState(defaultCurrency)
        setIncomeState(defaultProfileSettings.income)
        setBonusState(defaultProfileSettings.bonus)
        setInvestmentBaseState(defaultProfileSettings.investmentBase)
        setPaydayState(defaultProfileSettings.payday)
        setLoading(false)
        if (pathname !== '/login' && pathname !== '/reset-password') {
          router.replace('/login')
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadFinanceData, pathname, router])

  useEffect(() => {
    if (loading || !user || pathname === '/login' || pathname === '/reset-password') {
      return
    }

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
    const scheduledDateText = scheduledDate.toISOString().split('T')[0]
    const monthlyIncomeNote = getMonthlyIncomeNote(monthKey)
    const skippedMonthlyIncomeMonths = getSkippedMonthlyIncomeMonths(user.id)
    if (skippedMonthlyIncomeMonths.includes(monthKey)) {
      return
    }

    const automaticMonthlyIncome = transactions.find(
      (transaction) =>
        transaction.type === 'income' &&
        (transaction.notes === monthlyIncomeNote ||
          (transaction.notes === 'Automatic monthly income' && transaction.date === scheduledDateText))
    )

    if (automaticMonthlyIncome) {
      if (automaticMonthlyIncome.amount !== monthlyIncome || automaticMonthlyIncome.notes !== monthlyIncomeNote) {
        const updateMonthlyIncome = async () => {
          const { error } = await supabase
            .from('transactions')
            .update({
              amount: monthlyIncome,
              notes: monthlyIncomeNote,
              updated_at: new Date().toISOString(),
            })
            .eq('id', automaticMonthlyIncome.id)
            .eq('user_id', user.id)

          if (!error) {
            setTransactions((current) =>
              current.map((transaction) =>
                transaction.id === automaticMonthlyIncome.id
                  ? {
                      ...transaction,
                      amount: monthlyIncome,
                      notes: monthlyIncomeNote,
                    }
                  : transaction
              )
            )
          }
        }

        void updateMonthlyIncome()
      }

      return
    }

    const hasManualIncomeOnPayday = transactions.some(
      (transaction) => transaction.type === 'income' && transaction.category === 'Renda' && transaction.date === scheduledDateText
    )

    if (hasManualIncomeOnPayday) {
      return
    }

    const rendaCategory = categories.find((category) => category.name === 'Renda')
    const insertMonthlyIncome = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          category_id: rendaCategory?.id ?? null,
          amount: monthlyIncome,
          type: 'income',
          transaction_date: scheduledDateText,
          notes: monthlyIncomeNote,
        })
        .select('id,category_id,amount,description,notes,type,transaction_date,created_at,categories(id,name,icon_light,icon_dark,color_light,color_dark)')
        .single()

      if (!error && data) {
        setTransactions((current) => [mapTransaction(data as unknown as DbTransaction), ...current])
      }
    }

    void insertMonthlyIncome()
  }, [categories, income, loading, payday, pathname, transactions, user])

  useEffect(() => {
    if (loading || !user || pathname === '/login' || pathname === '/reset-password') {
      return
    }

    const monthlyInvestment = Number(investmentBase)
    if (!Number.isFinite(monthlyInvestment) || monthlyInvestment <= 0) {
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
    const scheduledDateText = scheduledDate.toISOString().split('T')[0]
    const monthlyInvestmentNote = getMonthlyInvestmentNote(monthKey)
    const skippedMonthlyInvestmentMonths = getSkippedMonthlyInvestmentMonths(user.id)
    if (skippedMonthlyInvestmentMonths.includes(monthKey)) {
      return
    }

    const automaticMonthlyInvestment = transactions.find(
      (transaction) =>
        transaction.type === 'expense' &&
        transaction.category === 'Investimentos' &&
        transaction.notes === monthlyInvestmentNote
    )

    if (automaticMonthlyInvestment) {
      if (automaticMonthlyInvestment.amount !== monthlyInvestment) {
        const updateMonthlyInvestment = async () => {
          const { error } = await supabase
            .from('transactions')
            .update({
              amount: monthlyInvestment,
              description: 'Investimentos',
              updated_at: new Date().toISOString(),
            })
            .eq('id', automaticMonthlyInvestment.id)
            .eq('user_id', user.id)

          if (!error) {
            setTransactions((current) =>
              current.map((transaction) =>
                transaction.id === automaticMonthlyInvestment.id
                  ? {
                      ...transaction,
                      amount: monthlyInvestment,
                    }
                  : transaction
              )
            )
          }
        }

        void updateMonthlyInvestment()
      }

      return
    }

    const investimentosCategory = categories.find((category) => category.name === 'Investimentos')
    const insertMonthlyInvestment = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          category_id: investimentosCategory?.id ?? null,
          amount: monthlyInvestment,
          type: 'expense',
          transaction_date: scheduledDateText,
          description: 'Investimentos',
          notes: monthlyInvestmentNote,
        })
        .select('id,category_id,amount,description,notes,type,transaction_date,created_at,categories(id,name,icon_light,icon_dark,color_light,color_dark)')
        .single()

      if (!error && data) {
        setTransactions((current) => [mapTransaction(data as unknown as DbTransaction), ...current])
      }
    }

    void insertMonthlyInvestment()
  }, [categories, investmentBase, loading, payday, pathname, transactions, user])

  const persistProfileSettings = useCallback(
    (updates: Partial<typeof defaultProfileSettings>) => {
      if (!user) return
      const nextSettings = {
        income,
        bonus,
        investmentBase,
        payday,
        ...updates,
      }
      saveProfileSettings(user.id, nextSettings)
    },
    [bonus, income, investmentBase, payday, user]
  )

  const setCurrency = (value: Currency) => {
    setCurrencyState(value)
    if (!user) return

    void supabase.from('user_settings').upsert({
      user_id: user.id,
      currency: value,
      updated_at: new Date().toISOString(),
    })
  }

  const setIncome = (value: string) => {
    setIncomeState(value)
    persistProfileSettings({ income: value })
  }

  const setBonus = (value: string) => {
    setBonusState(value)
  }

  const setInvestmentBase = (value: string) => {
    setInvestmentBaseState(value)
    persistProfileSettings({ investmentBase: value })
  }

  const setPayday = (value: string) => {
    setPaydayState(value)
    persistProfileSettings({ payday: value })
  }

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'icon'>) => {
    if (!user) return

    const category = categories.find((item) => item.name === transaction.category)
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const optimisticTransaction: Transaction = {
      ...transaction,
      id: tempId,
      categoryId: category?.id ?? null,
      icon: normalizeCategoryIcon(transaction.category, category?.icon_light),
      createdAt: new Date().toISOString(),
    }
    setTransactions((current) => [optimisticTransaction, ...current])

    void supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        category_id: category?.id ?? null,
        amount: transaction.amount,
        description: transaction.category,
        type: transaction.type,
        transaction_date: transaction.date,
        notes: transaction.notes ?? null,
      })
      .select('id,category_id,amount,description,notes,type,transaction_date,created_at,categories(id,name,icon_light,icon_dark,color_light,color_dark)')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setTransactions((current) => current.filter((item) => item.id !== tempId))
          return
        }

        setTransactions((current) => current.map((item) => (item.id === tempId ? mapTransaction(data as unknown as DbTransaction) : item)))
      })
  }

  const updateTransaction = (id: string, updates: Partial<Omit<Transaction, 'id' | 'icon'>>) => {
    if (!user) return

    const category = updates.category ? categories.find((item) => item.name === updates.category) : undefined
    setTransactions((current) =>
      current.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              ...updates,
              categoryId: category?.id ?? transaction.categoryId,
              icon: updates.category ? normalizeCategoryIcon(updates.category, category?.icon_light) : transaction.icon,
            }
          : transaction
      )
    )

    void supabase
      .from('transactions')
      .update({
        category_id: updates.category ? category?.id ?? null : undefined,
        amount: updates.amount,
        description: updates.category,
        type: updates.type,
        transaction_date: updates.date,
        notes: Object.hasOwn(updates, 'notes') ? updates.notes ?? null : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
  }

  const deleteTransaction = (id: string) => {
    if (!user) return

    const deletedTransaction = transactions.find((transaction) => transaction.id === id)
    const scheduledIncomeDate = getScheduledIncomeDate(payday).toISOString().split('T')[0]
    const deletedMonthKey = deletedTransaction ? getMonthKeyFromDate(deletedTransaction.date) : null
    const isDeletedMonthlyIncome =
      deletedTransaction?.type === 'income' &&
      deletedMonthKey &&
      (deletedTransaction.notes === getMonthlyIncomeNote(deletedMonthKey) ||
        deletedTransaction.notes === 'Automatic monthly income' ||
        (deletedTransaction.category === 'Renda' && deletedTransaction.date === scheduledIncomeDate && deletedTransaction.amount === Number(income)))

    if (isDeletedMonthlyIncome && deletedMonthKey) {
      skipMonthlyIncomeForMonth(user.id, deletedMonthKey)
    }

    const isDeletedMonthlyInvestment =
      deletedTransaction?.type === 'expense' &&
      deletedTransaction.category === 'Investimentos' &&
      deletedMonthKey &&
      deletedTransaction.notes === getMonthlyInvestmentNote(deletedMonthKey)

    if (isDeletedMonthlyInvestment && deletedMonthKey) {
      skipMonthlyInvestmentForMonth(user.id, deletedMonthKey)
    }

    setTransactions((current) => current.filter((transaction) => transaction.id !== id))

    void supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .then(({ error }) => {
        if (error && deletedTransaction) {
          setTransactions((current) => [deletedTransaction, ...current])
        }
      })
  }

  const addGoal = (goal: Omit<Goal, 'id' | 'current' | 'color'>) => {
    if (!user) return

    void supabase
      .from('goals')
      .insert({
        user_id: user.id,
        name: goal.name,
        target_amount: goal.target,
        current_amount: 0,
        deadline: goal.deadline || null,
      })
      .select('id,name,target_amount,current_amount,deadline,color_light')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          return
        }

        setGoals((current) => [mapGoal(data as DbGoal), ...current])
      })
  }

  const updateGoal = (id: string, updates: Partial<Pick<Goal, 'name' | 'target' | 'deadline'>>) => {
    if (!user) return

    const currentGoal = goals.find((goal) => goal.id === id)
    if (!currentGoal) return

    const nextGoal = {
      ...currentGoal,
      ...updates,
    }

    setGoals((current) => current.map((goal) => (goal.id === id ? nextGoal : goal)))

    void supabase
      .from('goals')
      .update({
        name: updates.name,
        target_amount: updates.target,
        deadline: updates.deadline || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id,name,target_amount,current_amount,deadline,color_light')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setGoals((current) => current.map((goal) => (goal.id === id ? currentGoal : goal)))
          return
        }

        setGoals((current) => current.map((goal) => (goal.id === id ? mapGoal(data as DbGoal) : goal)))
      })
  }

  const adjustGoal = (id: string, amount: number) => {
    if (!user) return

    const currentGoal = goals.find((goal) => goal.id === id)
    if (!currentGoal) return

    const nextAmount = Math.max(0, currentGoal.current + amount)
    const movementAmount = Math.abs(nextAmount - currentGoal.current)
    if (movementAmount === 0) return

    setGoals((current) => current.map((goal) => (goal.id === id ? { ...goal, current: nextAmount } : goal)))

    const registerGoalMovement = async () => {
      const today = new Date().toISOString().split('T')[0]
      const transactionType = amount > 0 ? 'expense' : 'income'
      const category = categories.find((item) => item.name === 'Outros')
      const notes = amount > 0 ? `finleaf-goal-contribution:${currentGoal.name}` : `finleaf-goal-withdrawal:${currentGoal.name}`

      const { data: updatedGoal, error: goalError } = await supabase
        .from('goals')
        .update({
          current_amount: nextAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id,name,target_amount,current_amount,deadline,color_light')
        .single()

      if (goalError || !updatedGoal) {
        setGoals((current) => current.map((goal) => (goal.id === id ? currentGoal : goal)))
        return
      }

      setGoals((current) => current.map((goal) => (goal.id === id ? mapGoal(updatedGoal as DbGoal) : goal)))

      await supabase.from('goal_contributions').insert({
        goal_id: id,
        user_id: user.id,
        amount: amount > 0 ? movementAmount : -movementAmount,
        contribution_date: today,
        type: 'manual',
      })

      const { data, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          category_id: category?.id ?? null,
          amount: movementAmount,
          type: transactionType,
          transaction_date: today,
          notes,
        })
        .select('id,category_id,amount,description,notes,type,transaction_date,created_at,categories(id,name,icon_light,icon_dark,color_light,color_dark)')
        .single()

      if (!transactionError && data) {
        setTransactions((current) => [mapTransaction(data as unknown as DbTransaction), ...current])
      }
    }

    void registerGoalMovement()
  }

  const deleteGoal = (id: string) => {
    if (!user) return

    const deletedGoal = goals.find((goal) => goal.id === id)
    if (!deletedGoal) return

    setGoals((current) => current.filter((goal) => goal.id !== id))

    const removeGoal = async () => {
      await supabase.from('goal_contributions').delete().eq('goal_id', id).eq('user_id', user.id)

      const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id)

      if (error) {
        setGoals((current) => [deletedGoal, ...current])
      }
    }

    void removeGoal()
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

  const sortedTransactions = useMemo(
    () => [...transactions].sort(compareTransactionsNewestFirst),
    [transactions]
  )

  return (
    <FinanceContext.Provider
      value={{
        user,
        loading,
        currency,
        income,
        bonus,
        investmentBase,
        payday,
        transactions: sortedTransactions,
        goals,
        setCurrency,
        setIncome,
        setBonus,
        setInvestmentBase,
        setPayday,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addGoal,
        updateGoal,
        adjustGoal,
        deleteGoal,
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
