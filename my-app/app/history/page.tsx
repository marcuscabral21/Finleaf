'use client'

import { useMemo, useState } from 'react'
import NavigationLayout from '@/components/NavigationLayout'
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ category: '', amount: '', date: '', notes: '' })
  const { transactions, formatAmount, updateTransaction, deleteTransaction } = useFinance()
  const { t, translateNote } = useTranslation()
  const transactionCategories = CATEGORIES
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
      transactions.filter((transaction) => {
        if (filter === 'day') return transaction.date === selectedDate
        if (filter === 'week') return transaction.date >= selectedWeekStart && transaction.date <= selectedWeekEnd
        if (filter === 'month') return transaction.date.startsWith(selectedMonth)
        return true
      }),
    [filter, selectedDate, selectedMonth, selectedWeekEnd, selectedWeekStart, transactions]
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
    const transactionsByMonth = filteredTransactions.reduce((groups, transaction) => {
      const monthKey = transaction.date.slice(0, 7)
      groups[monthKey] = [...(groups[monthKey] ?? []), transaction]
      return groups
    }, {} as Record<string, typeof filteredTransactions>)

    const csvSections = Object.entries(transactionsByMonth)
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
      ])

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
            <div className="grid grid-cols-[1fr_auto] items-center gap-2 sm:flex">
              <span className="truncate rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {selectedPeriod}
              </span>
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
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(190px,auto)] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t(getCategoryTranslationKey(transaction.category))}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t(transaction.type === 'expense' ? 'history.csvExpense' : 'history.csvIncome')}</p>
                  {transaction.notes ? <p className="mt-2 text-xs normal-case tracking-normal text-slate-500 dark:text-slate-400">{translateNote(transaction.notes)}</p> : null}
                </div>
                <div>
                  {editingId === transaction.id ? (
                    <div className="flex flex-col gap-2">
                      <select
                        value={editValues.category}
                        onChange={(event) => setEditValues((prev) => ({ ...prev, category: event.target.value }))}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        {transactionCategories.map((category) => (
                          <option key={category.name} value={category.name}>
                            {category.icon} {t(getCategoryTranslationKey(category.name))}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={editValues.date}
                        onChange={(event) => setEditValues((prev) => ({ ...prev, date: event.target.value }))}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                      <textarea
                        value={editValues.notes}
                        onChange={(event) => setEditValues((prev) => ({ ...prev, notes: event.target.value }))}
                        placeholder={t('modal.commentPlaceholder')}
                        className="min-h-20 resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-300">{transaction.date}</p>
                  )}
                </div>
                <div className="flex flex-col gap-3 md:items-end">
                  {editingId === transaction.id ? (
                    <input
                      type="number"
                      value={editValues.amount}
                      onChange={(event) => setEditValues((prev) => ({ ...prev, amount: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  ) : (
                    <p className={`text-lg font-semibold md:text-right ${transaction.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {transaction.type === 'expense' ? '-' : '+'} {formatAmount(transaction.amount)}
                    </p>
                  )}
                  <div className="grid w-full grid-cols-2 gap-2 md:w-auto">
                    {editingId === transaction.id ? (
                      <>
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="min-w-20 whitespace-nowrap rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400"
                        >
                          {t('history.save')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="min-w-20 whitespace-nowrap rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {t('history.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEditClick(transaction.id)}
                          className="min-w-20 whitespace-nowrap rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {t('history.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTransaction(transaction.id)}
                          className="min-w-20 whitespace-nowrap rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-900"
                        >
                          {t('history.delete')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NavigationLayout>
  )
}
