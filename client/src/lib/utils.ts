import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getCategoryGradient(category: string): { bg: string; text: string; ring: string } {
  const norm = (category || '').toLowerCase();

  if (norm.includes('fiction') && !norm.includes('non') && !norm.includes('science')) {
    return { bg: 'from-purple-600 via-indigo-600 to-blue-700', text: 'text-purple-100', ring: 'ring-purple-400' };
  }
  if (norm.includes('classic')) {
    return { bg: 'from-amber-700 via-yellow-800 to-stone-900', text: 'text-amber-100', ring: 'ring-amber-500' };
  }
  if (norm.includes('non-fiction') || norm.includes('biography')) {
    return { bg: 'from-amber-600 via-orange-600 to-rose-700', text: 'text-amber-100', ring: 'ring-amber-400' };
  }
  if (norm.includes('science & nature') || norm.includes('science')) {
    return { bg: 'from-cyan-600 via-teal-600 to-emerald-700', text: 'text-cyan-100', ring: 'ring-cyan-400' };
  }
  if (norm.includes('technology') || norm.includes('computing')) {
    return { bg: 'from-blue-600 via-indigo-700 to-slate-900', text: 'text-blue-100', ring: 'ring-blue-400' };
  }
  if (norm.includes('engineering') || norm.includes('mathematics')) {
    return { bg: 'from-sky-700 via-blue-800 to-indigo-950', text: 'text-sky-100', ring: 'ring-sky-400' };
  }
  if (norm.includes('business') || norm.includes('economics')) {
    return { bg: 'from-emerald-600 via-teal-700 to-slate-900', text: 'text-emerald-100', ring: 'ring-emerald-400' };
  }
  if (norm.includes('self-help') || norm.includes('development')) {
    return { bg: 'from-rose-500 via-pink-600 to-indigo-700', text: 'text-pink-100', ring: 'ring-pink-400' };
  }
  if (norm.includes('philosophy') || norm.includes('religion') || norm.includes('psychology')) {
    return { bg: 'from-violet-700 via-purple-800 to-slate-900', text: 'text-violet-100', ring: 'ring-violet-400' };
  }
  if (norm.includes('art') || norm.includes('hobbies')) {
    return { bg: 'from-pink-600 via-rose-600 to-red-700', text: 'text-pink-100', ring: 'ring-pink-400' };
  }
  if (norm.includes('lifestyle')) {
    return { bg: 'from-lime-600 via-emerald-600 to-teal-800', text: 'text-lime-100', ring: 'ring-lime-400' };
  }
  if (norm.includes('children')) {
    return { bg: 'from-yellow-400 via-orange-500 to-red-500', text: 'text-yellow-100', ring: 'ring-yellow-300' };
  }
  if (norm.includes('young adult')) {
    return { bg: 'from-fuchsia-600 via-purple-600 to-pink-700', text: 'text-fuchsia-100', ring: 'ring-fuchsia-400' };
  }
  if (norm.includes('comic') || norm.includes('manga')) {
    return { bg: 'from-red-600 via-orange-600 to-amber-700', text: 'text-orange-100', ring: 'ring-orange-400' };
  }
  if (norm.includes('exam') || norm.includes('education')) {
    return { bg: 'from-blue-700 via-cyan-800 to-slate-900', text: 'text-cyan-100', ring: 'ring-cyan-400' };
  }
  if (norm.includes('language') || norm.includes('literature')) {
    return { bg: 'from-teal-600 via-emerald-700 to-indigo-900', text: 'text-teal-100', ring: 'ring-teal-400' };
  }
  if (norm.includes('law') || norm.includes('government')) {
    return { bg: 'from-slate-700 via-gray-800 to-zinc-950', text: 'text-slate-100', ring: 'ring-slate-400' };
  }
  if (norm.includes('indian')) {
    return { bg: 'from-orange-600 via-amber-600 to-emerald-800', text: 'text-amber-100', ring: 'ring-amber-400' };
  }
  if (norm.includes('preview') || norm.includes('audiobook')) {
    return { bg: 'from-indigo-600 via-violet-700 to-purple-900', text: 'text-indigo-100', ring: 'ring-indigo-400' };
  }
  if (norm.includes('magazine') || norm.includes('journal')) {
    return { bg: 'from-sky-600 via-blue-700 to-indigo-900', text: 'text-sky-100', ring: 'ring-sky-400' };
  }

  return {
    bg: 'from-indigo-600 via-blue-600 to-slate-800',
    text: 'text-indigo-100',
    ring: 'ring-indigo-400'
  };
}
