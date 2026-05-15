'use client'

import { useEffect, useState } from 'react'

import NavigationLayout from '@/components/NavigationLayout'
import { useFinance } from '@/components/FinanceProvider'
import { useLanguage } from '@/components/LanguageProvider'
import StatusToast, { type StatusVariant } from '@/components/StatusToast'
import { useTranslation } from '@/components/useTranslation'
import { supabase } from '@/lib/supabaseclient'
import { PASSWORD_REQUIREMENTS, getPasswordStrengthError } from '@/lib/password'

type Language = 'pt' | 'en' | 'auto'

type StatusNotice = {
  message: string
  variant: StatusVariant
}

function removeNumbers(value: string) {
  return value.replace(/\d/g, '')
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg className="h-5 w-5 overflow-visible" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.5 7.8C5.4 8.8 3.7 10.4 2.5 12c2.2 3 5.3 5 9.5 5 1.4 0 2.7-.2 3.8-.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M13.9 7.2c3.3.5 5.8 2.4 7.6 4.8-.8 1.1-1.8 2.1-2.9 2.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg className="h-5 w-5 overflow-visible" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12c2.2-3 5.3-5 9.5-5s7.3 2 9.5 5c-2.2 3-5.3 5-9.5 5s-7.3-2-9.5-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export default function Page() {
  const {
    user,
    currency,
    income,
    bonus,
    investmentBase,
    payday,
    setCurrency,
    setIncome,
    setBonus,
    setInvestmentBase,
    setPayday,
    addTransaction,
  } = useFinance()
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation()

  const [name, setName] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [notice, setNotice] = useState<StatusNotice | null>(null)

  // State local: evita salvar plano mensal enquanto o usuário está digitando.
  const [draftIncome, setDraftIncome] = useState(income)
  const [draftInvestmentBase, setDraftInvestmentBase] = useState(investmentBase)
  const [draftPayday, setDraftPayday] = useState(payday)

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const profileName = name ?? user?.user_metadata?.full_name ?? ''

  const showStatus = (message: string, variant: StatusVariant = 'info') => {
    setNotice({ message, variant })
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Aplica mudanças do plano mensal apenas ao clicar em Salvar.
    setIncome(draftIncome)
    setInvestmentBase(draftInvestmentBase)
    setPayday(draftPayday)


    const cleanName = removeNumbers(profileName).trim()
    if (!cleanName) return

    if (password && password !== confirmPassword) {
      showStatus(t('messages.passwordMismatch'), 'error')
      return
    }

    if (password) {
      const passwordError = getPasswordStrengthError(password)
      if (passwordError) {
        showStatus(passwordError, 'error')
        return
      }
    }

    const updates: Parameters<typeof supabase.auth.updateUser>[0] = {
      data: {
        full_name: cleanName,
      },
    }

    if (password) {
      updates.password = password
    }

    const { error } = await supabase.auth.updateUser(updates)

    if (error) {
      showStatus(error.message, 'error')
      return
    }

    setPassword('')
    setConfirmPassword('')
    showStatus(t('messages.success'), 'success')
  }

  function handleAddBonus() {
    const bonusAmount = Number(bonus)
    if (!Number.isFinite(bonusAmount) || bonusAmount <= 0) {
      showStatus(t('messages.invalidBonus'), 'error')
      return
    }

    addTransaction({
      category: 'Renda',
      amount: bonusAmount,
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      notes: t('profile.bonusNote'),
    })

    setBonus('0')
    showStatus(t('messages.bonusAdded'), 'success')
  }

  function handleInvestmentMovement(type: 'expense' | 'income') {
    const amount = Number(investmentAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      showStatus(t('messages.invalidInvestment'), 'error')
      return
    }

    addTransaction({
      category: 'Investimentos',
      amount,
      date: new Date().toISOString().split('T')[0],
      type,
      notes: type === 'expense' ? 'finleaf-investment-add' : 'finleaf-investment-withdraw',
    })

    setInvestmentAmount('')
    showStatus(type === 'expense' ? t('messages.investmentAdded') : t('messages.investmentWithdrawn'), 'success')
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    setNotice(null)

    const { error } = await supabase.auth.signOut()

    setIsLoggingOut(false)

    if (error) {
      showStatus(error.message, 'error')
      return
    }

    window.location.replace('/login')
  }

  return (
    <NavigationLayout title={t('profile.title')} subtitle={t('profile.subtitle')}>
      <div className="grid gap-6">
        {notice ? <StatusToast message={notice.message} variant={notice.variant} onDismiss={() => setNotice(null)} /> : null}

        {/* Single form for everything that hits Supabase auth (name/password). Currency/plan/prompted inputs persist via FinanceProvider. */}
        <form className="grid gap-6" onSubmit={handleSave}>
          {/* Conta */}
          <section className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">
                    {t('profile.account')}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('profile.personalize')}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('profile.name')}
                  <input
                    value={profileName}
                    onChange={(event) => setName(removeNumbers(event.target.value))}
                    className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('profile.currency')}
                  <select
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value as 'BRL' | 'USD' | 'EUR')}
                    aria-label={t('profile.currency')}
                    className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                  >
                    <option value="BRL">Real (BRL)</option>
                    <option value="USD">{t('profile.dollar')} (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="mt-6 w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 sm:w-auto"
              >
                {t('profile.save')}
              </button>
            </div>
          </section>

          {/* Plano mensal */}
          <section className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">
                {t('profile.monthlyPlan')}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('profile.monthlyPlanDesc')}</p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('profile.income')}
                <input
                  type="number"
                  value={draftIncome}
                  onChange={(event) => setDraftIncome(event.target.value)}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                />
              </label>


              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('profile.investmentBase')}
                <input
                  type="number"
                  value={draftInvestmentBase}
                  onChange={(event) => setDraftInvestmentBase(event.target.value)}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                />

              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('profile.payday')}
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={draftPayday}
                  onChange={(event) => setDraftPayday(event.target.value)}

                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{t('profile.investmentBaseDesc')}</p>

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 sm:w-auto"
            >
              {t('profile.save')}
            </button>
          </section>


          {/* Movimentos pontuais */}
          <section className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">
                {t('profile.manualMovements')}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('profile.manualMovementsDesc')}</p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('profile.bonus')}
                <input
                  type="number"
                  value={bonus}
                  onChange={(event) => setBonus(event.target.value)}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={handleAddBonus}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900 sm:py-2"
                >
                  {t('profile.addBonus')}
                </button>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('profile.investmentMovement')}
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(event) => setInvestmentAmount(event.target.value)}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleInvestmentMovement('expense')}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900 sm:py-2"
                  >
                    {t('profile.addInvestment')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInvestmentMovement('income')}
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900 sm:py-2"
                  >
                    {t('profile.withdrawInvestment')}
                  </button>
                </div>
              </label>
            </div>

          </section>

          {/* Security (password -> Supabase) */}
          <section className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">
                {t('profile.security')}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{PASSWORD_REQUIREMENTS}</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('profile.newPassword')}
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={12}
                    autoComplete="new-password"
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label={showPassword ? 'Ocultar password' : 'Mostrar password'}
                  >
                    <EyeIcon hidden={showPassword} />
                  </button>
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('profile.confirmPassword')}
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={12}
                  autoComplete="new-password"
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                />
              </label>
            </div>

            <button className="mt-6 w-full rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 sm:w-auto">
              {t('profile.save')}
            </button>
          </section>
        </form>

        {/* Language */}
        <section className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{t('profile.language')}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('profile.languageDesc')}</p>
            </div>
          </div>

          <div className="mt-6">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('profile.language')}
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
              >
                <option value="auto">{t('profile.auto')}</option>
                <option value="pt">{t('profile.portuguese')}</option>
                <option value="en">{t('profile.english')}</option>
              </select>
            </label>
          </div>
        </section>

        {/* Logout */}
        <section className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90 sm:rounded-[32px] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{t('profile.account')}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('profile.accountDesc')}</p>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full rounded-full border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-900 sm:w-auto"
            >
              {isLoggingOut ? t('profile.loggingOut') : t('profile.logout')}
            </button>
          </div>
        </section>
      </div>
    </NavigationLayout>
  )
}

