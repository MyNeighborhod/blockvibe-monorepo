import { expect, type Page } from "@playwright/test"

/** Resident checkbox in the Email Broadcaster scrollable list. */
export function residentCheckbox(page: Page, email: string) {
  return page.locator(`input[id="resident-checkbox-${email}"]`)
}

export async function expectResidentListed(page: Page, email: string): Promise<void> {
  const checkbox = residentCheckbox(page, email)
  await checkbox.scrollIntoViewIfNeeded()
  await expect(checkbox).toBeVisible({ timeout: 15000 })
}

export async function expectResidentNotListed(page: Page, email: string): Promise<void> {
  await expect(residentCheckbox(page, email)).toHaveCount(0)
}
