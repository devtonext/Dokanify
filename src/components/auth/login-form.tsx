'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type DemoAccount = { email: string; password: string; label: string; description: string }

export function LoginForm({ demoAccounts = [] }: { demoAccounts?: DemoAccount[] }) {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Until hydrated, the form must not submit natively (it would put the password in the URL).
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  const formRef = useRef<HTMLFormElement>(null)

  async function login(email: string, password: string) {
    setBusy(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setBusy(false)
    if (res?.error) {
      setError('Incorrect email or password')
      return
    }
    const next = params.get('next')
    router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/')
    router.refresh()
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    login(String(form.get('email')), String(form.get('password')))
  }

  function signInAsDemo(account: DemoAccount) {
    const form = formRef.current
    if (form) {
      ;(form.elements.namedItem('email') as HTMLInputElement).value = account.email
      ;(form.elements.namedItem('password') as HTMLInputElement).value = account.password
    }
    login(account.email, account.password)
  }

  return (
    <>
    <form ref={formRef} onSubmit={onSubmit} method="post" className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy || !ready}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
    </form>
    {demoAccounts.length > 0 && (
      <div className="mt-6 space-y-2 border-t pt-5">
        <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Try the demo</p>
        {demoAccounts.map((a) => (
          <button
            key={a.email}
            type="button"
            disabled={busy || !ready}
            onClick={() => signInAsDemo(a)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border bg-white/60 px-3 py-2 text-left transition hover:bg-white disabled:opacity-50"
          >
            <span>
              <span className="block text-sm font-medium">{a.label}</span>
              <span className="block text-[11px] text-muted-foreground">{a.description}</span>
            </span>
            <span className="text-right font-mono text-[10px] leading-tight text-muted-foreground">
              {a.email}
              <br />
              {a.password}
            </span>
          </button>
        ))}
      </div>
    )}
    </>
  )
}
