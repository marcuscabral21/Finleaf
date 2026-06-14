'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StatusToast, { type StatusVariant } from '@/components/StatusToast'
import { useTranslation } from '@/components/useTranslation'
import { supabase } from '@/lib/supabaseclient'
import { getPasswordRequirements, getPasswordStrengthError } from '@/lib/password'

type StatusNotice = {
  message: string
  variant: StatusVariant
}

export default function ResetPasswordClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, currentLanguage } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [statusNotice, setStatusNotice] = useState<StatusNotice | null>(null)
  const [redirectNoticeDismissed, setRedirectNoticeDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recoveryActive, setRecoveryActive] = useState(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryActive(true)
        setStatusNotice({ message: t('messages.recoveryLinkDetected'), variant: 'info' })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [t])

  const recoveryRedirectNotice = useMemo<StatusNotice | null>(() => {
    if (!recoveryActive && searchParams.get('type') === 'recovery') {
      return { message: t('messages.recoveryLinkNeeded'), variant: 'info' }
    }
    return null
  }, [searchParams, recoveryActive, t])

  const activeStatusNotice = statusNotice || (redirectNoticeDismissed ? null : recoveryRedirectNotice)
  const showStatus = (message: string, variant: StatusVariant = 'info') => {
    setStatusNotice({ message, variant })
  }
  const dismissStatus = () => {
    if (statusNotice) {
      setStatusNotice(null)
    } else {
      setRedirectNoticeDismissed(true)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!password || !confirmPassword) {
      showStatus(t('messages.resetRequiredFields'), 'error')
      return
    }

    if (password !== confirmPassword) {
      showStatus(t('messages.resetPasswordMismatch'), 'error')
      return
    }

    const passwordError = getPasswordStrengthError(password, currentLanguage)
    if (passwordError) {
      showStatus(passwordError, 'error')
      return
    }

    setLoading(true)
    setStatusNotice(null)

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (error) {
      showStatus(error.message, 'error')
      return
    }

    showStatus(t('messages.passwordUpdated'), 'success')
    setTimeout(() => {
      router.push('/')
    }, 1800)
  }

  return (
    <main className="finleaf-shell min-h-screen px-3 py-4 text-slate-900 dark:text-slate-100 sm:px-4 sm:py-8">
      <div className="finleaf-panel finleaf-content mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-2xl shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:gap-8 sm:rounded-[32px] sm:p-10">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold sm:text-3xl">{t('reset.title')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t('reset.description')}
          </p>
        </div>

        {activeStatusNotice ? (
          <StatusToast
            message={activeStatusNotice.message}
            variant={activeStatusNotice.variant}
            onDismiss={dismissStatus}
          />
        ) : null}

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('reset.newPassword')}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('reset.newPasswordPlaceholder')}
              minLength={12}
              autoComplete="new-password"
              className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">{getPasswordRequirements(currentLanguage)}</span>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('reset.confirmPassword')}
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t('reset.confirmPasswordPlaceholder')}
              minLength={12}
              autoComplete="new-password"
              className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t('reset.updating') : t('reset.submit')}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push('/')}
          className="rounded-full border border-slate-200 px-6 py-3 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
        >
          {t('reset.backToLogin')}
        </button>
      </div>
    </main>
  )
}
