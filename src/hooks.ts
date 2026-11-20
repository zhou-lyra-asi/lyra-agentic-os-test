import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { os } from './core';

export function useOS() {
  return useSyncExternalStore(os.subscribe, os.getSnapshot, os.getSnapshot);
}

export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function downloadFile(name: string, content: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function useToast(): { toast: string | null; show: (s: string) => void } {
  const [toast, setToast] = useState<string | null>(null);
  const show = useCallback((s: string) => {
    setToast(s);
    window.setTimeout(() => setToast(null), 2600);
  }, []);
  return { toast, show };
}
