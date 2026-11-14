export const DEV = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev');
