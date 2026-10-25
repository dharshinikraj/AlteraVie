import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alteravie.app',
  appName: 'AlteraVie',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
