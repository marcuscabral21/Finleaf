'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StatusToast, { type StatusVariant } from '@/components/StatusToast'
import { supabase } from '@/lib/supabaseclient'
import { PASSWORD_REQUIREMENTS, getPasswordStrengthError } from '@/lib/password'

function removeNumbers(value: string) {
  return value.replace(/\d/g, '')
}

type StatusNotice = {
  message: string
  variant: StatusVariant
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg className="h-5 w-5 overflow-visible" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.5 7.8C5.4 8.8 3.7 10.4 2.5 12c2.2 3 5.3 5 9.5 5 1.4 0 2.7-.2 3.8-.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.9 7.2c3.3.5 5.8 2.4 7.6 4.8-.8 1.1-1.8 2.1-2.9 2.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg className="h-5 w-5 overflow-visible" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12c2.2-3 5.3-5 9.5-5s7.3 2 9.5 5c-2.2 3-5.3 5-9.5 5s-7.3-2-9.5-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function FinleafLogo() {
  return (
    <div className="mb-8 flex items-center gap-3 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
      <div className="inline-flex h-20 items-center justify-center gap-3">
        {/* Dark theme: WhiteFinleaf + WhitePlant */}
        <div className="hidden dark:flex dark:items-center dark:gap-3">
          <img src="/WhiteFinleaf.svg" alt="Finleaf logo" className="h-20 w-28 object-contain" />
          <img src="/WhitePlant.svg" alt="Plant" className="h-16 w-16 object-contain" />
        </div>
        {/* Light theme: same white SVGs inverted to black for identical weight */}
        <div className="flex items-center gap-3 dark:hidden">
          <img src="/WhiteFinleaf.svg" alt="Finleaf logo" className="h-20 w-28 object-contain filter invert" />
          <img src="/WhitePlant.svg" alt="Plant" className="h-16 w-16 object-contain filter invert" />
        </div>
      </div>

    </div>
  )
}

export default function HomeClient() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [statusNotice, setStatusNotice] = useState<StatusNotice | null>(null)
  const [queryNoticeDismissed, setQueryNoticeDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  const queryStatusNotice = useMemo<StatusNotice | null>(() => {
    if (searchParams.get('emailConfirmed') === 'true' || searchParams.get('type') === 'signup') {
      return { message: 'Email confirmado com sucesso! Faça login com sua senha.', variant: 'success' }
    }
    return null
  }, [searchParams])

  const activeStatusNotice = statusNotice || (queryNoticeDismissed ? null : queryStatusNotice)
  const showStatus = (message: string, variant: StatusVariant = 'info') => {
    setStatusNotice({ message, variant })
  }
  const dismissStatus = () => {
    if (statusNotice) {
      setStatusNotice(null)
    } else {
      setQueryNoticeDismissed(true)
    }
  }

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanName = removeNumbers(name).trim()

    if (!cleanName) return

    const passwordError = getPasswordStrengthError(password)
    if (passwordError) {
      showStatus(passwordError, 'error')
      return
    }

    setLoading(true)
    setStatusNotice(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login?emailConfirmed=true`,
        data: {
          full_name: cleanName,
        },
      },
    })

    setLoading(false)

    if (error) {
      showStatus(error.message, 'error')
      return
    }

    showStatus('Conta criada com sucesso! Verifique seu email para confirmar a conta antes de fazer login.', 'success')
  }

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setStatusNotice(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        showStatus('Email não confirmado. Verifique sua caixa de entrada e confirme sua conta antes de fazer login.', 'error')
      } else {
        showStatus(error.message, 'error')
      }
      return
    }

    showStatus('Login realizado com sucesso! Bem-vindo(a) ao Finleaf.', 'success')
    console.log('User signed in:', data.user)
    router.push('/')
    router.refresh()
  }

  const handleForgotPassword = async () => {
    if (!email) {
      showStatus('Insira o seu email primeiro para enviarmos o link de recuperação.', 'info')
      return
    }

    setLoading(true)
    setStatusNotice(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
        showStatus('Muitos emails foram enviados recentemente. Aguarde alguns minutos e tente novamente.', 'error')
      } else {
        showStatus(error.message, 'error')
      }
      return
    }

    showStatus('Email de recuperação enviado. Verifique sua caixa de entrada.', 'success')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_26%)] px-4 py-8 text-slate-900 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8">
        <header className="flex flex-col gap-3">
          <FinleafLogo />
        </header>

        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/85 shadow-2xl shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
          <div className={`flex w-[200%] transition-transform duration-700 ease-in-out ${isSignUp ? 'translate-x-0' : '-translate-x-1/2'}`}>
            {/* Sign Up View */}
            <div className="basis-1/2 shrink-0 flex">
              {/* Form Section (2/3) */}
              <section className="w-2/3 flex flex-col justify-center gap-6 px-8 py-14 sm:px-12 md:px-14">
                <div>
                  <p className="text-lg font-semibold">Create Account</p>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Start your journey with Finleaf and track your financial habits right away.</p>
                </div>
                <form className="flex flex-col gap-4" onSubmit={handleSignUp}>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Nome
                    <input
                      value={name}
                      onChange={(event) => setName(removeNumbers(event.target.value))}
                      required
                      className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                      placeholder="Seu nome"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Email
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                      placeholder="email@example.com"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Password
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        minLength={12}
                        autoComplete="new-password"
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                        placeholder="Sua senha"
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
                    <span className="text-xs text-slate-500 dark:text-slate-400">{PASSWORD_REQUIREMENTS}</span>
                  </label>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Criando...' : 'Sign Up'}
                  </button>
                </form>
              </section>

              {/* CTA Section (1/3) */}
              <section className="relative w-1/3 flex flex-col justify-center gap-6 bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700 px-8 py-14 text-white sm:px-8 md:px-10">
                {/* Plant Logo */}
                <div className="absolute top-6 left-6">
                  <img src="/WhitePlant.svg" alt="Plant" className="h-12 w-12 object-contain filter invert dark:filter-none" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Welcome Back</p>
                  <p className="mt-3 max-w-[14rem] text-sm text-slate-300 dark:text-slate-200">If you already have an account, just sign in and continue managing your finances.</p>
                </div>
                <button
                  type="button"
                  className="inline-flex max-w-max items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-950/30 transition hover:bg-slate-50"
                  onClick={() => setIsSignUp(false)}
                >
                  Sign In
                </button>
              </section>
            </div>

            {/* Sign In View */}
            <div className="basis-1/2 shrink-0 flex">
              {/* Form Section (2/3) */}
              <section className="w-2/3 flex flex-col justify-center gap-6 px-8 py-14 sm:px-12 md:px-14">
                <div>
                  <p className="text-lg font-semibold">Sign In</p>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Use your Supabase credentials to access your account and manage your finance dashboard.</p>
                </div>
                <form className="flex flex-col gap-4" onSubmit={handleSignIn}>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Email
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                      placeholder="email@example.com"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Password
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                        placeholder="Sua senha"
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
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition disabled:opacity-60"
                    >
                      Forgot your password  ?
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Logging in...' : 'Sign In'}
                  </button>
                </form>
              </section>

              {/* CTA Section (1/3) */}
              <section className="relative w-1/3 flex flex-col justify-center gap-6 bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700 px-8 py-14 text-white sm:px-8 md:px-10">
                {/* Plant Logo */}
                <div className="absolute top-6 left-6">
                  <img src="/WhitePlant.svg" alt="Plant" className="h-12 w-12 object-contain filter invert dark:filter-none" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Don&apos;t have an account?</p>
                  <p className="mt-3 max-w-[14rem] text-sm text-slate-300 dark:text-slate-200">Sign up now to start using Finleaf and keep your financial life organized.</p>
                </div>
                <button
                  type="button"
                  className="inline-flex max-w-max items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-950/30 transition hover:bg-slate-50"
                  onClick={() => setIsSignUp(true)}
                >
                  Sign Up
                </button>
              </section>
            </div>
          </div>
        </div>

        {activeStatusNotice ? (
          <StatusToast
            message={activeStatusNotice.message}
            variant={activeStatusNotice.variant}
            onDismiss={dismissStatus}
          />
        ) : null}

        <footer className="fixed bottom-6 right-6 flex gap-6">
          <a href="mailto:marcusdavicabral2101@gmail.com" className="text-slate-900 dark:text-white hover:opacity-70 transition">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </a>
          <a href="https://www.linkedin.com/in/marcus-cabral-529a61233/" className="text-slate-900 dark:text-white hover:opacity-70 transition">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </footer>
      </div>
    </main>
  )
}
