import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { AuthCard } from '@/components/auth/auth-card'
import { LoginForm } from '@/components/auth/login-form'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  // Fresh database → create the first super admin instead.
  if ((await db.adminUser.count()) === 0) redirect('/setup')
  return (
    <AuthCard title="NexDrop Admin" description="Sign in to manage stores and themes">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  )
}
