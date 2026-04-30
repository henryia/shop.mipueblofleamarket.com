'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function SignUpPage() {
  const t = useTranslations('Auth')
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'BUYER' | 'VENDOR'>('BUYER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? t('registrationError'))
        setLoading(false)
        return
      }

      // Auto sign-in after registration
      await signIn('credentials', { email, password, callbackUrl: role === 'VENDOR' ? '/vendor/onboarding' : '/' })
    } catch {
      setError(t('registrationError'))
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-foreground">{t('signUp')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t('signUpSubtitle')}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Selector de rol */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setRole('BUYER')}
          className={`rounded-xl border-2 p-3 text-sm font-medium transition ${
            role === 'BUYER'
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-input text-muted-foreground hover:border-brand-300'
          }`}
        >
          🛍️ {t('roleBuyer')}
        </button>
        <button
          type="button"
          onClick={() => setRole('VENDOR')}
          className={`rounded-xl border-2 p-3 text-sm font-medium transition ${
            role === 'VENDOR'
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-input text-muted-foreground hover:border-brand-300'
          }`}
        >
          🏪 {t('roleVendor')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('name')}</label>
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-brand-500 transition focus:ring-2"
            placeholder={t('namePlaceholder')}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('email')}</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-brand-500 transition focus:ring-2"
            placeholder="hola@ejemplo.com"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t('password')}</label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-brand-500 transition focus:ring-2"
            placeholder={t('passwordHint')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60 min-h-touch"
        >
          {loading ? t('creatingAccount') : t('createAccount')}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {t('termsAgreement', {
          terms: <Link href="/legal/terms" className="underline">{t('terms')}</Link>,
          privacy: <Link href="/legal/privacy" className="underline">{t('privacy')}</Link>,
        })}
      </p>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('haveAccount')}{' '}
        <Link href="/auth/signin" className="font-semibold text-brand-600 hover:underline">
          {t('signIn')}
        </Link>
      </p>
    </>
  )
}
