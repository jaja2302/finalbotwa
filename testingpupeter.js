const puppeteer = require('puppeteer');

(async () => {
  async function fetchDataWithRetries(url, maxRetries = 4) {
    let attempt = 1;

    while (attempt <= maxRetries) {
      console.log(`Attempt ${attempt}`);
      
      const browser = await puppeteer.launch({
        executablePath: './chrome-win/chrome.exe',
        headless: false,
      });

      const page = await browser.newPage();

      // Event listener for network logs
      page
        .on('response', async (response) => {
          console.log(`${response.status()} ${response.url()}`);
          if (response.status() === 500 || response.status() === 503) {
            console.log(`Retrying due to status code: ${response.status()}`);
            attempt++;
            await browser.close();
            return fetchDataWithRetries(url, maxRetries);
          }
        })
        .on('requestfailed', async (request) => {
          console.log(`${request.failure().errorText} ${request.url()}`);
          if (request.failure().errorText.includes('500') || request.failure().errorText.includes('503')) {
            console.log(`Retrying due to request failure: ${request.failure().errorText}`);
            attempt++;
            await browser.close();
            return fetchDataWithRetries(url, maxRetries);
          }
        });

      // Navigate to the URL
      await page.goto(url);

      // Your code inside page.evaluate()
      await page.evaluate(() => {
        console.log('hello', 5, { foo: 'bar' });
      });

      // Wait for some time to ensure the network logs are captured
      await page.waitForTimeout(2000);

      // Close the browser
      await browser.close();

      break; // Break the loop if the request is successful
    }
  }

  // Usage
  const url = 'https://srs-ssms.com/rekap_pdf/check_taksasi_get.php';
  await fetchDataWithRetries(url, 4);
})();
