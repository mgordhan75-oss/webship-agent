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

    const selectors = [
      'table tbody tr:first-child td:last-child a',
      'table tr:nth-child(2) td:last-child a',
      '.table tbody tr:first-child a',
      'tbody tr a',
      'table a'
    ];

    let clicked = false;
    for (const selector of selectors) {
      try {
        const el = page.locator(selector).first();
        const count = await el.count();
        if (count > 0) {
          await el.click();
          clicked = true;
          console.log('Clicked with selector:', selector);
          break;
        }
      } catch (e) {
        console.log('Selector failed:', selector);
      }
    }

    if (!clicked) {
      throw new Error('Could not find customer login link');
    }

    await page.waitForTimeout(3000);
    console.log('Customer account opened');

    const cancelBtn = page.locator('button:has-text("Cancel")');
    if (await cancelBtn.count() > 0) {
      await cancelBtn.first().click();
      await page.waitForTimeout(1000);
    }

    await page.getByRole('link', { name: 'Quick Quote' }).click();
    await page.waitForTimeout(2000);
    console.log('Quick Quote page ready');

    await page.getByText('Domestic', { exact: true }).click();
    await page.locator('#id_easyShipMo_senderCity').dblclick();
    await page.locator('#id_easyShipMo_senderCity').fill(String(data['Origin City']));
    await page.locator('#id_easyShipMo_senderStateCode').click();
    await page.locator('#id_easyShipMo_senderStateCode').fill(String(data['Origin State']));
    await page.locator('#id_easyShipMo_senderPostalCode').click();
    await page.locator('#id_easyShipMo_senderPostalCode').fill(String(data['Origin Post Code']));
    console.log('Origin filled');

    await page.locator('#id_easyShipMo_receiverCity').click();
    await page.locator('#id_easyShipMo_receiverCity').fill(String(data['Destination City']));
    await page.locator('#id_easyShipMo_receiverStateCode').click();
    await page.locator('#id_easyShipMo_receiverStateCode').fill(String(data['Destination State']));
    await page.locator('#id_easyShipMo_receiverPostalCode').click();
    await page.locator('#id_easyShipMo_receiverPostalCode').fill(String(data['Destination Post Code']));
    console.log('Destination filled');

    await page.getByRole('textbox', { name: 'Weight' }).click();
    await page.getByRole('textbox', { name: 'Weight' }).fill(String(data['Weight']));
    await page.getByRole('textbox', { name: 'Weight' }).press('Tab');
    await page.getByRole('textbox', { name: 'Length' }).fill(String(data['Length']));
    await page.getByRole('textbox', { name: 'Length' }).press('Tab');
    await page.getByRole('textbox', { name: 'Width' }).fill(String(data['Width']));
    await page.getByRole('textbox', { name: 'Width' }).press('Tab');
    await page.getByRole('textbox', { name: 'Height' }).fill(String(data['Height']));
    await page.getByRole('textbox', { name: 'Height' }).press('Tab');
    await page.getByRole('textbox', { name: 'Quantity' }).fill(String(data['Quantity']));
    console.log('Package info filled');

    await page.getByRole('button', { name: ' Get my quote estimate' }).click();
    await page.waitForTimeout(15000);
    console.log('Quote results loaded');

    const screenshot = await page.screenshot({ fullPage: true, type: 'png' });
    await browser.close();
    console.log('Done - screenshot taken');

    res.json({
      success: true,
      customerName: data['Customer Name'],
      customerNumber: data['Customer #'],
      email: data['email'],
      screenshot: screenshot.toString('base64')
    });

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