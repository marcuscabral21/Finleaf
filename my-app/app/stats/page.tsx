'use client'

import { useMemo, useState } from 'react'
import NavigationLayout from '@/components/NavigationLayout'
import { getCategoryTranslationKey, useFinance, type Transaction } from '@/components/FinanceProvider'
import { useTranslation } from '@/components/useTranslation'

function getDateFromInput(dateString: string) {
  return new Date(`${dateString}T00:00:00`)
}

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getPaydayDate(year: number, month: number, requestedDay: number) {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(requestedDay, lastDayOfMonth))
}

function getCycleStartForDate(dateString: string, payday: string) {
  const date = getDateFromInput(dateString)
  const requestedDay = Math.min(Math.max(Number(payday) || 1, 1), 31)
  const currentMonthPayday = getPaydayDate(date.getFullYear(), date.getMonth(), requestedDay)
  const cycleStart = date >= currentMonthPayday ? currentMonthPayday : getPaydayDate(date.getFullYear(), date.getMonth() - 1, requestedDay)

  return formatDateInput(cycleStart)
}

function getNextCycleStart(startDate: string, payday: string) {
  const start = getDateFromInput(startDate)
  const requestedDay = Math.min(Math.max(Number(payday) || 1, 1), 31)

  return formatDateInput(getPaydayDate(start.getFullYear(), start.getMonth() + 1, requestedDay))
}

function getDaysBetween(startDate: string, endDate: string) {
  const start = getDateFromInput(startDate).getTime()
  const end = getDateFromInput(endDate).getTime()

  return Math.max(1, Math.round((end - start) / 86400000))
}

function getPeriodLabel(startDate: string, endDate: string) {
  return `${startDate} - ${endDate}`
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthOptions(locale: string) {
  const currentMonth = new Date()
  currentMonth.setDate(1)
  currentMonth.setHours(0, 0, 0, 0)

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(currentMonth)
    date.setMonth(currentMonth.getMonth() - index)

    return {
      key: getMonthKey(date),
      label: date.toLocaleDateString(locale, { month: 'short', year: 'numeric' }),
      start: formatDateInput(date),
    }
  })
}

function getMonthEnd(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return formatDateInput(new Date(year, month, 1))
}

