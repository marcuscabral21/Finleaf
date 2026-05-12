'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useFinance } from './FinanceProvider'
import { useTranslation } from './useTranslation'

const navItems = [
  { labelKey: 'nav.home', href: '/', badgeKey: 'nav.dashboard' },
  { labelKey: 'nav.history', href: '/history', badgeKey: 'nav.transactions' },
  { labelKey: 'nav.goals', href: '/goals', badgeKey: 'nav.goals' },
  { labelKey: 'nav.profile', href: '/profile', badgeKey: 'nav.account' },
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
      <div className="mx-auto flex min-h-screen max-w-[1480px] gap-6 px-4 py-6 lg:px-8">
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

        <main className="flex-1">
          <header className="mb-8 flex flex-col gap-6 rounded-[32px] border border-slate-200 bg-white/90 px-6 py-5 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{title}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{subtitle}</h1>
              </div>

              <Link href="/profile" className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition hover:border-emerald-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">{loading ? '...' : displayInitial}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{loading ? 'A carregar' : displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('nav.profile')}</p>
                </div>
              </Link>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  )
}
