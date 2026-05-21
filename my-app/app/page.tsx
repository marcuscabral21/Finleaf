'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import NavigationLayout from '@/components/NavigationLayout'
import { useFinance, CATEGORIES, getCategoryTranslationKey } from '@/components/FinanceProvider'
import { useTranslation } from '@/components/useTranslation'

const categories = [
  { key: 'house', labelKey: 'dashboard.category.house', color: 'bg-emerald-500', strokeColor: '#10b981', categoryNames: ['Contas'], descriptionKey: 'dashboard.category.houseDesc' },
  { key: 'shopping', labelKey: 'dashboard.category.shopping', color: 'bg-sky-500', strokeColor: '#0ea5e9', categoryNames: ['Alimentacao', 'Outros'], descriptionKey: 'dashboard.category.shoppingDesc' },
  { key: 'transport', labelKey: 'dashboard.category.transport', color: 'bg-violet-500', strokeColor: '#8b5cf6', categoryNames: ['Transporte'], descriptionKey: 'dashboard.category.transportDesc' },
  { key: 'leisure', labelKey: 'dashboard.category.leisure', color: 'bg-amber-500', strokeColor: '#f59e0b', categoryNames: ['Entretenimento'], descriptionKey: 'dashboard.category.leisureDesc' },
]

function getPayCycleBounds(payday: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const requestedDay = Math.min(Math.max(Number(payday) || 1, 1), 31)
  const currentMonthPayday = getPaydayDate(today.getFullYear(), today.getMonth(), requestedDay)
  const cycleStart = today >= currentMonthPayday ? currentMonthPayday : getPaydayDate(today.getFullYear(), today.getMonth() - 1, requestedDay)
  const nextCycleStart = getPaydayDate(cycleStart.getFullYear(), cycleStart.getMonth() + 1, requestedDay)

  return {
    cycleStart: formatLocalDate(cycleStart),
    nextCycleStart: formatLocalDate(nextCycleStart),
  }
}

