'use client'

import { useMemo, useState } from 'react'
import NavigationLayout from '@/components/NavigationLayout'
import { useFinance, CATEGORIES, getCategoryTranslationKey } from '@/components/FinanceProvider'
import { useTranslation } from '@/components/useTranslation'

type FilterOption = 'day' | 'week' | 'month'

function getWeekKey(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`)
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + mondayOffset)
  return monday.toISOString().split('T')[0]
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
  const [selectedWeek, setSelectedWeek] = useState(getWeekKey(today))
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ category: '', amount: '', date: '' })
  const { transactions, formatAmount, updateTransaction, deleteTransaction } = useFinance()
  const { t, translateNote } = useTranslation()
  const transactionCategories = useMemo(
    () => (CATEGORIES.some((category) => category.name === 'Investimentos') ? CATEGORIES : [...CATEGORIES, { name: 'Investimentos', icon: 'INV' }]),
    []
  )

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (filter === 'day') return transaction.date === selectedDate
        if (filter === 'week') return getWeekKey(transaction.date) === selectedWeek
        return transaction.date.startsWith(selectedMonth)
      }),
    [filter, selectedDate, selectedMonth, selectedWeek, transactions]
  )

  function handleEditClick(transactionId: string) {
    const transaction = transactions.find((item) => item.id === transactionId)
    if (!transaction) return
    setEditingId(transactionId)
    setEditValues({ category: transaction.category, amount: transaction.amount.toString(), date: transaction.date })
  }

  function saveEdit() {
    if (!editingId) return
    updateTransaction(editingId, {
      category: editValues.category,
      amount: Number(editValues.amount) || 0,
      date: editValues.date,
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
        [`Mes: ${month}`],
        ['Categoria', 'Data', 'Valor', 'Tipo', 'Notas'],
        ...monthTransactions.map((transaction) => [
          t(getCategoryTranslationKey(transaction.category)),
          transaction.date,
          transaction.amount.toString(),
          transaction.type,
          translateNote(transaction.notes) ?? '',
        ]),
        [],
      ])

    const csvContent = csvSections.map((row) => row.map(escapeCsvValue).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'transacoes.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <NavigationLayout title={t('history.title')} subtitle={t('history.subtitle')}>
      <div className="grid gap-6">
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('history.filters')}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('history.filtersDesc')}</p>
            </div>
            <div className="inline-flex gap-2 rounded-3xl bg-slate-100 p-2 dark:bg-slate-900">
              {([
                ['day', t('history.day')],
                ['week', t('history.week')],
                ['month', t('history.month')]
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    filter === value
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 max-w-sm">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              {filter === 'day' ? t('history.chooseDay') : filter === 'week' ? t('history.chooseWeek') : t('history.chooseMonth')}
              <input
                type={filter === 'month' ? 'month' : 'date'}
                value={filter === 'day' ? selectedDate : filter === 'week' ? selectedWeek : selectedMonth}
                onChange={(event) => {
                  if (filter === 'day') {
                    setSelectedDate(event.target.value)
                  } else if (filter === 'week') {
                    setSelectedWeek(getWeekKey(event.target.value))
                  } else {
                    setSelectedMonth(event.target.value)
                  }
                }}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
              />
            </label>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('history.transactions')}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{filteredTransactions.length} {t('history.found')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {filter === 'day' ? selectedDate : filter === 'week' ? selectedWeek : selectedMonth}
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
              <div key={transaction.id} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[1fr_1fr_140px] sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t(getCategoryTranslationKey(transaction.category))}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{transaction.type.toUpperCase()}</p>
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
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-300">{transaction.date}</p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  {editingId === transaction.id ? (
                    <input
                      type="number"
                      value={editValues.amount}
                      onChange={(event) => setEditValues((prev) => ({ ...prev, amount: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  ) : (
                    <p className={`text-right text-lg font-semibold ${transaction.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {transaction.type === 'expense' ? '-' : '+'} {formatAmount(transaction.amount)}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {editingId === transaction.id ? (
                      <>
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400"
                        >
                          {t('history.save')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {t('history.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEditClick(transaction.id)}
                          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {t('history.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTransaction(transaction.id)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-900"
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
