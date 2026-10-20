// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://garlicbeef.github.io',
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: {
    ssr: { noExternal: ['gsap'] },
  },
});
