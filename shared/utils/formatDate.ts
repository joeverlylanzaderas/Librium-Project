import { format, formatDistanceToNow, isPast } from 'date-fns';

export const formatDate = (date: string) =>
  format(new Date(date), 'MMM d, yyyy');

export const formatDateTime = (date: string) =>
  format(new Date(date), 'MMM d, yyyy h:mm a');

export const formatRelative = (date: string) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const isOverdue = (dueDate: string) => isPast(new Date(dueDate));
