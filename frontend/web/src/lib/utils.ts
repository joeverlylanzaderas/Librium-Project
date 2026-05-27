// frontend/web/src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns'

// ── Tailwind class merger ─────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date formatting ───────────────────────────
export const formatDate = (date: string) =>
  format(parseISO(date), 'MMM d, yyyy')

export const formatDateTime = (date: string) =>
  format(parseISO(date), 'MMM d, yyyy h:mm a')

export const formatRelative = (date: string) =>
  formatDistanceToNow(parseISO(date), { addSuffix: true })

export const isOverdue = (dueDate: string) =>
  isPast(parseISO(dueDate))

export const daysUntilDue = (dueDate: string): number => {
  const diff = parseISO(dueDate).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ── Currency ──────────────────────────────────
export const formatCurrency = (amount: string | number) =>
  `₱${Number(amount).toFixed(2)}`

// ── Fine computation ──────────────────────────
export const computeFine = (dueDate: string, ratePerDay = 5): number => {
  const due = parseISO(dueDate)
  if (!isPast(due)) return 0
  const diffMs = Date.now() - due.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24)) * ratePerDay
}

// ── String helpers ────────────────────────────
export const initials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

export const truncate = (str: string, len = 40) =>
  str.length > len ? `${str.slice(0, len)}…` : str

// ── Role helpers ──────────────────────────────
export const isBorrower = (role: string) =>
  ['student', 'faculty'].includes(role)

export const isStaff = (role: string) =>
  ['admin', 'librarian'].includes(role)

export const isAdmin = (role: string) => role === 'admin'

export const roleLabel: Record<string, string> = {
  admin:     'Admin',
  librarian: 'Librarian',
  student:   'Student',
  faculty:   'Faculty',
}

// ── API error extractor ───────────────────────
export const extractApiError = (error: unknown): string => {
  if (!error || typeof error !== 'object') return 'An unexpected error occurred.'
  const err = error as Record<string, unknown>
  const data = err?.response
    ? (err.response as Record<string, unknown>)?.data
    : null
  if (!data) return (err.message as string) ?? 'An unexpected error occurred.'
  if (typeof data === 'string') return data
  const d = data as Record<string, unknown>
  // Django REST framework returns { field: ['msg'] } or { detail: 'msg' }
  if (d.detail) return String(d.detail)
  const firstKey = Object.keys(d)[0]
  if (firstKey) {
    const val = d[firstKey]
    return Array.isArray(val) ? val[0] : String(val)
  }
  return 'An unexpected error occurred.'
}