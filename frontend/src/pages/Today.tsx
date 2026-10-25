import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { fmtDate } from '../lib/format'

export default function Today() {
  const { t, i18n } = useTranslation()
  const isFa = i18n.language === 'fa'
  const { data, isLoading, isError } = useQuery({
    queryKey: ['exercises'],
    queryFn: api.exercises,
  })

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[13px] text-muted">
            {fmtDate(new Date(), { dateStyle: 'full' })}
          </p>
          <h1 className="mt-1 text-[34px] leading-tight font-bold">{t('today.title')}</h1>
        </div>
        <button
          onClick={() => i18n.changeLanguage(isFa ? 'en' : 'fa')}
          aria-label={t('settings.language')}
          className="h-11 min-w-11 rounded-xl border border-line px-3 text-sm font-medium"
        >
          {isFa ? 'EN' : 'فا'}
        </button>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-[11px] tracking-widest text-muted rtl:tracking-normal">
          {t('today.exercises')}
        </h2>
        {isLoading && <p className="text-muted">{t('today.loading')}</p>}
        {isError && <p className="text-danger">{t('today.error')}</p>}
        <ul className="flex flex-col gap-3 text-[15px]">
          {data?.map((ex) => (
            <li key={ex.id}>{isFa ? ex.name_fa : ex.name_en}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
