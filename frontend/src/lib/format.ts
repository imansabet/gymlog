import i18n from '../i18n'

const isFa = () => i18n.language === 'fa'

export const fmtNumber = (n: number, opts?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(isFa() ? 'fa-IR' : 'en-US', opts).format(n)

export const fmtDate = (
  date: string | Date,
  opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
) =>
  new Intl.DateTimeFormat(isFa() ? 'fa-IR-u-ca-persian' : 'en-US', opts).format(
    new Date(date),
  )

export function fmtDuration(totalSeconds: number) {
  const plain = { useGrouping: false }
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${fmtNumber(m, plain)}:${fmtNumber(s, { ...plain, minimumIntegerDigits: 2 })}`
}
