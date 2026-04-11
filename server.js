const express = require('express');
const { chromium } = require('playwright');
const app = express();
app.use(express.json());

app.post('/quote', async (req, res) => {
  const data = req.body;
  console.log('Received quote request for:', data['Customer Name']);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://auwebship.inxpress.com/imcs_au/login', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: 'Admin Login' }).click();
    await page.waitForTimeout(1000);

    await page.getByPlaceholder('Franchise #').fill('125');
    await page.locator('#id_userMo_userName').fill('milan gordhan');
    await page.locator('#id_userMo_password').fill('Simran2022');
    await page.getByText('Sign in').click();
    await page.waitForTimeout(5000);
    console.log('Logged in');

    await page.getByRole('textbox', { name: 'Customer #' }).fill(String(data['Customer #']));
    await page.getByRole('button').click();
    await page.waitForTimeout(2000);

    await page.locator('table tbody tr:first-child td:last-child a').first().click();
    await page.waitForTimeout(3000);
    console.log('Customer account opened');

    const cancelBtn = page.locator('button:has-text("Cancel")');
    if (await cancelBtn.count() > 0) {
      await cancelBtn.first().click();
      await page.waitForTimeout(1000);
    }

    await page.getByRole('link', { name: 'Quick Quote' }).click();
    await page.waitForTimeout(2000);
    await page.getByText('Domestic', { exact: true }).click();
    await page.waitForTimeout(1000);
    console.log('Quick Quote page ready');

    await page.locator('#id_easyShipMo_senderCity').dblclick();
    await page.locator('#id_easyShipMo_senderCity').fill(String(data['Origin City']));
    await page.locator('#id_easyShipMo_senderStateCode').fill(String(data['Origin State']));
    await page.locator('#id_easyShipMo_senderPostalCode').fill(String(data['Origin Post Code']));
    console.log('Origin filled');

    await page.locator('#id_easyShipMo_receiverCity').fill(String(data['Destination City']));
    await page.locator('#id_easyShipMo_receiverStateCode').fill(String(data['Destination State']));
    await page.locator('#id_easyShipMo_receiverPostalCode').fill(String(data['Destination Post Code']));
    console.log('Destination filled');

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

    res.json({
      success: true,
      customerName: data['Customer Name'],
      screenshot: screenshot.toString('base64')
    });
    console.log('Done - screenshot returned');

  } catch (error) {
    await browser.close();
    console.error('Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Webship agent running on port 3000');
});