import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acceso | Mi Pueblo Shop',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-500 to-brand-700 px-4 py-12">
      <a href="/" className="mb-8 text-2xl font-bold text-white tracking-tight">
        Mi Pueblo Shop
      </a>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {children}
      </div>
    </div>
  )
}
