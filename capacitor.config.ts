import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.doomlings.companion',
  appName: 'DOOMlings Companion',
  webDir: 'out',
  
  server: {
    hostname: 'localhost',
    androidScheme: 'https'
  },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a1a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a1a',
    },
    
    Preferences: {
      group: 'doomlings_data'
    },
  },
  
  android: {
    allowMixedContent: true,
    captureInput: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;