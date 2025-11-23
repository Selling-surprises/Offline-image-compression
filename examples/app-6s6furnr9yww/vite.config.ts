import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { miaodaDevPlugin } from "miaoda-sc-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), miaodaDevPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
