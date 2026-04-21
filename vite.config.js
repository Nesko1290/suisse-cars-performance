import { resolve } from 'path';

export default {
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        vehicules: resolve(__dirname, 'vehicules.html'),
        vehicule: resolve(__dirname, 'vehicule.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
};
