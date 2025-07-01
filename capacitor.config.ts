import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.doomlings.companion',
  appName: 'DOOMlings Companion',
  webDir: 'out',
  server: {
    hostname: 'localhost',
    androidScheme: 'https'
  }
};

export default config; 