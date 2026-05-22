import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aethermark.infinitedimensionalchess',
  appName: 'Infinite Dimensional Chess',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0c0c10',
      showSpinner: false
    }
  }
};

export default config;
