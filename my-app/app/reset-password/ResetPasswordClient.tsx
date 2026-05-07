'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseclient'

export default function ResetPasswordClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recoveryActive, setRecoveryActive] = useState(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryActive(true)
        setStatusMessage('Link de recuperação detectado. Defina sua nova senha abaixo.')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const recoveryRedirectMessage = useMemo(() => {
    if (!recoveryActive && searchParams.get('type') === 'recovery') {
      return 'Email de recuperação enviado! Clique no link do email para continuar.'
    }
    return null
  }, [searchParams, recoveryActive])

  const activeStatusMessage = statusMessage || recoveryRedirectMessage

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!password || !confirmPassword) {
      setStatusMessage('Preencha ambas as senhas.')
      return
    }

    if (password !== confirmPassword) {
      setStatusMessage('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setStatusMessage('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    setStatusMessage(null)

    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (error) {
      setStatusMessage(error.message)
      return
    }

    setStatusMessage('Senha atualizada com sucesso! Redirecionando para login...')
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

        {activeStatusMessage ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            {activeStatusMessage}
          </div>
        ) : null}

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Nova senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nova senha"
              className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Confirmar senha
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirme a nova senha"
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