function getPaydayDate(year: number, month: number, requestedDay: number) {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(requestedDay, lastDayOfMonth))
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function Page() {
  const [activeCategory, setActiveCategory] = useState(categories[0].key)
  const [isAvailableChartHovered, setIsAvailableChartHovered] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense',
    notes: '',
  })
  const { transactions, goals, payday, formatAmount, addTransaction, updateTransaction, deleteTransaction } = useFinance()
  const { t, translateNote } = useTranslation()
  const transactionCategories = CATEGORIES
  const payCycleBounds = useMemo(() => getPayCycleBounds(payday), [payday])
  const cycleTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) => transaction.date >= payCycleBounds.cycleStart && transaction.date < payCycleBounds.nextCycleStart
      ),
    [payCycleBounds, transactions]
  )

  const totalIncome = useMemo(
    () => cycleTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0),
    [cycleTransactions]
  )

  const totalExpenses = useMemo(
    () => cycleTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0),
    [cycleTransactions]
  )

  const availableBalance = totalIncome - totalExpenses
  const savings = useMemo(() => goals.reduce((sum, goal) => sum + goal.current, 0), [goals])
  const investments = useMemo(
    () =>
      transactions
        .filter((item) => item.date >= payCycleBounds.cycleStart && item.date < payCycleBounds.nextCycleStart)
        .filter((item) => item.category === 'Investimentos')
        .reduce((sum, item) => sum + (item.type === 'expense' ? item.amount : -item.amount), 0),
    [payCycleBounds, transactions]
  )
  const dashboardCategories = useMemo(
    () =>
      categories.map((category) => {
        const breakdown = category.categoryNames.map((categoryName) => {
          const amount = cycleTransactions
            .filter((transaction) => transaction.type === 'expense' && transaction.category === categoryName)
            .reduce((sum, transaction) => sum + transaction.amount, 0)

          return {
            name: categoryName,
            amount,
            percent: 0,
          }
        })
        const amount = breakdown.reduce((sum, item) => sum + item.amount, 0)

        return {
          ...category,
          amount,
          percent: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
          breakdown: breakdown.map((item) => ({
            ...item,
            percent: amount > 0 ? Math.round((item.amount / amount) * 100) : 0,
          })),
        }
      }),
    [cycleTransactions, totalExpenses]
  )
  const selectedCategory = dashboardCategories.find((category) => category.key === activeCategory) ?? dashboardCategories[0]
  const recentTransactions = transactions.slice(0, 6)
  const isShowingAvailableDetail = isAvailableChartHovered && availableBalance > 0
  const availableChartAmount = Math.max(availableBalance, 0)
  const categoryChartSegments = useMemo(() => {
    const chartTotal = dashboardCategories.reduce((sum, category) => sum + category.amount, 0) + availableChartAmount

    return dashboardCategories.map((category, index) => {
      const chartPercent = chartTotal > 0 ? (category.amount / chartTotal) * 100 : 0
      const chartOffset = dashboardCategories
        .slice(0, index)
        .reduce((sum, previousCategory) => sum + (chartTotal > 0 ? (previousCategory.amount / chartTotal) * 100 : 0), 0)

      return {
        ...category,
        chartPercent,
        chartOffset,
      }
    })
  }, [availableChartAmount, dashboardCategories])
  const availableChartSegment = useMemo(() => {
    const chartTotal = dashboardCategories.reduce((sum, category) => sum + category.amount, 0) + availableChartAmount
    const chartPercent = chartTotal > 0 ? (availableChartAmount / chartTotal) * 100 : 0
    const chartOffset = categoryChartSegments.reduce((sum, category) => sum + category.chartPercent, 0)

    return {
      chartPercent,
      chartOffset,
    }
  }, [availableChartAmount, categoryChartSegments, dashboardCategories])

  function openAddModal() {
    setEditingTransaction(null)
    setFormData({
      category: transactionCategories[0].name,
      amount: '',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      notes: '',
    })
    setIsModalOpen(true)
  }

  function openEditModal(transactionId: string) {
    const transaction = transactions.find((t) => t.id === transactionId)
    if (!transaction) return
    setEditingTransaction(transactionId)
    setFormData({
      category: transaction.category,
      amount: transaction.amount.toString(),
      date: transaction.date,
      type: transaction.type,
      notes: transaction.notes ?? '',
    })
    setIsModalOpen(true)
  }

  function handleSave() {
    if (!formData.category || !formData.amount) return
    if (editingTransaction) {
      updateTransaction(editingTransaction, {
        category: formData.category,
        amount: Number(formData.amount),
        date: formData.date,
        type: formData.type,
        notes: formData.notes.trim() || undefined,
      })
    } else {
      addTransaction({
        category: formData.category,
        amount: Number(formData.amount),
        date: formData.date,
        type: formData.type,
        notes: formData.notes.trim() || undefined,
      })
    }
    setIsModalOpen(false)
  }

  function handleDelete(transactionId: string) {
    deleteTransaction(transactionId)
  }

  return (
    <NavigationLayout title={t('dashboard.title')} subtitle={t('dashboard.subtitle')}>
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
          <div className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{t('dashboard.available')}</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">{formatAmount(availableBalance)}</p>
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{t('dashboard.trendUpLastMonth')}</p>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{t('dashboard.spent')}</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">{formatAmount(totalExpenses)}</p>
            <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{t('dashboard.trendDownPreviousMonth')}</p>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{t('dashboard.savings')}</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">{formatAmount(savings)}</p>
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{t('dashboard.savingsTrend')}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
          <div className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
            <div className="flex flex-col gap-6 lg:min-h-[184px] lg:flex-row lg:items-start lg:justify-between">
              <div className="hidden flex-1 items-end lg:flex">
                <svg className="h-28 w-full max-w-sm overflow-visible" viewBox="0 0 240 126" role="img" aria-label={t('dashboard.categories')}>
                  <path
                    d="M 22 112 A 98 98 0 0 1 218 112"
                    fill="none"
                    pathLength="100"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  {categoryChartSegments.map((category) =>
                    category.chartPercent > 0 ? (
                      <path
                        key={category.key}
                        d="M 22 112 A 98 98 0 0 1 218 112"
                        fill="none"
                        pathLength="100"
                        stroke={category.strokeColor}
                        strokeDasharray={`${category.chartPercent} ${100 - category.chartPercent}`}
                        strokeDashoffset={-category.chartOffset}
                        strokeLinecap="butt"
                        strokeWidth="12"
                        className="cursor-pointer transition-all"
                        opacity={activeCategory === category.key ? 1 : 0.72}
                        onMouseEnter={() => setActiveCategory(category.key)}
                        onFocus={() => setActiveCategory(category.key)}
                        onClick={() => setActiveCategory(category.key)}
                      />
                    ) : null
                  )}
                  {availableChartSegment.chartPercent > 0 ? (
                    <>
                      <path
                        d="M 22 112 A 98 98 0 0 1 218 112"
                        fill="none"
                        pathLength="100"
                        stroke="currentColor"
                        strokeDasharray={`${availableChartSegment.chartPercent} ${100 - availableChartSegment.chartPercent}`}
                        strokeDashoffset={-availableChartSegment.chartOffset}
                        strokeLinecap="butt"
                        strokeWidth="12"
                        className="text-slate-950 transition-all dark:text-white"
                      />
                      <path
                        d="M 22 112 A 98 98 0 0 1 218 112"
                        fill="none"
                        pathLength="100"
                        stroke="transparent"
                        strokeDasharray={`${availableChartSegment.chartPercent} ${100 - availableChartSegment.chartPercent}`}
                        strokeDashoffset={-availableChartSegment.chartOffset}
                        strokeLinecap="butt"
                        strokeWidth="28"
                        className="cursor-pointer"
                        onMouseEnter={() => setIsAvailableChartHovered(true)}
                        onMouseLeave={() => setIsAvailableChartHovered(false)}
                        onFocus={() => setIsAvailableChartHovered(true)}
                        onBlur={() => setIsAvailableChartHovered(false)}
                      />
                    </>
                  ) : null}
                </svg>
              </div>
              <div className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 lg:min-h-[184px] lg:max-w-xs">
                {isShowingAvailableDetail ? (
                  <>
                    <p className="font-semibold">{t('dashboard.available')}</p>
                    <p className="mt-1 text-2xl font-semibold sm:text-3xl">{formatAmount(availableBalance)}</p>
                    <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.available')}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">{t(selectedCategory.labelKey)}</p>
                    <p className="mt-1 text-2xl font-semibold sm:text-3xl">{formatAmount(selectedCategory.amount)}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(selectedCategory.descriptionKey)}</p>
                    <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                      {selectedCategory.breakdown.map((item) => (
                        <div key={item.name} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                          <span className="min-w-0 truncate text-slate-500 dark:text-slate-400">{t(getCategoryTranslationKey(item.name))}</span>
                          <span className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
                            {formatAmount(item.amount)}
                            <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">({item.percent}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 lg:grid-cols-4">
              {dashboardCategories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onMouseEnter={() => setActiveCategory(category.key)}
                  onFocus={() => setActiveCategory(category.key)}
                  onClick={() => setActiveCategory(category.key)}
                  className={`rounded-3xl border px-4 py-4 text-left transition sm:py-5 ${
                    activeCategory === category.key
                      ? 'border-emerald-500/40 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-500/10'
                      : 'border-slate-200 bg-white/95 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/80 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${category.color} text-white`} />
                  <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{t(category.labelKey)}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">{formatAmount(category.amount)}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{category.percent}% {t('dashboard.ofTotal')}</p>
                  {activeCategory === category.key ? (
                    <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800 lg:hidden">
                      {category.breakdown.map((item) => (
                        <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                          <span className="min-w-0 truncate text-slate-500 dark:text-slate-400">{t(getCategoryTranslationKey(item.name))}</span>
                          <span className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
                            {formatAmount(item.amount)}
                            <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">({item.percent}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{t('dashboard.summary')}</p>
            <dl className="mt-6 space-y-5 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between gap-3 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/80">
                <span>{t('dashboard.income')}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatAmount(totalIncome)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/80">
                <span>{t('dashboard.expenses')}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatAmount(totalExpenses)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/80">
                <span>{t('dashboard.investments')}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatAmount(investments)}</span>
              </div>
            </dl>
          </div>
        </div>

        <section className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{t('dashboard.recentHistory')}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('dashboard.recentHistoryDesc')}</p>
            </div>
            <Link href="/history" className="w-full rounded-full bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto sm:py-2">
              {t('dashboard.allExpenses')}
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            {recentTransactions.map((item, index) => (
              <div
                key={item.id}
                className={`flex-col gap-4 border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
                  index >= 4 ? 'hidden sm:flex' : 'flex'
                } ${index < recentTransactions.length - 1 ? 'border-b' : ''}`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm dark:bg-slate-950">{item.icon || '•'}</div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{t(getCategoryTranslationKey(item.category))}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                      <span>{item.date}</span>
                      <span className={item.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {t(item.type === 'expense' ? 'history.csvExpense' : 'history.csvIncome')}
                      </span>
                    </div>
                    {item.notes ? <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{translateNote(item.notes)}</p> : null}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:w-72">
                  <p className={`shrink-0 text-lg font-semibold ${item.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {item.type === 'expense' ? '-' : '+'} {formatAmount(item.amount)}
                  </p>
                  <div className="grid shrink-0 grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(item.id)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {t('history.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
                    >
                      {t('goals.remove')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={openAddModal}
            className="w-full rounded-full bg-emerald-500 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-400 sm:w-auto"
          >
            {t('dashboard.addExpense')}
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
            <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-950 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {editingTransaction ? t('modal.edit') : t('modal.add')}
              </h3>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('modal.category')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="mt-1 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                  >
                    <option value="">{t('dashboard.selectCategory')}</option>
                    {transactionCategories.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.icon} {t(getCategoryTranslationKey(category.name))}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('modal.amount')}</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    className="mt-1 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('modal.date')}</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="mt-1 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('modal.type')}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                    className="mt-1 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                  >
                    <option value="expense">{t('modal.expense')}</option>
                    <option value="income">{t('modal.income')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('modal.comment')}</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 min-h-24 w-full resize-none rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                    placeholder={t('modal.commentPlaceholder')}
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t('modal.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
                >
                  {t('modal.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NavigationLayout>
  )
}
