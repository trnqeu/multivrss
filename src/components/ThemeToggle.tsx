'use client';

import { useSyncExternalStore } from 'react';

function getSnapshot(): boolean {
  return document.documentElement.classList.contains('dark');
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(() => callback());
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
}

export default function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', !isDark);
    try { localStorage.setItem('theme', next); } catch {}
  }

  return (
    <button
      onClick={toggle}
      className="bg-transparent border-0 p-0 text-foreground/60 hover:text-foreground transition-colors cursor-pointer text-[17px] leading-none inline-flex items-center"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? '☀' : '☾'}
    </button>
  );
}
