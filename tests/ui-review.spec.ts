import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const reviewTarget = process.env.UI_REVIEW_TARGET ?? ".artifacts/ui-review";
const readmeMode = process.env.README_SCREENSHOTS === "true";

async function waitForImages(page: Page) {
  await page.waitForFunction(() =>
    Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
  );
}

async function capture(page: Page, filename: string) {
  await waitForImages(page);
  const outputDir = path.resolve(reviewTarget);
  await mkdir(outputDir, { recursive: true });
  await page.screenshot({
    path: path.join(outputDir, filename),
    fullPage: true,
  });
}

async function publishMacbookOrder(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Browse live sale snapshots with channel, section, and SKU-aware filters/i,
    }),
  ).toBeVisible();

  await page.getByPlaceholder("Search title or description").fill("MacBook");
  await page.getByPlaceholder("Search title or description").press("Enter");
  await expect(page.getByText("MacBook Pro 16 Creator Bundle")).toBeVisible();
  await page.getByRole("link", { name: /MacBook Pro 16 Creator Bundle/i }).click();
  await expect(
    page.getByRole("heading", { name: "MacBook Pro 16 Creator Bundle" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add snapshot to cart" }).click();

  await page.waitForURL("**/cart");
  await page.getByRole("button", { name: "Create order draft" }).click();
  await page.waitForURL("**/orders/*");

  await page.locator("#citizen-name").fill("Review Buyer");
  await page.locator("#citizen-mobile").fill("01099998888");
  await page.getByRole("button", { name: "Verify identity" }).click();
  await expect(page.getByRole("button", { name: "Publish order" })).toBeEnabled();

  await page.locator("#address-name").fill("Review Buyer");
  await page.locator("#address-mobile").fill("01099998888");
  await page.locator("#address-province").fill("Seoul");
  await page.locator("#address-city").fill("Seoul");
  await page.locator("#address-department").fill("Mapo-gu");
  await page.locator("#address-zip-code").fill("04147");
  await page.locator("#address-possession").fill("World Cup-ro 1");
}

test("desktop flow @ui-review", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByText("MacBook Pro 16 Creator Bundle")).toBeVisible();
  await capture(page, readmeMode ? "home.png" : "catalog-desktop.png");

  await page.getByRole("link", { name: /MacBook Pro 16 Creator Bundle/i }).click();
  await expect(
    page.getByRole("heading", { name: "MacBook Pro 16 Creator Bundle" }),
  ).toBeVisible();
  await capture(page, readmeMode ? "detail.png" : "product-desktop.png");

  await publishMacbookOrder(page);
  await page.getByRole("button", { name: "Publish order" }).click();
  await expect(page.getByText("Published delivery snapshot")).toBeVisible();
  await page.evaluate(() => {
    const toaster = document.querySelector("[data-sonner-toaster]");
    if (toaster instanceof HTMLElement) {
      toaster.style.display = "none";
    }
  });
  await capture(page, readmeMode ? "order-detail.png" : "order-desktop.png");
});

test("tablet layout @ui-review", async ({ page }) => {
  test.skip(readmeMode, "README screenshots only need curated desktop captures.");
  await page.setViewportSize({ width: 834, height: 1112 });
  await page.goto("/");
  await page.getByRole("button", { name: /Smart Phones/ }).click();
  await expect(page.getByText("iPhone 16 Pro Field Kit")).toBeVisible();
  await capture(page, "catalog-tablet.png");
});

test("mobile layout @ui-review", async ({ page }) => {
  test.skip(readmeMode, "README screenshots only need curated desktop captures.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Catalog" })).toBeVisible();
  await page.getByPlaceholder("Search title or description").fill("iPhone");
  await page.getByPlaceholder("Search title or description").press("Enter");
  await expect(page.getByText("iPhone 16 Pro Field Kit")).toBeVisible();
  await capture(page, "catalog-mobile.png");
});
