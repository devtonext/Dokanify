import { redirect } from 'next/navigation'
import { AuthCard } from '@/components/auth/auth-card'
import { SetupForm } from '@/components/auth/setup-form'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Available only while no admin exists. */
export default async function SetupPage() {
  if ((await db.adminUser.count()) > 0) redirect('/login')
  return (
    <AuthCard title="Welcome to NexDrop" description="Create the first super admin for this installation">
      <SetupForm />
    </AuthCard>
  )
}
