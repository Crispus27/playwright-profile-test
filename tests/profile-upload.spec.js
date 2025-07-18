const { test, expect } = require('@playwright/test');
const path = require('path');

test('Connexion et upload photo sur WTTJ', async ({ page }) => {
    await page.goto('https://www.welcometothejungle.com/fr/me/profile');

    if (await page.isVisible('text=OK pour moi')) {
        await page.click('text=OK pour moi');
    }
    await page.waitForSelector('input[name="email_login"]');
    await page.waitForSelector('input[name="password"]');
    await page.fill('input[name="email_login"]', 'crispus@YOPmail.com');
    await page.fill('input[name="password"]', 'inqom@YOPmail.com');
    const [loginResponse] = await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/api/v1/sessions') && resp.status() === 201),
        page.click('[data-testid="login-button-submit"]')
    ]);
    const loginJson = await loginResponse.json();
    expect(loginJson).toHaveProperty('user');
    await page.waitForSelector('button:has-text("Modifier")');
    await page.click('button:has-text("Modifier")');
    await page.waitForSelector('text=Informations personnelles');

    let fileChooserPromise;
    // Cas 1 : le bouton "Importer une image" est présent
    if (await page.isVisible('text=Importer une image')) {
        fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=Importer une image');
    }
    // Cas 2 : le bouton stylo (icône "Edit") est visible
    else if (await page.isVisible('svg[alt="Edit"]')) {
        fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('svg[alt="Edit"]');
    }

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/assets/visma_inqom.png');
    const [saveResponse] = await Promise.all([
        page.waitForResponse(resp =>
            resp.url().includes('/api/v1/registrations') && resp.request().method() === 'PUT'
        ),
        page.click('button:has-text("Enregistrer")')
    ]);
    expect(saveResponse.status()).toBe(200);
    const body = await saveResponse.json()
    expect(typeof body.user.avatar.url).toBe("string");
});

