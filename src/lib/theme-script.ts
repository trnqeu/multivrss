// Single source of truth for the inline theme-init script.
// Its exact content is hashed in next.config.ts to allow it under a
// hash-based CSP script-src (see the comment there for why hash-based
// instead of a per-request nonce).
export const THEME_INIT_SCRIPT =
  `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`;
