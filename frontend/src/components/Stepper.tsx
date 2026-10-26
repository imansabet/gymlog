import { useTranslation } from 'react-i18next'

type Props = {
  label: string
  value: string
  unit?: string
  onMinus: () => void
  onPlus: () => void
}

export default function Stepper({ label, value, unit, onMinus, onPlus }: Props) {
  const { t } = useTranslation()
  const btn =
    'h-12 flex-1 rounded-xl border border-[#2f3742] bg-bg text-2xl font-medium active:scale-95'

  return (
    <div className="flex flex-1 flex-col gap-2.5 rounded-2xl border border-line bg-surface p-3.5">
      <div className="text-[11px] tracking-widest text-muted rtl:tracking-normal">{label}</div>
      <div className="text-[34px] leading-none font-bold tabular-nums">
        {value}
        {unit && <span className="ms-1 text-sm font-medium text-muted">{unit}</span>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onMinus}
          aria-label={`${t('common.decrease')} ${label}`}
          className={btn}
        >
          −
        </button>
        <button
          type="button"
          onClick={onPlus}
          aria-label={`${t('common.increase')} ${label}`}
          className={btn}
        >
          +
        </button>
      </div>
    </div>
  )
}
