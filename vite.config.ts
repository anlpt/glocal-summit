import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this project site under /glocal-summit/; Vercel/local
// serve from root. The Pages workflow sets GITHUB_PAGES=true.
const base = process.env.GITHUB_PAGES === 'true' ? '/glocal-summit/' : '/';

export default defineConfig({
  plugins: [react()],
  base,
});
