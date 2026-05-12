'use client'

import { useMemo, useState, type FormEvent } from 'react'
import NavigationLayout from '@/components/NavigationLayout'
import { useFinance } from '@/components/FinanceProvider'
import { useTranslation } from '@/components/useTranslation'

export default function Page() {
  const { goals, formatAmount, addGoal, updateGoal, adjustGoal, deleteGoal } = useFinance()
  const { t } = useTranslation()
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editGoalValues, setEditGoalValues] = useState({ name: '', target: '', deadline: '' })
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalTarget, setNewGoalTarget] = useState('')
  const [newGoalDeadline, setNewGoalDeadline] = useState('')

  const totalProgress = useMemo(
    () => (goals.length ? goals.reduce((sum, goal) => sum + (goal.current / goal.target) * 100, 0) / goals.length : 0),
    [goals]
  )

  function updateCustomAmount(goalId: string, value: string) {
    setCustomAmounts((prev) => ({ ...prev, [goalId]: value }))
  }

  function handleContribution(id: string, change: number) {
    const parsedAmount = Number(customAmounts[id])
    const amount = Number.isFinite(parsedAmount) && parsedAmount !== 0 ? parsedAmount : change
    adjustGoal(id, amount)
    setCustomAmounts((prev) => ({ ...prev, [id]: '' }))
  }

  function startEditingGoal(goalId: string) {
    const goal = goals.find((item) => item.id === goalId)
    if (!goal) return

    setEditingGoalId(goalId)
    setEditGoalValues({
      name: goal.name,
      target: goal.target.toString(),
      deadline: goal.deadline,
    })
  }

  function saveGoalEdit() {
    if (!editingGoalId || !editGoalValues.name || !editGoalValues.target || !editGoalValues.deadline) return

    updateGoal(editingGoalId, {
      name: editGoalValues.name,
      target: Number(editGoalValues.target),
      deadline: editGoalValues.deadline,
    })
    setEditingGoalId(null)
  }

  function submitNewGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newGoalName || !newGoalTarget || !newGoalDeadline) return
    addGoal({
      name: newGoalName,
      target: Number(newGoalTarget),
      monthlyContribution: 0,
      deadline: newGoalDeadline,
    })
    setNewGoalName('')
    setNewGoalTarget('')
    setNewGoalDeadline('')
  }

  return (
    <NavigationLayout title={t('goals.title')} subtitle={t('goals.subtitle')}>
      <div className="grid gap-6">
        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('goals.active')}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('goals.activeDesc')}</p>
            </div>
            <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {t('goals.averageProgress')}: {Math.round(totalProgress)}%
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {goals.map((goal) => {
              const progress = Math.min(100, (goal.current / goal.target) * 100)
              const isEditing = editingGoalId === goal.id
              return (
                <div key={goal.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      {isEditing ? (
                        <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr_0.8fr]">
                          <input
                            value={editGoalValues.name}
                            onChange={(event) => setEditGoalValues((prev) => ({ ...prev, name: event.target.value }))}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                          <input
                            type="number"
                            value={editGoalValues.target}
                            onChange={(event) => setEditGoalValues((prev) => ({ ...prev, target: event.target.value }))}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                          <input
                            type="date"
                            value={editGoalValues.deadline}
                            onChange={(event) => setEditGoalValues((prev) => ({ ...prev, deadline: event.target.value }))}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{goal.name}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('goals.deadlineLabel')}: {goal.deadline}</p>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 sm:items-end">
                      <p className="text-right text-sm text-slate-600 dark:text-slate-300">
                        {formatAmount(goal.current)} / {formatAmount(goal.target)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={saveGoalEdit}
                              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400"
                            >
                              {t('goals.save')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingGoalId(null)}
                              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              {t('goals.cancel')}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditingGoal(goal.id)}
                              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              {t('goals.edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteGoal(goal.id)}
                              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-900"
                            >
                              {t('goals.remove')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className={`${goal.color} h-full`} style={{ width: `${progress}%` }} />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_0.8fr_0.8fr]">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('goals.customAmount')}</label>
                      <input
                        type="number"
                        value={customAmounts[goal.id] ?? ''}
                        onChange={(event) => updateCustomAmount(goal.id, event.target.value)}
                        placeholder="R$ 0,00"
                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleContribution(goal.id, 150)}
                      className="rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
                    >
                      {t('goals.addFunds')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleContribution(goal.id, -150)}
                      className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {t('goals.withdrawFunds')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('goals.add')}</p>
          <form className="mt-6 grid gap-4 sm:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]" onSubmit={submitNewGoal}>
            <input
              value={newGoalName}
              onChange={(event) => setNewGoalName(event.target.value)}
              placeholder={t('goals.name')}
              className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            />
            <input
              type="number"
              value={newGoalTarget}
              onChange={(event) => setNewGoalTarget(event.target.value)}
              placeholder={t('goals.target')}
              className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            />
            <input
              type="date"
              value={newGoalDeadline}
              onChange={(event) => setNewGoalDeadline(event.target.value)}
              className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            />
            <button className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">
              {t('goals.createGoal')}
            </button>
          </form>
        </section>
      </div>
    </NavigationLayout>
  )
}
