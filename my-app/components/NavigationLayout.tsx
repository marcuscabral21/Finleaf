'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useFinance } from './FinanceProvider'
import { useTranslation } from './useTranslation'

const navItems = [
  { labelKey: 'nav.home', href: '/', badgeKey: 'nav.dashboard', icon: '⌂' },
  { labelKey: 'nav.history', href: '/history', badgeKey: 'nav.transactions', icon: '≡' },
  { labelKey: 'nav.goals', href: '/goals', badgeKey: 'nav.goals', icon: '◎' },
  { labelKey: 'nav.profile', href: '/profile', badgeKey: 'nav.account', icon: '◦' },
]

interface NavigationLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export default function NavigationLayout({ title, subtitle, children }: NavigationLayoutProps) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { user, loading } = useFinance()
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Conta'
  const displayInitial = displayName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1480px] gap-6 px-3 pb-28 pt-3 sm:px-4 sm:pt-6 lg:px-8 lg:pb-6">
        <aside className="hidden w-72 shrink-0 rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:block">
          <div className="mb-10 flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Finleaf</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{t('nav.manageMoney')}</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{t('nav.description')}</p>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-3xl px-4 py-4 text-sm font-medium transition ${
                    active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
                  }`}
                >
                  <span>{t(item.labelKey)}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    {t(item.badgeKey)}
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-12 rounded-[28px] border border-slate-200 bg-slate-50/90 p-5 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200">
            <p className="font-semibold">{t('nav.finleafTip')}</p>
            <p className="mt-3 text-sm leading-6">{t('nav.tipDescription')}</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-5 flex flex-col gap-5 rounded-[26px] border border-slate-200 bg-white/90 px-4 py-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 sm:mb-8 sm:rounded-[32px] sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 sm:text-sm">{title}</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">{subtitle}</h1>
              </div>

              <Link href="/profile" className="flex w-full items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition hover:border-emerald-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 sm:w-auto">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white sm:h-12 sm:w-12">{loading ? '...' : displayInitial}</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{loading ? 'A carregar' : displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('nav.profile')}</p>
                </div>
              </Link>
            </div>
          </header>

          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-1 py-2 text-[11px] font-semibold transition ${
                  active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="mt-1 max-w-full truncate">{t(item.labelKey)}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
