'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabaseclient'

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

export default function Home() {
  const [showLogin, setShowLogin] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setStatusMessage(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    setLoading(false)

    if (error) {
      setStatusMessage(error.message)
      return
    }

    setStatusMessage('Conta criada! Verifique o e-mail para ativar a conta.')
  }

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setStatusMessage(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setStatusMessage(error.message)
      return
    }

    setStatusMessage('Login realizado! Bem-vindo(a) ao Finleaf.')
    console.log('User signed in:', data.user)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_26%)] px-4 py-8 text-slate-900 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8">
        <header className="flex flex-col gap-3">
          <FinleafLogo />
          
        </header>

        <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white/85 shadow-2xl shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
          <div className={`flex w-[400%] transition-transform duration-700 ease-in-out ${showLogin ? '-translate-x-1/2' : 'translate-x-0'}`}>
            <section className="basis-1/4 shrink-0 flex flex-col justify-center gap-6 bg-slate-950 px-8 py-14 text-white sm:px-12 md:px-14">
              <div>
                <p className="text-lg font-semibold">Welcome Back</p>
                <p className="mt-3 max-w-[18rem] text-sm text-slate-300">If you already have an account, just sign in and continue managing your finances.</p>
              </div>
              <button
                type="button"
                className="inline-flex max-w-max items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                onClick={() => setShowLogin(true)}
              >
                Sign In
              </button>
            </section>

            <section className="basis-1/4 shrink-0 flex flex-col justify-center gap-6 px-8 py-14 sm:px-12 md:px-14">
              <div>
                <p className="text-lg font-semibold">Create Account</p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Start your journey with Finleaf and track your financial habits right away.</p>
              </div>
              <form className="flex flex-col gap-4" onSubmit={handleSignUp}>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nome
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
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
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                    placeholder="Sua senha"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Criando...' : 'Sign Up'}
                </button>
              </form>
            </section>

            <section className="basis-1/4 shrink-0 flex flex-col justify-center gap-6 px-8 py-14 sm:px-12 md:px-14">
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
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
                    placeholder="Sua senha"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Entrando...' : 'Sign In'}
                </button>
              </form>
            </section>

            <section className="basis-1/4 shrink-0 flex flex-col justify-center gap-6 bg-slate-950 px-8 py-14 text-white sm:px-12 md:px-14">
              <div>
                <p className="text-lg font-semibold">Don't have an account?</p>
                <p className="mt-3 max-w-[18rem] text-sm text-slate-300">Sign up now to start using Finleaf and keep your financial life organized.</p>
              </div>
              <button
                type="button"
                className="inline-flex max-w-max items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                onClick={() => setShowLogin(false)}
              >
                Sign Up
              </button>
            </section>
          </div>
        </div>

        {statusMessage ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            {statusMessage}
          </div>
        ) : null}
      </div>
    </main>
  )
}
