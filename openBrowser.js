const puppeteer = require('puppeteer');

async function Generatedmaps() {
  try {
    const browser = await puppeteer.launch({
      headless: false
    });

    const page = await browser.newPage();

    await page.goto('https://srs-ssms.com/rekap_pdf/check_taksasi_get.php');

    await new Promise(resolve => setTimeout(resolve, 10000));

    await browser.close();

    console.log(`Maps generated successfully`);
  } catch (error) {
    console.error(`Error generating maps:`, error);
  }
}

module.exports = { Generatedmaps };
