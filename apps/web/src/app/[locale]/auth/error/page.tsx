'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const errorMessages: Record<string, string> = {
  Configuration: 'authErrorConfig',
  AccessDenied: 'authErrorAccessDenied',
  Verification: 'authErrorVerification',
  Default: 'authError',
}

export default function AuthErrorPage() {
  const t = useTranslations('Auth')
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error') ?? 'Default'
  const messageKey = errorMessages[errorCode] ?? errorMessages['Default']

  return (
    <div className="text-center">
      <div className="mb-4 text-5xl">😕</div>
      <h1 className="mb-2 text-xl font-bold text-foreground">{t('authError')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t(messageKey as never)}</p>
      <Link
        href="/auth/signin"
        className="inline-flex min-h-touch items-center justify-center rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white hover:bg-brand-600"
      >
        {t('tryAgain')}
      </Link>
    </div>
  )
}
