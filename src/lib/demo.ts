/**
 * Demo accounts for trying the whole system, one per role.
 * Shown on the login page only when DEMO_MODE=true. Created by `npm run db:seed`.
 * Demo users can use everything except actions that could lock other testers out
 * (changing passwords, managing the team, deleting themes).
 */
export const DEMO_ACCOUNTS = [
  {
    email: 'demo.superadmin@nexdrop.app',
    password: 'Demo@12345',
    name: 'Demo Super Admin',
    role: 'SUPER_ADMIN',
    label: 'Super admin',
    description: 'Everything: stores, plans, themes, settings',
  },
  {
    email: 'demo.themes@nexdrop.app',
    password: 'Demo@12345',
    name: 'Demo Theme Manager',
    role: 'THEME_MANAGER',
    label: 'Theme manager',
    description: 'Upload, review and publish themes',
  },
  {
    email: 'demo.support@nexdrop.app',
    password: 'Demo@12345',
    name: 'Demo Support',
    role: 'SUPPORT',
    label: 'Support',
    description: 'Orders, products, customers, store settings',
  },
] as const

const DEMO_EMAILS = new Set<string>(DEMO_ACCOUNTS.map((a) => a.email))

export function isDemoEmail(email?: string | null) {
  return Boolean(email && DEMO_EMAILS.has(email.toLowerCase()))
}
