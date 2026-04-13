const express = require('express');
const { chromium } = require('playwright');
const app = express();
app.use(express.json());

app.post('/quote', async (req, res) => {
  const data = req.body;
  console.log('Received quote request for:', data['Customer Name']);
  console.log('Full data received:', JSON.stringify(data));

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://auwebship.inxpress.com/imcs_au/login');
    await page.getByRole('link', { name: 'Admin Login' }).click();
    await page.getByPlaceholder('Franchise #').fill('125');
    await page.locator('#id_userMo_userName').click();
    await page.locator('#id_userMo_userName').fill('milan gordhan');
    await page.locator('#id_userMo_password').click();
    await page.locator('#id_userMo_password').fill('Simran2022');
    await page.getByText('Sign in').click();
    await page.waitForTimeout(3000);
    await page.goto('https://auwebship.inxpress.com/imcs_au/franchise/customer/view');
    await page.waitForTimeout(2000);
    console.log('On customer list page');

    await page.getByRole('textbox', { name: 'Customer #' }).click();
    await page.getByRole('textbox', { name: 'Customer #' }).fill(String(data['Customer #']));
    await page.getByRole('button').click();
    await page.waitForSelector('table tbody tr:first-child', { timeout: 30000 });
    await page.waitForTimeout(5000);

    const debugScreenshot = await page.screenshot({ fullPage: true, type: 'png' });
    await browser.close();
    res.json({
      success: false,
      debug: true,
      screenshot: debugScreenshot.toString('base64'),
      error: 'debug screenshot before click'
    });
    return;

  } catch (error) {
    console.error('ERROR:', error.message);
    if (browser) await browser.close();
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/test', async (req, res) => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://example.com');
    const title = await page.title();
    await browser.close();
    res.json({ success: true, title: title });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Webship agent running on port 3000');
});