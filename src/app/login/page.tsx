import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { IconLogo } from '@/components/icons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DEMO_ACCOUNTS } from '@/lib/demo'
import { isDemoMode } from '@/lib/secrets'

// Reads DEMO_MODE at request time, not build time.
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const demoAccounts = isDemoMode() ? DEMO_ACCOUNTS.map(({ email, password, label, description }) => ({ email, password, label, description })) : []
  return (
    <div className="relative grid h-screen place-items-center overflow-hidden bg-slate-50 p-4">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-[-8%] h-[28rem] w-[28rem] rounded-full bg-sky-300/40 blur-3xl" />
        <div className="absolute right-[-6%] top-24 h-[32rem] w-[32rem] rounded-full bg-violet-300/35 blur-3xl" />
        <div className="absolute bottom-[-12%] left-1/3 h-[26rem] w-[26rem] rounded-full bg-emerald-200/40 blur-3xl" />
      </div>
      <Card className="relative w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mx-auto mb-2 grid size-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg">
            <IconLogo className="size-6" />
          </span>
          <CardTitle>NexDrop Admin</CardTitle>
          <CardDescription>Sign in to manage stores and themes</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <LoginForm demoAccounts={demoAccounts} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
