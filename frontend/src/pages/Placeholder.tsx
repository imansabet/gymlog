import { useTranslation } from 'react-i18next'

export default function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return <h1 className="text-[34px] leading-tight font-bold">{t(titleKey)}</h1>
}