export default function Page() {
  const { transactions, payday, formatAmount } = useFinance()
  const { t, translateNote, currentLanguage } = useTranslation()
  const monthOptions = useMemo(() => getMonthOptions(currentLanguage === 'pt' ? 'pt-PT' : 'en-US'), [currentLanguage])
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.key ?? '')
  const [selectedCycleKey, setSelectedCycleKey] = useState<string | null>(null)
  const retentionStart = monthOptions[monthOptions.length - 1]?.start ?? '0000-00-00'
  const selectedMonthStart = `${selectedMonth}-01`
  const selectedMonthEnd = getMonthEnd(selectedMonth)

  const payCycles = useMemo(() => {
    const expenses = transactions.filter((transaction) => transaction.type === 'expense' && transaction.date >= retentionStart)
    const cycleMap = expenses.reduce((groups, transaction) => {
      const start = getCycleStartForDate(transaction.date, payday)
      groups[start] = [...(groups[start] ?? []), transaction]
      return groups
    }, {} as Record<string, Transaction[]>)

    return Object.entries(cycleMap)
      .map(([start, cycleExpenses]) => {
        const end = getNextCycleStart(start, payday)
        return {
          key: start,
          start,
          end,
          label: getPeriodLabel(start, end),
          expenses: cycleExpenses.sort((first, second) => second.date.localeCompare(first.date)),
          total: cycleExpenses.reduce((sum, transaction) => sum + transaction.amount, 0),
        }
      })
      .sort((first, second) => second.start.localeCompare(first.start))
  }, [payday, retentionStart, transactions])

  const visiblePayCycles = useMemo(
    () => payCycles.filter((cycle) => cycle.start < selectedMonthEnd && cycle.end > selectedMonthStart),
    [payCycles, selectedMonthEnd, selectedMonthStart]
  )
  const selectedCycle = visiblePayCycles.find((cycle) => cycle.key === selectedCycleKey) ?? visiblePayCycles[0]
  const previousCycle = selectedCycle ? payCycles[payCycles.findIndex((cycle) => cycle.key === selectedCycle.key) + 1] : undefined
  const cycleDays = selectedCycle ? getDaysBetween(selectedCycle.start, selectedCycle.end) : 1
  const averagePerDay = selectedCycle ? selectedCycle.total / cycleDays : 0
  const comparisonValue = selectedCycle && previousCycle ? selectedCycle.total - previousCycle.total : 0
  const comparisonPercent = previousCycle && previousCycle.total > 0 ? Math.round((comparisonValue / previousCycle.total) * 100) : 0
  const comparisonKey = comparisonValue > 0 ? 'stats.moreThanPrevious' : comparisonValue < 0 ? 'stats.lessThanPrevious' : 'stats.sameAsPrevious'
  const dailyPace = selectedCycle ? selectedCycle.total / cycleDays : 0
  const economyEstimate = selectedCycle && previousCycle ? Math.max(0, previousCycle.total - selectedCycle.total) : 0

  const topGrowingCategory = useMemo(() => {
    if (!selectedCycle || !previousCycle) {
      return null
    }

    const currentTotals = selectedCycle.expenses.reduce((totals, transaction) => {
      totals[transaction.category] = (totals[transaction.category] ?? 0) + transaction.amount
      return totals
    }, {} as Record<string, number>)

    const previousTotals = previousCycle.expenses.reduce((totals, transaction) => {
      totals[transaction.category] = (totals[transaction.category] ?? 0) + transaction.amount
      return totals
    }, {} as Record<string, number>)

    return Object.entries(currentTotals)
      .map(([category, amount]) => ({ category, growth: amount - (previousTotals[category] ?? 0) }))
      .filter((item) => item.growth > 0)
      .sort((first, second) => second.growth - first.growth)[0] || null
  }, [previousCycle, selectedCycle])

  const categoryStats = useMemo(() => {
    if (!selectedCycle) {
      return []
    }

    const groups = selectedCycle.expenses.reduce((items, transaction) => {
      items[transaction.category] = (items[transaction.category] ?? 0) + transaction.amount
      return items
    }, {} as Record<string, number>)

    return Object.entries(groups)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: selectedCycle.total > 0 ? Math.round((amount / selectedCycle.total) * 100) : 0,
      }))
      .sort((first, second) => second.amount - first.amount)
  }, [selectedCycle])

  const topCategory = categoryStats[0]
  const annualStats = useMemo(() => {
    const selectedYear = selectedMonth.slice(0, 4)
    const yearlyExpenses = transactions.filter(
      (transaction) => transaction.type === 'expense' && transaction.date >= retentionStart && transaction.date.startsWith(selectedYear)
    )
    const monthlyTotals = monthOptions
      .filter((month) => month.key.startsWith(selectedYear))
      .map((month) => ({
        ...month,
        total: yearlyExpenses
          .filter((transaction) => transaction.date.startsWith(month.key))
          .reduce((sum, transaction) => sum + transaction.amount, 0),
      }))
      .reverse()
    const total = yearlyExpenses.reduce((sum, transaction) => sum + transaction.amount, 0)
    const activeMonths = monthlyTotals.filter((month) => month.total > 0).length
    const topMonth = monthlyTotals.reduce((best, month) => (month.total > best.total ? month : best), monthlyTotals[0] ?? { label: t('stats.noData'), total: 0 })
    const categoryTotals = yearlyExpenses.reduce((items, transaction) => {
      items[transaction.category] = (items[transaction.category] ?? 0) + transaction.amount
      return items
    }, {} as Record<string, number>)
    const topAnnualCategory = Object.entries(categoryTotals).sort((first, second) => second[1] - first[1])[0]

    return {
      year: selectedYear,
      total,
      monthlyAverage: activeMonths > 0 ? total / activeMonths : 0,
      topMonth,
      topAnnualCategory,
      monthlyTotals,
    }
  }, [monthOptions, retentionStart, selectedMonth, t, transactions])

  return (
    <NavigationLayout title={t('stats.title')} subtitle={t('stats.subtitle')}>
      <div className="grid gap-6">
        <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white/90 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px]">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/40 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{t('stats.payCycle')}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('stats.payCycleDesc')}</p>
              </div>
              <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {selectedCycle?.label ?? t('stats.noPeriod')}
              </span>
            </div>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-[0.95fr_1.45fr] sm:p-6">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <label className="grid gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 sm:col-span-2 lg:col-span-1">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t('stats.monthFilter')}</span>
                <select
                  value={selectedMonth}
                  onChange={(event) => {
                    setSelectedMonth(event.target.value)
                    setSelectedCycleKey(null)
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                >
                  {monthOptions.map((month) => (
                    <option key={month.key} value={month.key}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <span className="text-xs leading-5 text-slate-500 dark:text-slate-400">{t('stats.retentionDesc')}</span>
              </label>

              {visiblePayCycles.length > 0 ? (
                visiblePayCycles.map((cycle) => {
                  const isActive = selectedCycle?.key === cycle.key

                  return (
                    <button
                      key={cycle.key}
                      type="button"
                      onClick={() => setSelectedCycleKey(cycle.key)}
                      className={`rounded-3xl border p-4 text-left transition ${
                        isActive
                          ? 'border-emerald-300 bg-emerald-50 shadow-lg shadow-emerald-500/10 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                      }`}
                    >
                      <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{cycle.label}</span>
                      <span className="mt-3 block text-lg font-semibold text-slate-900 dark:text-slate-100">{formatAmount(cycle.total)}</span>
                      <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{cycle.expenses.length} {t('stats.expenseItems')}</span>
                    </button>
                  )
                })
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                  {t('stats.empty')}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('stats.totalSpent')}</p>
                <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatAmount(selectedCycle?.total ?? 0)}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('stats.dailyAverage')}</p>
                <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatAmount(averagePerDay)}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('stats.dailyPace')}</p>
                <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatAmount(dailyPace)}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('stats.categoryGrowthDesc')}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('stats.categoryGrowth')}</p>
                <p className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">{topGrowingCategory ? t(getCategoryTranslationKey(topGrowingCategory.category)) : t('stats.noData')}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{topGrowingCategory ? formatAmount(topGrowingCategory.growth) : t('stats.noData')}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('stats.economyEstimate')}</p>
                <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatAmount(economyEstimate)}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('stats.economyDesc')}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('stats.comparison')}</p>
                {previousCycle ? (
                  <>
                    <p className={`mt-4 text-2xl font-semibold ${comparisonValue > 0 ? 'text-rose-600' : comparisonValue < 0 ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'}`}>
                      {comparisonValue > 0 ? '+' : ''}{formatAmount(comparisonValue)}
                    </p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t(comparisonKey).replace('{percent}', Math.abs(comparisonPercent).toString())}</p>
                  </>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">{t('stats.noComparison')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
            <div className="mb-6">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{t('stats.byCategory')}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('stats.byCategoryDesc')}</p>
            </div>
            <div className="space-y-4">
              {categoryStats.length > 0 ? (
              categoryStats.map((item) => (
                <div key={item.category}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{t(getCategoryTranslationKey(item.category))}</span>
                    <span className="text-slate-500 dark:text-slate-400">{formatAmount(item.amount)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('stats.empty')}</p>
            )}
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{t('stats.allExpenses')}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{selectedCycle?.expenses.length ?? 0} {t('stats.expenseItems')}</p>
              </div>
              <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">{selectedCycle?.label ?? t('stats.noPeriod')}</span>
            </div>
            <div className="space-y-3">
              {selectedCycle?.expenses.map((transaction) => (
                <div key={transaction.id} className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{t(getCategoryTranslationKey(transaction.category))}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{transaction.date}</p>
                    {transaction.notes ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{translateNote(transaction.notes)}</p> : null}
                  </div>
                  <p className="text-lg font-semibold text-rose-600 sm:text-right">{formatAmount(transaction.amount)}</p>
                </div>
              ))}
              {!selectedCycle || selectedCycle.expenses.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">{t('stats.empty')}</p> : null}
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{t('stats.annual')}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('stats.annualDesc')}</p>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">{annualStats.year}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('stats.annualTotal')}</p>
              <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatAmount(annualStats.total)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('stats.monthlyAverage')}</p>
              <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatAmount(annualStats.monthlyAverage)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('stats.highestMonth')}</p>
              <p className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">{annualStats.topMonth?.label ?? t('stats.noData')}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('stats.topCategory')}</p>
              <p className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">{annualStats.topAnnualCategory ? t(getCategoryTranslationKey(annualStats.topAnnualCategory[0])) : t('stats.noData')}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {annualStats.monthlyTotals.map((month) => (
              <div key={month.key} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{month.label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatAmount(month.total)}</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${annualStats.total > 0 ? Math.round((month.total / annualStats.total) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NavigationLayout>
  )
}
