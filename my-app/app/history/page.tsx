'use client'

import { useMemo, useState } from 'react'
import NavigationLayout from '@/components/NavigationLayout'
import TransactionRow from '@/components/TransactionRow'
import { useFinance, CATEGORIES, getCategoryTranslationKey } from '@/components/FinanceProvider'
import { useTranslation } from '@/components/useTranslation'

type FilterOption = 'day' | 'week' | 'month' | 'all'

function getDateFromInput(dateString: string) {
  return new Date(`${dateString}T00:00:00`)
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function addDays(dateString: string, days: number) {
  const date = getDateFromInput(dateString)
  date.setDate(date.getDate() + days)

  return getDateInputValue(date)
}

function getWeekStart(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`)
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + mondayOffset)

  return getDateInputValue(monday)
}

function getWeekLabel(startDate: string) {
  return `${startDate} - ${addDays(startDate, 6)}`
}

function escapeCsvValue(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

export default function Page() {
  const today = new Date().toISOString().split('T')[0]
  const [filter, setFilter] = useState<FilterOption>('week')
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedWeekStart, setSelectedWeekStart] = useState(getWeekStart(today))
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7))
  const [showArchived, setShowArchived] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ category: '', amount: '', date: '', notes: '' })
  const [exportPeriod, setExportPeriod] = useState<'month' | 'year'>('month')
  const [exportDate, setExportDate] = useState(today.slice(0, 7))
  const { transactions, archivedTransactions, formatAmount, updateTransaction, deleteTransaction, restoreArchivedTransaction } = useFinance()
  const { t, translateNote } = useTranslation()
  const transactionCategories = CATEGORIES
  const visibleTransactions = showArchived ? archivedTransactions : transactions
  const selectedWeekEnd = addDays(selectedWeekStart, 6)
  const selectedPeriod = filter === 'day' ? selectedDate : filter === 'week' ? getWeekLabel(selectedWeekStart) : filter === 'month' ? selectedMonth : t('history.allPeriod')
  const filterOptions = [
    { value: 'day', label: t('history.day'), marker: '01', sample: selectedDate },
    { value: 'week', label: t('history.week'), marker: '7D', sample: getWeekLabel(selectedWeekStart) },
    { value: 'month', label: t('history.month'), marker: '30', sample: selectedMonth },
    { value: 'all', label: t('history.all'), marker: 'ALL', sample: t('history.allPeriod') },
  ] as const

  const filteredTransactions = useMemo(
    () =>
        visibleTransactions.filter((transaction) => {
        if (filter === 'day') return transaction.date === selectedDate
        if (filter === 'week') return transaction.date >= selectedWeekStart && transaction.date <= selectedWeekEnd
        if (filter === 'month') return transaction.date.startsWith(selectedMonth)
        return true
      }),
    [filter, selectedDate, selectedMonth, selectedWeekEnd, selectedWeekStart, visibleTransactions]
  )

  const exportPeriodLabel = exportPeriod === 'month' ? exportDate : `${exportDate.slice(0, 4)}`
  const exportTransactions = useMemo(
    () =>
      filteredTransactions.filter((transaction) =>
        exportPeriod === 'month'
          ? transaction.date.startsWith(exportDate)
          : transaction.date.startsWith(exportDate.slice(0, 4))
      ),
    [exportDate, exportPeriod, filteredTransactions]
  )

  function handleEditClick(transactionId: string) {
    const transaction = transactions.find((item) => item.id === transactionId)
    if (!transaction) return
    setEditingId(transactionId)
    setEditValues({ category: transaction.category, amount: transaction.amount.toString(), date: transaction.date, notes: transaction.notes ?? '' })
  }

  function saveEdit() {
    if (!editingId) return
    updateTransaction(editingId, {
      category: editValues.category,
      amount: Number(editValues.amount) || 0,
      date: editValues.date,
      notes: editValues.notes.trim() || undefined,
    })
    setEditingId(null)
  }

  function downloadCsv() {
    const transactionsByMonth = exportTransactions.reduce((groups, transaction) => {
      const monthKey = transaction.date.slice(0, 7)
      groups[monthKey] = [...(groups[monthKey] ?? []), transaction]
      return groups
    }, {} as Record<string, typeof exportTransactions>)

    const totalIncome = exportTransactions.filter((transaction) => transaction.type === 'income').reduce((sum, transaction) => sum + transaction.amount, 0)
    const totalExpense = exportTransactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0)
    const csvSections = [
      [t('history.csvSummary')],
      [t('history.csvPeriod'), `${t('history.exportBy')}: ${exportPeriod === 'month' ? t('history.exportMonth') : t('history.exportYear')} ${exportPeriodLabel}`],
      [t('history.csvIncome'), totalIncome.toString()],
      [t('history.csvExpense'), totalExpense.toString()],
      [],
      ...Object.entries(transactionsByMonth)
      .sort(([firstMonth], [secondMonth]) => secondMonth.localeCompare(firstMonth))
      .flatMap(([month, monthTransactions]) => [
        [`${t('history.csvMonth')}: ${month}`],
        [t('history.csvCategory'), t('history.csvDate'), t('history.csvAmount'), t('history.csvType'), t('history.csvNotes')],
        ...monthTransactions.map((transaction) => [
          t(getCategoryTranslationKey(transaction.category)),
          transaction.date,
          transaction.amount.toString(),
          t(transaction.type === 'expense' ? 'history.csvExpense' : 'history.csvIncome'),
          translateNote(transaction.notes) ?? '',
        ]),
        [],
      ]),
    ]

    const csvContent = csvSections.map((row) => row.map(escapeCsvValue).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', t('history.csvFilename'))
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <NavigationLayout title={t('history.title')} subtitle={t('history.subtitle')}>
      <div className="grid gap-6">
        <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white/90 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px]">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/40 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{t('history.filters')}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('history.filtersDesc')}</p>
              </div>
              <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {selectedPeriod}
              </span>
            </div>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-[1.35fr_0.85fr] sm:p-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {filterOptions.map((option) => {
                const isActive = filter === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilter(option.value)}
                    className={`group rounded-3xl border p-3 text-left transition sm:p-4 ${
                      isActive
                        ? 'border-emerald-300 bg-emerald-50 shadow-lg shadow-emerald-500/10 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-bold ${
                        isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:group-hover:bg-slate-800'
                      }`}
                    >
                      {option.marker}
                    </span>
                    <span className="mt-3 block text-xs font-semibold text-slate-900 dark:text-slate-100 sm:mt-4 sm:text-sm">{option.label}</span>
                    <span className="mt-1 hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">{option.sample}</span>
                  </button>
                )
              })}
            </div>

            {filter === 'all' ? (
              <div className="flex min-h-full flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
                <span>{t('history.chooseAll')}</span>
                <span className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                  {t('history.allPeriod')}
                </span>
              </div>
            ) : (
              <div className="flex min-h-full flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
                <span>{filter === 'day' ? t('history.chooseDay') : filter === 'week' ? t('history.chooseWeek') : t('history.chooseMonth')}</span>
                {filter === 'week' ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t('history.weekStart')}</span>
                      <input
                        type="date"
                        value={selectedWeekStart}
                        onChange={(event) => setSelectedWeekStart(event.target.value)}
                        className="date-picker-input w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                      />
                    </label>
                    <div className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t('history.weekEnd')}</span>
                      <span className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                        {selectedWeekEnd}
                      </span>
                    </div>
                  </div>
                ) : (
                  <input
                    type={filter === 'month' ? 'month' : 'date'}
                    value={filter === 'day' ? selectedDate : selectedMonth}
                    onChange={(event) => {
                      if (filter === 'day') {
                        setSelectedDate(event.target.value)
                      } else {
                        setSelectedMonth(event.target.value)
                      }
                    }}
                    className="date-picker-input mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{t('history.transactions')}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{filteredTransactions.length} {t('history.found')}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto] items-center">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid gap-2 rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t('history.exportBy')}</span>
                  <select
                    value={exportPeriod}
                    onChange={(event) => setExportPeriod(event.target.value as 'month' | 'year')}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="month">{t('history.exportMonth')}</option>
                    <option value="year">{t('history.exportYear')}</option>
                  </select>
                </label>
                <label className="grid gap-2 rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{exportPeriod === 'month' ? t('history.month') : t('history.year')}</span>
                  <input
                    type={exportPeriod === 'month' ? 'month' : 'number'}
                    value={exportDate}
                    min={exportPeriod === 'year' ? '2000' : undefined}
                    max={exportPeriod === 'year' ? new Date().getFullYear().toString() : undefined}
                    onChange={(event) => setExportDate(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowArchived((current) => !current)
                  setEditingId(null)
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  showArchived
                    ? 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900'
                }`}
              >
                {showArchived ? t('history.active') : t('history.archived')}
              </button>
              <button
                type="button"
                onClick={downloadCsv}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {t('history.export')}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('history.noTransactions')}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{showArchived ? t('history.noArchived') : t('history.noTransactionsDesc')}</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                transactionCategories={transactionCategories}
                showArchived={showArchived}
                isEditing={editingId === transaction.id}
                editValues={editValues}
                setEditValues={setEditValues}
                formatAmount={formatAmount}
                onEdit={() => handleEditClick(transaction.id)}
                onSave={saveEdit}
                onCancel={() => setEditingId(null)}
                onDelete={() => deleteTransaction(transaction.id)}
                onRestore={() => restoreArchivedTransaction(transaction.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </NavigationLayout>
  )
}
