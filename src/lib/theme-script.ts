// Single source of truth for the inline theme-init script, run before
// paint (in src/app/layout.tsx <head>) to avoid a flash of the wrong theme.
export const THEME_INIT_SCRIPT =
  `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`;
