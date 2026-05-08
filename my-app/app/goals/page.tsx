'use client'

import { useMemo, useState, type FormEvent } from 'react'
import NavigationLayout from '@/components/NavigationLayout'
import { useFinance } from '@/components/FinanceProvider'

interface Goal {
  id: string
  name: string
  current: number
  target: number
  monthlyContribution: number
  deadline: string
  color: string
}

export default function Page() {
  const { goals, formatAmount, addGoal, adjustGoal } = useFinance()
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalTarget, setNewGoalTarget] = useState('')

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

  function submitNewGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newGoalName || !newGoalTarget) return
    addGoal({
      name: newGoalName,
      target: Number(newGoalTarget),
      monthlyContribution: 0,
      deadline: '2027-12-31',
    })
    setNewGoalName('')
    setNewGoalTarget('')
  }

  return (
    <NavigationLayout title="Goals" subtitle="Suas metas de economia">
      <div className="grid gap-6">
        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Meta ativa</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Adicione contribuições mensais ou retire quando precisar.</p>
            </div>
            <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              Progresso médio: {Math.round(totalProgress)}%
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {goals.map((goal) => {
              const progress = Math.min(100, (goal.current / goal.target) * 100)
              return (
                <div key={goal.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{goal.name}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Prazo: {goal.deadline}</p>
                    </div>
                    <p className="text-right text-sm text-slate-600 dark:text-slate-300">
                      {formatAmount(goal.current)} / {formatAmount(goal.target)}
                    </p>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className={`${goal.color} h-full`} style={{ width: `${progress}%` }} />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_0.8fr_0.8fr]">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Valor personalizado</label>
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
                      + Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleContribution(goal.id, -150)}
                      className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      - Retirar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Adicionar nova meta</p>
          <form className="mt-6 grid gap-4 sm:grid-cols-[1.4fr_0.8fr_0.8fr]" onSubmit={submitNewGoal}>
            <input
              value={newGoalName}
              onChange={(event) => setNewGoalName(event.target.value)}
              placeholder="Nome da meta"
              className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            />
            <input
              type="number"
              value={newGoalTarget}
              onChange={(event) => setNewGoalTarget(event.target.value)}
              placeholder="Valor alvo"
              className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            />
            <button className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">
              Criar meta
            </button>
          </form>
        </section>
      </div>
    </NavigationLayout>
  )
}
