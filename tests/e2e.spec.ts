import { expect, test } from "@playwright/test";

test("guest session can join membership", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Browse live sale snapshots with channel, section, and SKU-aware filters/i,
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: /^Guest$/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("tab", { name: "Join" }).click();
  await page.getByLabel("Nickname").fill("Codex Shopper");
  await page.getByLabel("Email").fill("e2e-member@samchon.dev");
  await page.getByLabel("Password").fill("shopper123");
  await page.getByRole("button", { name: "Create member account" }).click();

  await expect(page.getByText("Membership created.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Codex Shopper/ })).toBeVisible();
});

test("catalog flow publishes an order", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Browse live sale snapshots with channel, section, and SKU-aware filters/i,
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Smart Phones/ }).click();
  await expect(page.getByText("iPhone 16 Pro Field Kit")).toBeVisible();
  await expect(page.getByText("MacBook Pro 16 Creator Bundle")).not.toBeVisible();

  await page.goto("/");
  await expect(page.getByText("MacBook Pro 16 Creator Bundle")).toBeVisible();
  await page.getByPlaceholder("Search title or description").fill("MacBook");
  await page.getByPlaceholder("Search title or description").press("Enter");
  await expect(page.getByText("MacBook Pro 16 Creator Bundle")).toBeVisible();

  await page.getByRole("link", { name: /MacBook Pro 16 Creator Bundle/i }).click();
  await expect(
    page.getByRole("heading", { name: "MacBook Pro 16 Creator Bundle" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add snapshot to cart" }).click();
  await page.waitForURL("**/cart");
  await expect(page.getByText("MacBook Pro 16 Creator Bundle")).toBeVisible();

  await page.getByRole("button", { name: "Create order draft" }).click();
  await page.waitForURL("**/orders/*");
  await expect(page.locator("h1")).toContainText("MacBook Pro 16 Creator Bundle");

  await page.locator("#citizen-name").fill("Kim Buyer");
  await page.locator("#citizen-mobile").fill("01055557777");
  await page.getByRole("button", { name: "Verify identity" }).click();
  await expect(page.getByText("Identity verified. You can now continue to publish the order.")).toBeVisible();

  await page.locator("#address-name").fill("Kim Buyer");
  await page.locator("#address-mobile").fill("01055557777");
  await page.locator("#address-province").fill("Seoul");
  await page.locator("#address-city").fill("Seoul");
  await page.locator("#address-department").fill("Gangnam-gu");
  await page.locator("#address-zip-code").fill("06123");
  await page.locator("#address-possession").fill("Teheran-ro 123");
  await expect(page.getByRole("button", { name: "Publish order" })).toBeEnabled();
  await page.getByRole("button", { name: "Publish order" }).click();

  await expect(page.getByText("Published delivery snapshot")).toBeVisible();
  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByText("MacBook Pro 16 Creator Bundle")).toBeVisible();
  await expect(page.getByText("Paid").first()).toBeVisible();
});
