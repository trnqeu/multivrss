'use client';

import { useState } from 'react';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch {}
  }

  return (
    <button
      onClick={toggle}
      className="bg-transparent border-0 p-0 text-foreground/60 hover:text-foreground transition-colors cursor-pointer text-[13px] leading-none inline-flex items-center"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '☾' : '☀'}
    </button>
  );
}
