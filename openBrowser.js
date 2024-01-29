const puppeteer = require('puppeteer');
async function generateWithPuppeteer(url, maxRetries = 4) {
  let attempt = 1;
  let shouldRetry = false;

  while (attempt <= maxRetries) {
    console.log(`Attempt ${attempt}`);
    shouldRetry = false;

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
          shouldRetry = true;
        }
      })
      .on('requestfailed', async (request) => {
        console.log(`${request.failure().errorText} ${request.url()}`);
        if (request.failure().errorText.includes('500') || request.failure().errorText.includes('503')) {
          console.log(`Retrying due to request failure: ${request.failure().errorText}`);
          shouldRetry = true;
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

    // Close the browser after 5 seconds if status is not 500 or 503
    if (!shouldRetry) {
      setTimeout(async () => {
        await browser.close();
      }, 5000);
    }

    if (shouldRetry) {
      await browser.close();
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    } else {
      break; // Break the loop if the request is successful
    }
    
    attempt++;
  }
}

// Usage example:
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
