import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

interface HomePageProps {
  params: { locale: string }
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'HomePage' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default function HomePage() {
  const t = useTranslations('HomePage')

  return (
    <main className="min-h-screen bg-surface">
      {/* Hero temporal — se reemplaza en Fase 2 con el feed TikTok */}
      <section className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-500 to-brand-700 px-4 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
            {t('title')}
          </h1>
          <p className="mb-8 text-lg text-brand-100 sm:text-xl">
            {t('subtitle')}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="#"
              className="inline-flex min-h-touch items-center justify-center rounded-full bg-white px-8 font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              {t('ctaBrowse')}
            </a>
            <a
              href="#"
              className="inline-flex min-h-touch items-center justify-center rounded-full border-2 border-white px-8 font-semibold text-white transition hover:bg-white/10"
            >
              {t('ctaVendor')}
            </a>
          </div>
        </div>
      </section>

      {/* TODO Fase 2: Feed vertical estilo TikTok con productos activos */}
    </main>
  )
}
