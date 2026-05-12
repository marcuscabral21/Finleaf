'use client'

import { useMemo, useState } from 'react'
import NavigationLayout from '@/components/NavigationLayout'
import { useFinance, CATEGORIES, getCategoryTranslationKey } from '@/components/FinanceProvider'
import { useTranslation } from '@/components/useTranslation'

const categories = [
  { key: 'house', labelKey: 'dashboard.category.house', color: 'bg-emerald-500', categoryNames: ['Contas'], descriptionKey: 'dashboard.category.houseDesc' },
  { key: 'shopping', labelKey: 'dashboard.category.shopping', color: 'bg-sky-500', categoryNames: ['Alimentacao', 'Outros'], descriptionKey: 'dashboard.category.shoppingDesc' },
  { key: 'transport', labelKey: 'dashboard.category.transport', color: 'bg-violet-500', categoryNames: ['Transporte'], descriptionKey: 'dashboard.category.transportDesc' },
  { key: 'leisure', labelKey: 'dashboard.category.leisure', color: 'bg-amber-500', categoryNames: ['Entretenimento'], descriptionKey: 'dashboard.category.leisureDesc' },
]

export default function Page() {
  const [activeCategory, setActiveCategory] = useState(categories[0].key)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense',
  })
  const { transactions, goals, formatAmount, addTransaction, updateTransaction, deleteTransaction } = useFinance()
  const { t, translateNote } = useTranslation()

  const totalIncome = useMemo(
    () => transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0),
    [transactions]
  )

  const totalExpenses = useMemo(
    () => transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0),
    [transactions]
  )

  const availableBalance = totalIncome - totalExpenses
  const savings = useMemo(() => goals.reduce((sum, goal) => sum + goal.current, 0), [goals])
  const investments = 0
  const dashboardCategories = useMemo(
    () =>
      categories.map((category) => {
        const amount = transactions
          .filter((transaction) => transaction.type === 'expense' && category.categoryNames.includes(transaction.category))
          .reduce((sum, transaction) => sum + transaction.amount, 0)

        return {
          ...category,
          amount,
          percent: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
        }
      }),
    [totalExpenses, transactions]
  )
  const selectedCategory = dashboardCategories.find((category) => category.key === activeCategory) ?? dashboardCategories[0]

  function openAddModal() {
    setEditingTransaction(null)
    setFormData({
      category: CATEGORIES[0].name,
      amount: '',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
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
      })
    } else {
      addTransaction({
        category: formData.category,
        amount: Number(formData.amount),
        date: formData.date,
        type: formData.type,
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
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('dashboard.available')}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100">{formatAmount(availableBalance)}</p>
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{t('dashboard.trendUpLastMonth')}</p>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('dashboard.spent')}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100">{formatAmount(totalExpenses)}</p>
            <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{t('dashboard.trendDownPreviousMonth')}</p>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('dashboard.savings')}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-100">{formatAmount(savings)}</p>
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{t('dashboard.savingsTrend')}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('dashboard.categories')}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('dashboard.categoriesDesc')}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <p className="font-semibold">{t(selectedCategory.labelKey)}</p>
                <p className="mt-1 text-3xl font-semibold">{formatAmount(selectedCategory.amount)}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t(selectedCategory.descriptionKey)}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {dashboardCategories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onMouseEnter={() => setActiveCategory(category.key)}
                  className={`rounded-3xl border px-4 py-5 text-left transition ${
                    activeCategory === category.key
                      ? 'border-emerald-500/40 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-500/10'
                      : 'border-slate-200 bg-white/95 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/80 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${category.color} text-white`} />
                  <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{t(category.labelKey)}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{formatAmount(category.amount)}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{category.percent}% do total</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('dashboard.summary')}</p>
            <dl className="mt-6 space-y-5 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/80">
                <span>{t('dashboard.income')}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatAmount(totalIncome)}</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/80">
                <span>{t('dashboard.expenses')}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatAmount(totalExpenses)}</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl bg-slate-50 p-4 dark:bg-slate-900/80">
                <span>{t('dashboard.investments')}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatAmount(investments)}</span>
              </div>
            </dl>
          </div>
        </div>

        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('dashboard.recentHistory')}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('dashboard.recentHistoryDesc')}</p>
            </div>
            <button type="button" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
              {t('dashboard.allExpenses')}
            </button>
          </div>

          <div className="space-y-4">
            {transactions.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-200 text-xl dark:bg-slate-800">{item.icon || '•'}</div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{t(getCategoryTranslationKey(item.category))}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.date}</p>
                    {item.notes ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{translateNote(item.notes)}</p> : null}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:w-72">
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item.type === 'expense' ? '-' : '+'} {formatAmount(item.amount)}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(item.id)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
            className="rounded-full bg-emerald-500 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-400"
          >
            {t('dashboard.addExpense')}
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
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
                    {CATEGORIES.map((category) => (
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
