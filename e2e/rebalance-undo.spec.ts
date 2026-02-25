import {expect, test} from '@playwright/test';

test('undo is enabled after clearing target weight and restores the value on undo', async ({page}) => {
    await page.addInitScript(() => {
        window.localStorage.clear();
    });

    await page.goto('/rebalance');

    const firstAsset = page.locator('.asset-card').first();
    const targetWeightInput = firstAsset.locator('.asset-card__fields .form-field').nth(1).locator('input');
    const undoButton = page.getByRole('button', {name: /undo|rückgängig/i});

    const initialValue = await targetWeightInput.inputValue();
    expect(initialValue.length).toBeGreaterThan(0);

    await targetWeightInput.click();
    await targetWeightInput.press('Control+a');
    await targetWeightInput.press('Backspace');
    await targetWeightInput.press('Tab');

    await expect(undoButton).toBeEnabled();

    await undoButton.click();
    await expect(targetWeightInput).toHaveValue(initialValue);
});
