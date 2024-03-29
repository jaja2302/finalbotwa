const puppeteer = require('puppeteer');
const axios = require('axios');
async function generateWithPuppeteer(url, maxRetries = 3) {
  let attempt = 1;

  while (attempt <= maxRetries) {
    console.log(`Attempt ${attempt}`);
    let contentNotFoundCount = 0;

    const browser = await puppeteer.launch({
      executablePath: '../chrome-win/chrome.exe',
      headless: 'new',
    });

    const page = await browser.newPage();

    // Navigate to the URL
    await page.goto(url);

    // Wait for the page to load completely
    await page.waitForTimeout(5000); // Adjust the delay time as needed

    // Get all open pages (tabs)
    const allPages = await browser.pages();

    // Iterate through each open tab
    for (let i = 0; i < allPages.length; i++) {
      const currentPage = allPages[i];
      await currentPage.bringToFront();
      await currentPage.waitForTimeout(2000); // Wait for a short delay before evaluating the content
      const content = await currentPage.content();
      if (!content.includes('<h3>Preview Berikut adalah Gambar:</h3>')) {
        console.log(`Tab ${i + 1}: Content not found`);
        contentNotFoundCount++;
      } else {
        console.log(`Tab ${i + 1}: Content found`);
      }
    }
    await browser.close();
    if (contentNotFoundCount > 3) {
      console.log('Content not found in more than 3 tabs. Retrying...');
      attempt++;
    } else {
      console.log('Content found or not found in 3 or fewer tabs. Waiting 5 seconds before closing...');
      
      break;
    }
    
  }

  if (attempt > maxRetries) {
    console.log('Maximum retry attempts reached. Exiting...');
  }
}

async function generatetpdf(url, attempts = 0) {
  if (attempts >= 4) {
    console.log('Maximum retry attempts reached. Exiting...');
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: './chrome-win/chrome.exe',
    headless: 'new',
  });

  const page = await browser.newPage();

  try {
    // Wait for the page to load completely
    await page.goto(url);
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
      console.log('Retrying...');
      return await generatetpdf(url, attempts + 1); // Retry if content not found
    }
  } catch (error) {
    console.error('Error fetching files:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Usage example:
async function Generatedmaps() {
  await generateWithPuppeteer('https://srs-ssms.com/rekap_pdf/check_taksasi_get.php');
  // console.error(`Taksasi generated Maps successfully`);
}

  
async function Generatedmapsest(estate, datetime) {
  const maxRetries = 5;
  let retryCount = 0;
  while (retryCount < maxRetries) {
      try {
          const formData = new URLSearchParams();
          formData.append('estate', estate);
          formData.append('datetime', datetime);

          const response = await axios.post('https://digi-kappa-lac.vercel.app/api/run', formData, {
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded' // Set the proper content type for form data
              }
          });

          console.log('Response data:', response.data); // Access the response data
          // await sock.sendMessage(idgroup, { text: `Map ${estate} berhasil di generate` });
          return response.data;
      } catch (error) {
          console.log('Error fetching data:', error);
          // await sock.sendMessage(idgroup, { text: `Map ${estate} gagal di generate ${error.status}`});
          retryCount++;
          if (retryCount === maxRetries) {
              // await sock.sendMessage(idgroup, { text: `Terjadi kesalahan menarik ${estate} yang gagal di generate`});
              throw error;
          } else {
              console.log(`Retrying (${retryCount}/${maxRetries})...`);
              // await sock.sendMessage(idgroup, { text: `Menarik ulang Map ${estate} yang gagal di generate`});
          }
      }
  }
}

async function GenerateTakestEST(est) {
  const url = `https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder_${est.toLowerCase()}.php`;
  await generatetpdf(url);
  // console.error(`Taksasi generated successfully for taksasi '${est}'`);
}

async function GenDefaultTaksasi(est) {
  let attempts = 0;
  const maxAttempts = 5;
  const retryDelay = 3000; // 3 seconds in milliseconds

  while (attempts < maxAttempts) {
      try {
          const response = await axios.get(`https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder.php?est=${est.toLowerCase()}`);
          // await sock.sendMessage(idgroup, { text: `Pdf berhasil di generate ${est}` })
          return response;
      } catch (error) {
          console.error('Error fetching data:', error);
          attempts++;
          if (attempts < maxAttempts) {
              console.log(`Retrying attempt ${attempts} for ${est}`);
              // await sock.sendMessage(idgroup, { text: `Mengulang Generate PDF ${est}` })
              await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            console.log(`Retrying attempt ${attempts} for ${est}`);
              throw error;
          }
      }
  }
}
async function GenerateTaksasi() {
 
  await generatetpdf('https://srs-ssms.com/rekap_pdf/pdf_taksasi_folder.php');
  // console.error(`Taksasi generated successfully`);

}

async function GetYoutubeurl() {
  try {
    const browser = await puppeteer.launch({
      headless:true,
      executablePath: '../chrome-win/chrome.exe',
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
