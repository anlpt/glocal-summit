import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vercel serves from root, so base is '/'.
export default defineConfig({
  plugins: [react()],
  base: '/',
});
