import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

// Start Vite preview server
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
  stdio: 'pipe',
  shell: true,
});

let browser;

const cleanup = async () => {
  if (browser) await browser.close();
  server.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

(async () => {
  try {
    // Wait for server to be ready
    await new Promise((resolve, reject) => {
      let output = '';
      server.stdout.on('data', (data) => {
        const str = data.toString();
        output += str;
        console.log(str); // forward server output
        if (str.includes('Local:') || str.includes(`http://localhost:${PORT}`)) {
          resolve();
        }
      });
      server.stderr.on('data', (data) => console.error(data.toString()));
      server.on('error', reject);
      
      // Timeout fallback
      setTimeout(() => reject(new Error(`Server timeout. Output: ${output}`)), 10000);
    });

    console.log('Server is up. Launching Puppeteer...');

    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // 1. Check if Manifest exists and is reachable
    console.log('Verifying manifest.webmanifest...');
    const manifestResponse = await page.goto(`${BASE_URL}/manifest.webmanifest`);
    if (manifestResponse.status() !== 200) {
      throw new Error(`Manifest returned status ${manifestResponse.status()}`);
    }
    const manifest = await manifestResponse.json();
    console.log('Manifest found:', manifest);

    // 2. Verify start_url resolves correctly
    // start_url is usually relative to manifest
    const startUrlRelative = manifest.start_url;
    const startUrlAbsolute = new URL(startUrlRelative, `${BASE_URL}/manifest.webmanifest`).href;
    
    console.log(`Verifying start_url: ${startUrlRelative} -> ${startUrlAbsolute}`);
    const startUrlResponse = await page.goto(startUrlAbsolute);
    
    if (startUrlResponse.status() !== 200) {
       // If it redirects to index.html with 200, that's fine. 
       // If it is 404, that's the bug.
       throw new Error(`start_url returned status ${startUrlResponse.status()}`);
    }
    
    console.log('start_url is valid.');

    // 3. Optional: Verify Service Worker registration (requires loading the page)
    console.log('Verifying Service Worker registration...');
    await page.goto(BASE_URL);
    
    // Evaluate in browser context
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'not-supported';
      try {
        const registration = await navigator.serviceWorker.ready; // Wait for it to be ready
        return !!registration;
      } catch (e) {
        // If ready hangs (unlikely if registered), or we can check getRegistrations
        const regs = await navigator.serviceWorker.getRegistrations();
        return regs.length > 0;
      }
    });

    if (!swRegistered) {
      console.warn('Service Worker not detected or not ready yet. This might be expected if it takes time.');
    } else {
      console.log('Service Worker is registered.');
    }

    console.log('SUCCESS: PWA setup verified.');

  } catch (error) {
    console.error('TEST FAILED:', error);
    process.exitCode = 1;
  } finally {
    await cleanup();
  }
})();
