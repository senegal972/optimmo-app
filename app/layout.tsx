import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Optimmo Dom — CRM Pipeline',
  description: 'Suivi acquéreurs et matching immobilier Martinique',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen" style={{ background: 'var(--cream)' }}>
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span className="text-lg">🏝️</span>
              <span className="font-semibold text-[#0D1E2E] tracking-tight">Optimmo Dom</span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">CRM Pipeline</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { href: '/', label: '📊 Dashboard' },
                { href: '/pipeline', label: '🗂️ Pipeline' },
                { href: '/leads', label: '👥 Leads' },
                { href: '/biens', label: '🏡 Biens' },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-[#0D1E2E] transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
