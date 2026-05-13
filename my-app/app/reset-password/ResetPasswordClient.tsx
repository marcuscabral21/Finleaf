'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StatusToast, { type StatusVariant } from '@/components/StatusToast'
import { supabase } from '@/lib/supabaseclient'
import { PASSWORD_REQUIREMENTS, getPasswordStrengthError } from '@/lib/password'

type StatusNotice = {
  message: string
  variant: StatusVariant
}

export default function ResetPasswordClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
        setStatusNotice({ message: 'Link de recuperação detectado. Defina sua nova senha abaixo.', variant: 'info' })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const recoveryRedirectNotice = useMemo<StatusNotice | null>(() => {
    if (!recoveryActive && searchParams.get('type') === 'recovery') {
      return { message: 'Email de recuperação enviado. Clique no link do email para continuar.', variant: 'info' }
    }
    return null
  }, [searchParams, recoveryActive])

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
      showStatus('Preencha a nova password e a confirmação.', 'error')
      return
    }

    if (password !== confirmPassword) {
      showStatus('As passwords não coincidem. Verifique e tente novamente.', 'error')
      return
    }

    const passwordError = getPasswordStrengthError(password)
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

    showStatus('Password atualizada com sucesso. A redirecionar para o login...', 'success')
    setTimeout(() => {
      router.push('/')
    }, 1800)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_26%)] px-4 py-8 text-slate-900 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-[32px] border border-slate-200 bg-white/90 p-10 shadow-2xl shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold">Recuperar senha</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Use o link de recuperação que foi enviado por email. Esta página conclui o reset de senha usando o link de recuperação do Supabase.
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
            Nova senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nova senha"
              minLength={12}
              autoComplete="new-password"
              className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">{PASSWORD_REQUIREMENTS}</span>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Confirmar senha
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirme a nova senha"
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
            {loading ? 'Atualizando...' : 'Atualizar senha'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition"
        >
          Voltar para login
        </button>
      </div>
    </main>
  )
}
