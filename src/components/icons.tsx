import { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconOverview(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.8" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1.8" />
      <rect x="3.5" y="13" width="7" height="7.5" rx="1.8" />
    </IconBase>
  )
}

export function IconOrders(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7.5 7.25h9" />
      <path d="M7.5 12h5.5" />
      <path d="M7.5 16.75h3.5" />
      <path d="M5.25 4.5h13.5A1.75 1.75 0 0 1 20.5 6.25v13.2a.9.9 0 0 1-1.38.76l-2.37-1.48-2.2 1.4a1 1 0 0 1-1.1 0l-2.2-1.4-2.37 1.48a.9.9 0 0 1-1.38-.76V6.25A1.75 1.75 0 0 1 5.25 4.5Z" />
    </IconBase>
  )
}

export function IconProducts(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 8.2 12 4.5l7.5 3.7v7.6L12 19.5 4.5 15.8V8.2Z" />
      <path d="M12 12.2 19.5 8.5" />
      <path d="M12 12.2V19.5" />
      <path d="M12 12.2 4.5 8.5" />
      <path d="M8.2 6.35 15.8 10.1" />
    </IconBase>
  )
}

export function IconCustomers(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.7 19.2c.5-3.1 2.7-5 5.3-5s4.8 1.9 5.3 5" />
      <circle cx="16.4" cy="8.6" r="2.3" />
      <path d="M15.2 14.4c2 .3 3.7 1.7 4.3 4.2" />
    </IconBase>
  )
}

export function IconAnalytics(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 19.5h16" />
      <path d="M5.5 15.2 9.2 11l3.1 3.1 6.2-7.6" />
      <path d="M15.4 6.5h3.1v3.1" />
    </IconBase>
  )
}

export function IconTheme(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4.5v2.2" />
      <path d="M12 17.3v2.2" />
      <path d="M6.7 6.7l1.55 1.55" />
      <path d="M15.75 15.75 17.3 17.3" />
      <path d="M4.5 12h2.2" />
      <path d="M17.3 12h2.2" />
      <path d="M6.7 17.3l1.55-1.55" />
      <path d="M15.75 8.25 17.3 6.7" />
      <circle cx="12" cy="12" r="3.1" />
    </IconBase>
  )
}

export function IconSettings(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 12a7.4 7.4 0 0 0-.07-1l1.67-1.3-1.6-2.77-2.03.62a7.6 7.6 0 0 0-1.73-1L15.4 4.5h-3.2l-.24 2.05a7.6 7.6 0 0 0-1.73 1l-2.03-.62-1.6 2.77L8.27 11a7.4 7.4 0 0 0 0 2l-1.67 1.3 1.6 2.77 2.03-.62a7.6 7.6 0 0 0 1.73 1l.24 2.05h3.2l.24-2.05a7.6 7.6 0 0 0 1.73-1l2.03.62 1.6-2.77L19.33 13c.05-.33.07-.66.07-1Z" />
    </IconBase>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.2" />
      <path d="M20 20l-3.5-3.5" />
    </IconBase>
  )
}

export function IconBell(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6.4 9.6a5.6 5.6 0 1 1 11.2 0c0 4.1 1.4 5.4 1.4 5.4H5s1.4-1.3 1.4-5.4Z" />
      <path d="M10 18.6a2 2 0 0 0 4 0" />
    </IconBase>
  )
}

export function IconHelp(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M9.6 9.5a2.4 2.4 0 1 1 3.3 2.22c-.7.34-1.15.9-1.15 1.68V14" />
      <path d="M12 16.7h.01" />
    </IconBase>
  )
}

export function IconUser(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8.2" r="3.2" />
      <path d="M5.4 19.2c.8-3.4 3.2-5.1 6.6-5.1s5.8 1.7 6.6 5.1" />
    </IconBase>
  )
}

export function IconLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5.2 8.4 12 4.6l6.8 3.8v7.4L12 19.6 5.2 15.8V8.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8.4 10.1 12 12.1l3.6-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 12.1V16.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
