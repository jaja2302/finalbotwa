const puppeteer = require('puppeteer');
async function generateWithPuppeteer(url) {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: './chrome-win/chrome.exe',
      browserArgs: [
        '--disable-web-security',
        '--no-sandbox',
        '--disable-web-security',
        '--aggressive-cache-discard',
        '--disable-cache',
        '--disable-application-cache',
        '--disable-offline-load-stale-cache',
        '--disk-cache-size=0',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
      ],
    });

    const page = await browser.newPage();

    await page.goto(url);

    await new Promise(resolve => setTimeout(resolve, 10000));

    await browser.close();

    console.log(`Process completed for '${url}'`);
  } catch (error) {
    console.error(`Error processing '${url}':`, error);
  }
}

// Usage examples:
async function Generatedmaps() {
  await generateWithPuppeteer('https://srs-ssms.com/rekap_pdf/check_taksasi_get.php');
  console.log(`Taksasi generated Maps successfully`);
}
async function Generatedmapsest(est) {
 
  const url = `https://srs-ssms.com/rekap_pdf/check_taksasi_get.php?est=${est.toLowerCase()}`;
  await generateWithPuppeteer(url);
  console.log(`Taksasi generated successfully for taksasi '${est}'`);
}

async function GenerateTakestEST(est) {
  const url = `https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder_${est.toLowerCase()}.php`;
  await generateWithPuppeteer(url);
  console.log(`Taksasi generated successfully for taksasi '${est}'`);
}

async function GenDefaultTaksasi(est) {
  const url = `https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder.php?est=${est.toLowerCase()}`;
  await generateWithPuppeteer(url);
  console.log(`Taksasi generated successfully for taksasi '${est}'`);
}


async function GenerateTaksasi() {
 
  await generateWithPuppeteer('https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder.php');
  console.log(`Taksasi generated successfully`);

}

async function GetYoutubeurl() {
  try {
    const browser = await puppeteer.launch({
      headless:true,
      executablePath: './chrome-win/chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Navigate to YouTube
    await page.goto('https://www.youtube.com');
  
    // Type the search query and press Enter
    const searchQuery = 'bola voli';
    await page.type('input#search', searchQuery);
    await page.keyboard.press('Enter');
  
    // Wait for search results to load (adjust the selector and wait time as needed)
    await page.waitForSelector('#video-title', { timeout: 5000 });

    const firstVideoUrlHandle = await page.$('#video-title');
    const firstVideoUrl = await page.evaluate(video => video.href, firstVideoUrlHandle);

    // Close the YouTube page
    await page.close();

// Check if a valid URL is obtained
    if (firstVideoUrl) {
      // Construct the Google search URL with the YouTube video URL
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(firstVideoUrl)}`;

      // Open a new tab and navigate to the Google search URL with the video URL
      const newPage = await browser.newPage();
      await newPage.goto(googleSearchUrl);

      // Take a screenshot of the Google search results
      await newPage.screenshot({ path: 'google_search.png' });

      // Close the browser
      await browser.close();
      console.log(`YouTube search and Google search completed successfully`);
    } else {
      console.error('Unable to retrieve the YouTube video URL');
    }
    console.log(`YouTube search and Google search completed successfully`);
  } catch (error) {
    console.error(`Error:`, error);
  }
}

module.exports = { Generatedmapsest, Generatedmaps,GetYoutubeurl ,GenerateTaksasi ,GenerateTakestEST, GenDefaultTaksasi };
