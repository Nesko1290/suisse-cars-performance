import { resolve } from 'path';

// Base is '/' for Hostinger (domain root) or '/suisse-cars-performance/' for GitHub Pages.
// Override at build time with BASE env var, e.g. BASE=/suisse-cars-performance/ npm run build.
const base = process.env.BASE || '/';

export default {
  base,
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        vehicules: resolve(__dirname, 'vehicules.html'),
        vehicule: resolve(__dirname, 'vehicule.html'),
        admin: resolve(__dirname, 'admin.html'),
        services: resolve(__dirname, 'services.html'),
        rechargeClim: resolve(__dirname, 'recharge-clim.html'),
        pneus: resolve(__dirname, 'pneus.html'),
      },
    },
  },
};
