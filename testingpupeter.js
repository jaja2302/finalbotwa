const puppeteer = require('puppeteer');

async function checkContentWithRetry(attempts = 0) {
  if (attempts >= 2) {
    console.log('Maximum retry attempts reached. Exiting...');
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: './chrome-win/chrome.exe',
    headless: false,
  });

  const page = await browser.newPage();

  // Wait for the page to load completely
  await page.goto('https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder.php?est=bde');
  await page.waitForTimeout(5000); // Adjust the delay time as needed

  // Extracting the content
  const content = await page.evaluate(() => {
    const element = document.querySelector('th[colspan="16"].text-center');
    if (element && element.textContent.trim() === 'LAPORAN TAKSASI PANEN') {
      return true;
    }
    return false;
  });

  if (content) {
    console.log('Content found: LAPORAN TAKSASI PANEN');
  } else {
    console.log('Content not found: LAPORAN TAKSASI PANEN');
  }

  // Close the browser
  await browser.close();

  // If content not found, retry
  if (!content) {
    console.log('Retrying...');
    await checkContentWithRetry(attempts + 1);
  }
}

// Call the function to start checking content
checkContentWithRetry();
