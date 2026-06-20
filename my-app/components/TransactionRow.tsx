import type { Dispatch, SetStateAction } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { getCategoryTranslationKey, type Transaction } from '@/components/FinanceProvider'
import { useTranslation } from '@/components/useTranslation'

type CategoryOption = {
  name: string
  icon: string
}

interface TransactionRowProps {
  transaction: Transaction
  transactionCategories: CategoryOption[]
  showArchived: boolean
  isEditing: boolean
  editValues: { category: string; amount: string; date: string; type: 'income' | 'expense'; notes: string }
  setEditValues: Dispatch<SetStateAction<{ category: string; amount: string; date: string; type: 'income' | 'expense'; notes: string }>>
  formatAmount: (value: number) => string
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  onRestore: () => void
}

export default function TransactionRow({
  transaction,
  transactionCategories,
  showArchived,
  isEditing,
  editValues,
  setEditValues,
  formatAmount,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onRestore,
}: TransactionRowProps) {
  const { t, translateNote } = useTranslation()

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          {transaction.type === 'expense' ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
          {t(transaction.type === 'expense' ? 'history.csvExpense' : 'history.csvIncome')}
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t(getCategoryTranslationKey(transaction.category))}</p>
        {transaction.notes ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{translateNote(transaction.notes)}</p> : null}
      </div>

      <div>
        {isEditing && !showArchived ? (
          <div className="grid gap-3">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t('modal.category')}</label>
              <select
                value={editValues.category}
                onChange={(event) => setEditValues((prev) => ({ ...prev, category: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {transactionCategories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.icon} {t(getCategoryTranslationKey(category.name))}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t('modal.type')}</label>
              <select
                value={editValues.type}
                onChange={(event) => setEditValues((prev) => ({ ...prev, type: event.target.value as 'income' | 'expense' }))}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="expense">{t('modal.expense')}</option>
                <option value="income">{t('modal.income')}</option>
              </select>
            </div>
            <input
              type="date"
              value={editValues.date}
              onChange={(event) => setEditValues((prev) => ({ ...prev, date: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <input
              type="number"
              value={editValues.amount}
              onChange={(event) => setEditValues((prev) => ({ ...prev, amount: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="0.00"
            />
            <textarea
              value={editValues.notes}
              onChange={(event) => setEditValues((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder={t('modal.commentPlaceholder')}
              className="min-h-20 resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onSave}
                className="min-w-0 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400"
              >
                {t('history.save')}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="min-w-0 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t('history.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:items-end">
            <p className={`text-lg font-semibold ${transaction.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>{transaction.type === 'expense' ? '- ' : '+ '}{formatAmount(transaction.amount)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{transaction.date}</p>
            <div className="flex flex-wrap gap-2">
              {showArchived ? (
                <button
                  type="button"
                  onClick={onRestore}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
                >
                  {t('history.restore')}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {t('history.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-900"
                  >
                    {t('history.delete')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
