import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './src/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
  ],
}).catch((err) => console.error(err));

// Register the automated PWA service worker
// We use a @ts-ignore because TypeScript might not recognize the virtual module
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const updateSW = registerSW({
      onNeedRefresh() {
        // Create a wrapper object matching the ServiceWorker interface expected by the Angular component.
        // When the component calls waitingWorker.postMessage({ type: 'SKIP_WAITING' }),
        // we trigger the updateSW(true) function provided by vite-plugin-pwa.
        const fakeWorker = {
          postMessage: (msg: any) => {
            if (msg && msg.type === 'SKIP_WAITING') {
              updateSW(true);
            }
          }
        };
        window.dispatchEvent(new CustomEvent('sw-update-available', { detail: fakeWorker }));
      },
      onOfflineReady() {
        console.log('App is ready to work offline');
      },
    });
  });
}

// AI Studio always uses an `index.tsx` file for all project types.
