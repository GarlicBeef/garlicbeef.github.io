// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  // Replace with the real domain before deploying.
  site: 'https://example.org',
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: {
    ssr: { noExternal: ['gsap'] },
  },
});
