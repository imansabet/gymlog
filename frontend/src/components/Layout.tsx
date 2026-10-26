import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fmtNumber } from '../lib/format'
import { useOutbox } from '../lib/useWorkouts'

const tabs = [
  {
    to: '/',
    key: 'nav.today',
    end: true,
    icon: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M3 9h18M8 2v4M16 2v4" />
      </>
    ),
  },
  {
    to: '/history',
    key: 'nav.history',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    to: '/progress',
    key: 'nav.progress',
    icon: (
      <>
        <path d="M3 17l6-6 4 4 8-9" />
        <path d="M15 6h6v6" />
      </>
    ),
  },
  {
    to: '/body',
    key: 'nav.body',
    icon: (
      <>
        <circle cx="12" cy="5" r="2.5" />
        <path d="M12 8v6M7 11h10M9 21l3-7 3 7" />
      </>
    ),
  },
]

export default function Layout() {
  const { t } = useTranslation()
  const pending = useOutbox().length

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-bg">
      <main className="flex-1 overflow-y-auto px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-4">
        <Outlet />
      </main>
      {pending > 0 && (
	  <div className="bg-surface py-1 text-center text-xs text-muted" role="status">
    	{t('sync.pending', { n: fmtNumber(pending) })}
  	</div>
	)}
      <nav className="flex border-t border-line bg-bg pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ to, key, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {icon}
            </svg>
            {t(key)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

