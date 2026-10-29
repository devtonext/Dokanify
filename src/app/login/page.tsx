'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { IconLogo } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    const res = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    })
    setBusy(false)
    if (res?.error) {
      setError('Incorrect email or password')
      return
    }
    const next = params.get('next')
    router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  )
}

export default function LoginPage() {
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
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
