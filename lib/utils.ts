import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatCurrency = (v: number, currency = 'USD') =>
  new Intl.NumberFormat('en-ZW', { style: 'currency', currency, minimumFractionDigits: 2 }).format(v);

export const formatDate = (d: string | Date) => format(new Date(d), 'dd MMM yyyy, HH:mm');
export const formatDateShort = (d: string | Date) => format(new Date(d), 'dd MMM yyyy');
export const formatRelative = (d: string | Date) => formatDistanceToNow(new Date(d), { addSuffix: true });

export const deviceStatusBadge = (s: string) => ({
  Active: 'green', Blocked: 'yellow', Revoked: 'red',
} as Record<string, string>)[s] ?? 'gray';

export const companyStatusBadge = (s: string) => s === 'Active' ? 'green' : 'red';

export const fiscalDayStatusLabel = (s: number) =>
  ['Closed','Open','Closing…','Close Failed'][s] ?? 'Unknown';

export const receiptTypeLabel = (t: number) =>
  ['Fiscal Invoice','Credit Note','Debit Note'][t] ?? 'Unknown';

export const deviceModeLabel = (m: number) => m === 0 ? 'Online' : 'Offline';
