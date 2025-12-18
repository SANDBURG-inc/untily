import type { Metadata } from 'next'
import { DesignSystemSidebar } from '@/components/design-system/Sidebar'
import { ensureAuthenticated } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Design System | Untily',
  description: 'Component library and style guide for Untily project.',
}

export default async function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 인증된 사용자만 접근 가능
  await ensureAuthenticated()

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DesignSystemSidebar />
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="container max-w-7xl mx-auto py-10 px-6 lg:px-12 pb-32">
          {children}
        </div>
      </main>
    </div>
  )
}
