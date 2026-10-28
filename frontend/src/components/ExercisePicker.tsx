import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Exercise } from '../lib/api'
import { fmtNumber } from '../lib/format'

type Kind = Exercise['kind']

const KIND_ORDER: Kind[] = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'kettlebell',
  'band',
]

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u064b-\u065f\u0640\u200c\u200e\u200f\s-]/g, '')

type Props = {
  exercises: Exercise[]
  recentIds: string[]
  onPick: (id: string) => void
}

export default function ExercisePicker({ exercises, recentIds, onPick }: Props) {
  const { t, i18n } = useTranslation()
  const isFa = i18n.language === 'fa'
  const [query, setQuery] = useState('')
  const [openKind, setOpenKind] = useState<Kind | null>(null)

  const name = (e: Exercise) => (isFa ? e.name_fa : e.name_en)
  const byName = (a: Exercise, b: Exercise) =>
    name(a).localeCompare(name(b), isFa ? 'fa' : 'en')

  const q = norm(query)
  const results = q
    ? exercises.filter((e) => norm(e.name_fa + e.name_en).includes(q)).sort(byName)
    : []

  const recent = recentIds
    .map((id) => exercises.find((e) => e.id === id))
    .filter((e): e is Exercise => e !== undefined)

  const groups = KIND_ORDER.map((kind) => ({
    kind,
    items: exercises.filter((e) => e.kind === kind).sort(byName),
  })).filter((g) => g.items.length > 0)

  const label = 'mb-2 text-[11px] tracking-widest text-muted rtl:tracking-normal'

  const renderRow = (e: Exercise, opts: { showKind?: boolean; nested?: boolean } = {}) => (
    <button
      type="button"
      onClick={() => onPick(e.id)}
      className={`flex h-14 w-full items-center justify-between gap-3 rounded-2xl border border-line px-4 text-start text-[15px] active:scale-[0.99] ${
        opts.nested ? 'bg-bg' : 'bg-surface'
      }`}
    >
      <span>{name(e)}</span>
      {opts.showKind && <span className="shrink-0 text-xs text-muted">{t(`kinds.${e.kind}`)}</span>}
    </button>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('picker.search')}
          aria-label={t('picker.search')}
          className="h-12 w-full rounded-2xl border border-line bg-surface ps-11 pe-11 text-base"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={t('picker.clear')}
            className="absolute end-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-xl text-muted"
          >
            ×
          </button>
        )}
      </div>

      {q ? (
        results.length === 0 ? (
          <p className="text-muted">{t('picker.noResults')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {results.map((e) => (
              <li key={e.id}>{renderRow(e, { showKind: true })}</li>
            ))}
          </ul>
        )
      ) : (
        <>
          {recent.length > 0 && (
            <section>
              <h2 className={label}>{t('picker.recent')}</h2>
              <ul className="flex flex-col gap-2">
                {recent.map((e) => (
                  <li key={e.id}>{renderRow(e, { showKind: true })}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className={label}>{t('picker.categories')}</h2>
            <ul className="flex flex-col gap-2">
              {groups.map(({ kind, items }) => {
                const open = openKind === kind
                return (
                  <li key={kind} className="rounded-2xl border border-line bg-surface">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenKind(open ? null : kind)}
                      className="flex h-14 w-full items-center justify-between px-4"
                    >
                      <span className="font-medium">{t(`kinds.${kind}`)}</span>
                      <span className="flex items-center gap-2 text-muted">
                        <span className="text-[13px] tabular-nums">{fmtNumber(items.length)}</span>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform ${open ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </span>
                    </button>
                    {open && (
                      <ul className="flex flex-col gap-2 border-t border-line p-2">
                        {items.map((e) => (
                          <li key={e.id}>{renderRow(e, { nested: true })}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
