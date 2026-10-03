import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional class lists and de-duplicates conflicting Tailwind
 * utilities (the later one wins), e.g.
 *   cn('px-2', condition && 'px-4')  ->  'px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
