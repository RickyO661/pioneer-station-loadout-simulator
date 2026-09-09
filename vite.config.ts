import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages publishes this project below /pioneer-station-loadout-simulator/.
export default defineConfig({
  base: '/pioneer-station-loadout-simulator/',
  plugins: [react()],
});
