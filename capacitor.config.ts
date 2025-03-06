import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.checklist.app',
  appName: 'Checklist App',
  webDir: '.next',
  server: {
    androidScheme: 'https',
    cleartext: true,
    url: 'http://localhost:3000'
  }
};

export default config;
