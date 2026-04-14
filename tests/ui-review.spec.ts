import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test, type Browser, type Page } from "@playwright/test";

const reviewTarget = process.env.UI_REVIEW_TARGET ?? ".artifacts/ui-review";
const readmeMode = process.env.README_SCREENSHOTS === "true";
const appBaseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? "3000"}`;
const featuredProductName = readmeMode
  ? "Apple MacBook Pro"
  : "MacBook Pro 16 Creator Bundle";

if (readmeMode) {
  if (process.env.NEXT_PUBLIC_SHOPPING_API_SIMULATE !== "false") {
    throw new Error("README screenshots must run with NEXT_PUBLIC_SHOPPING_API_SIMULATE=false.");
  }
  if (process.env.SHOPPING_API_SIMULATE !== "false") {
    throw new Error("README screenshots must run with SHOPPING_API_SIMULATE=false.");
  }
}

function appUrl(pathname: string) {
  return new URL(pathname, appBaseUrl).toString();
}

async function waitForImages(page: Page) {
  await page.waitForFunction(() =>
    Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
  );
}

async function capture(page: Page, filename: string) {
  await waitForImages(page);
  const outputDir = path.resolve(reviewTarget);
  await mkdir(outputDir, { recursive: true });
  await hideToaster(page);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: path.join(outputDir, filename),
    fullPage: !readmeMode,
  });
}

async function hideToaster(page: Page) {
  await page.evaluate(() => {
    const toaster = document.querySelector("[data-sonner-toaster]");
    if (toaster instanceof HTMLElement) {
      toaster.style.display = "none";
    }
  });
}

async function openSellerConsole(page: Page) {
  await page.goto(appUrl("/seller"));
  const sellerHeading = page.getByRole("heading", {
    name: /Operate sales and watch paid orders from one surface/i,
  });
  if (!(await sellerHeading.isVisible().catch(() => false))) {
    if (readmeMode) {
      const response = await page.context().request.post(appUrl("/api/seller/session/login"), {
        data: {
          email: "robot@nestia.io",
          password: "samchon",
        },
      });
      expect(response.ok()).toBeTruthy();
      await page.goto(appUrl("/seller"));
    } else {
      await page.locator("#seller-email").fill("robot@nestia.io");
      await page.locator("#seller-password").fill("samchon");
      await page.getByRole("button", { name: "Log in as seller" }).click();
    }
  }
  await expect(sellerHeading).toBeVisible();
}

async function openAdminConsole(page: Page) {
  await page.goto(appUrl("/admin"));
  const adminHeading = page.getByRole("heading", {
    name: /View market-wide sales, orders, coupons, and policy metadata/i,
  });
  if (!(await adminHeading.isVisible().catch(() => false))) {
    if (readmeMode) {
      const response = await page.context().request.post(appUrl("/api/admin/session/login"), {
        data: {
          email: "robot@nestia.io",
          password: "samchon",
        },
      });
      expect(response.ok()).toBeTruthy();
      await page.goto(appUrl("/admin"));
    } else {
      const loginButton = page.getByRole("button", { name: "Log in as admin" });
      if (await loginButton.isVisible().catch(() => false)) {
        await page.locator("#admin-email").fill("robot@nestia.io");
        await page.locator("#admin-password").fill("samchon");
        await loginButton.click();
      }
    }
  }
  await expect(adminHeading).toBeVisible();
}

async function newIsolatedPage(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  return { context, page };
}

async function openWallet(page: Page) {
  await page.goto(appUrl("/wallet"));
  await expect(
    page.getByRole("heading", {
      name: /Track balances, issued tickets, and claimable coupons/i,
    }),
  ).toBeVisible();
  if (readmeMode) {
    const claimButton = page.getByRole("button", { name: "Claim coupon" }).first();
    if (await claimButton.isVisible().catch(() => false)) {
      await claimButton.click();
      await expect(page.getByText("Coupon claimed.")).toBeVisible();
      await hideToaster(page);
    }
  }
}

async function openOrders(page: Page) {
  await page.goto(appUrl("/orders"));
  await expect(
    page.getByRole("heading", {
      name: /Track every draft and publish attempt/i,
    }),
  ).toBeVisible();
}

test("desktop flow @ui-review", async ({ browser, page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(appUrl("/"));
  if (readmeMode) {
    await page.getByPlaceholder("Search title or description").fill("Apple");
    await page.getByPlaceholder("Search title or description").press("Enter");
  }
  await expect(page.getByText(featuredProductName)).toBeVisible();
  await capture(page, readmeMode ? "home.png" : "catalog-desktop.png");

  await page.getByRole("link", { name: new RegExp(featuredProductName, "i") }).click();
  await expect(
    page.getByRole("heading", { name: featuredProductName }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Add snapshot to cart" })).toBeVisible();
  await capture(page, readmeMode ? "detail.png" : "product-desktop.png");

  await page.getByRole("button", { name: "Add snapshot to cart" }).click();
  await page.waitForURL("**/cart");
  await capture(page, readmeMode ? "cart.png" : "cart-desktop.png");
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
  await page.getByRole("button", { name: "Publish order" }).click();
  await expect(page.getByText("Published delivery snapshot")).toBeVisible();
  await hideToaster(page);
  await capture(page, readmeMode ? "order-detail.png" : "order-desktop.png");

  await openOrders(page);
  await capture(page, readmeMode ? "orders.png" : "orders-desktop.png");

  await openWallet(page);
  await capture(page, readmeMode ? "wallet.png" : "wallet-desktop.png");

  if (readmeMode) {
    const sellerSession = await newIsolatedPage(browser);
    await openSellerConsole(sellerSession.page);
    await capture(sellerSession.page, "seller.png");
    await sellerSession.page.locator("#replica-title").fill("Apple Watch Studio Drop");
    await sellerSession.page.locator("#replica-tags").fill("apple, watch, studio, limited");
    await capture(sellerSession.page, "seller-studio.png");
    await sellerSession.context.close();

    const adminSession = await newIsolatedPage(browser);
    await openAdminConsole(adminSession.page);
    await capture(adminSession.page, "admin.png");
    await adminSession.page.locator("#coupon-name").fill("Golden Week 15%");
    await adminSession.page.locator("#coupon-value").fill("15");
    await adminSession.page.locator("#coupon-threshold").fill("100000");
    await adminSession.page.locator("#deposit-code").fill("manual_charge");
    await adminSession.page.locator("#deposit-source").fill("Manual charge");
    await adminSession.page.locator("#mileage-code").fill("review_reward");
    await adminSession.page.locator("#mileage-source").fill("Review reward");
    await adminSession.page.locator("#mileage-default-value").fill("3000");
    await capture(adminSession.page, "admin-policies.png");
    await adminSession.context.close();
  } else {
    await openSellerConsole(page);
    await capture(page, "seller-desktop.png");
    await openAdminConsole(page);
    await capture(page, "admin-desktop.png");
  }
});

test("tablet layout @ui-review", async ({ page }) => {
  test.skip(readmeMode, "README screenshots only need curated desktop captures.");
  await page.setViewportSize({ width: 834, height: 1112 });
  await page.goto(appUrl("/"));
  await page.getByRole("button", { name: /Smart Phones/ }).click();
  await expect(page.getByText("iPhone 16 Pro Field Kit")).toBeVisible();
  await capture(page, "catalog-tablet.png");
});

test("mobile layout @ui-review", async ({ page }) => {
  test.skip(readmeMode, "README screenshots only need curated desktop captures.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appUrl("/"));
  await expect(page.getByRole("link", { name: "Catalog" })).toBeVisible();
  await page.getByPlaceholder("Search title or description").fill("iPhone");
  await page.getByPlaceholder("Search title or description").press("Enter");
  await expect(page.getByText("iPhone 16 Pro Field Kit")).toBeVisible();
  await capture(page, "catalog-mobile.png");
});
