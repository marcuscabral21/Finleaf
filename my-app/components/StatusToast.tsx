'use client'

export type StatusVariant = 'success' | 'error' | 'info'

type StatusToastProps = {
  message: string
  variant?: StatusVariant
  onDismiss?: () => void
}

const variantStyles: Record<StatusVariant, { panel: string; dot: string; title: string }> = {
  success: {
    panel: 'border-emerald-200 bg-emerald-50 text-emerald-950 shadow-emerald-950/10 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
    dot: 'bg-emerald-500',
    title: 'Sucesso',
  },
  error: {
    panel: 'border-rose-200 bg-rose-50 text-rose-950 shadow-rose-950/10 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100',
    dot: 'bg-rose-500',
    title: 'Atenção',
  },
  info: {
    panel: 'border-slate-200 bg-slate-50 text-slate-800 shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
    dot: 'bg-sky-500',
    title: 'Aviso',
  },
}

export default function StatusToast({ message, variant = 'info', onDismiss }: StatusToastProps) {
  const styles = variantStyles[variant]

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-md sm:right-6 sm:top-6" role="status" aria-live="polite">
      <div className={`rounded-3xl border px-5 py-4 shadow-2xl backdrop-blur-xl ${styles.panel}`}>
        <div className="flex items-start gap-3">
          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${styles.dot}`} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{styles.title}</p>
            <p className="mt-1 text-sm leading-5 opacity-85">{message}</p>
          </div>
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full px-2 py-1 text-sm font-semibold opacity-70 transition hover:bg-white/50 hover:opacity-100 dark:hover:bg-white/10"
              aria-label="Fechar mensagem"
            >
              x
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
