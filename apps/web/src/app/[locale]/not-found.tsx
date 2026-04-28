import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function NotFound() {
  const t = useTranslations('NotFound')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-6xl font-bold text-brand-500">404</h1>
      <p className="mb-6 text-xl text-gray-600">{t('title')}</p>
      <Link
        href="/"
        className="inline-flex min-h-touch items-center justify-center rounded-full bg-brand-500 px-8 font-semibold text-white hover:bg-brand-600"
      >
        {t('backHome')}
      </Link>
    </main>
  )
}
