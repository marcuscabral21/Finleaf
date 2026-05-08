'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavigationLayout from '@/components/NavigationLayout'
import { useFinance } from '@/components/FinanceProvider'
import { useLanguage } from '@/components/LanguageProvider'
import { useTranslation } from '@/components/useTranslation'
import { supabase } from '@/lib/supabaseclient'

type Language = 'pt' | 'en' | 'auto'

export default function Page() {
  const router = useRouter()
  const { currency, income, bonus, payday, setCurrency, setIncome, setBonus, setPayday } = useFinance()
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password && password !== confirmPassword) {
      setMessage(t('messages.passwordMismatch'))
      return
    }
    setMessage(t('messages.success'))
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    setMessage(null)

    const { error } = await supabase.auth.signOut()

    setIsLoggingOut(false)

    if (error) {
      setMessage(error.message)
      return
    }

    router.push('/login')
    router.refresh()
  }

  return (
    <NavigationLayout title={t('profile.title')} subtitle={t('profile.subtitle')}>
      <div className="grid gap-6">
        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('profile.title')}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('profile.subtitle')}</p>
            </div>
            <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {t('profile.personalize')}
            </div>
          </div>

          <form className="mt-8 grid gap-5" onSubmit={handleSave}>
            <div className="grid gap-4 sm:grid-cols-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('profile.currency')}
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value as 'BRL' | 'USD' | 'EUR')}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                >
                  <option value="BRL">Real (BRL)</option>
                  <option value="USD">Dólar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('profile.income')}
                <input
                  type="number"
                  value={income}
                  onChange={(event) => setIncome(event.target.value)}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('profile.bonus')}
                <input
                  type="number"
                  value={bonus}
                  onChange={(event) => setBonus(event.target.value)}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('profile.payday')}
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={payday}
                  onChange={(event) => setPayday(event.target.value)}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('profile.newPassword')}
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('profile.confirmPassword')}
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                />
              </label>
            </div>

            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

            <button className="mt-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">
              {t('profile.save')}
            </button>
          </form>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('profile.language')}</p>
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

        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('profile.account')}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('profile.accountDesc')}</p>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-full border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400 dark:hover:bg-rose-900"
            >
              {isLoggingOut ? 'A sair...' : t('profile.logout')}
            </button>
          </div>
        </section>
      </div>
    </NavigationLayout>
  )
}
