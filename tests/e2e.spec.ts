import { expect, test } from "@playwright/test";

const SIMULATED_MACBOOK_SALE_ID = "00000000-0000-4000-8000-00000000002e";

async function publishMacbookOrder(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Browse live sale snapshots with channel, section, and SKU-aware filters/i,
    }),
  ).toBeVisible();

  await page.goto(`/products/${SIMULATED_MACBOOK_SALE_ID}`);
  await expect(
    page.getByRole("heading", { name: "MacBook Pro 16 Creator Bundle" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add snapshot to cart" }).click();
  await page.waitForURL("**/cart");
  await page.getByRole("button", { name: "Create order draft" }).click();
  await page.waitForURL("**/orders/*");

  await page.locator("#citizen-name").fill("Kim Buyer");
  await page.locator("#citizen-mobile").fill("01055557777");
  await page.getByRole("button", { name: "Verify identity" }).click();
  await expect(
    page.getByText("Identity verified. You can now continue to publish the order."),
  ).toBeVisible();

  await page.locator("#address-name").fill("Kim Buyer");
  await page.locator("#address-mobile").fill("01055557777");
  await page.locator("#address-province").fill("Seoul");
  await page.locator("#address-city").fill("Seoul");
  await page.locator("#address-department").fill("Gangnam-gu");
  await page.locator("#address-zip-code").fill("06123");
  await page.locator("#address-possession").fill("Teheran-ro 123");
  await page.getByRole("button", { name: "Publish order" }).click();
  await expect(page.getByText("Published delivery snapshot")).toBeVisible();
}

async function openSessionAndVerifyIdentity(
  page: import("@playwright/test").Page,
  name: string,
  mobile: string,
) {
  await page.goto("/");
  await page.getByRole("button", { name: /^Guest$/ }).click();
  await page.getByRole("tab", { name: "Verify Identity" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Mobile").fill(mobile);
  await page.getByRole("button", { name: "Save identity" }).click();
  await expect(page.getByText("Identity verified.")).toBeVisible();
  await page.keyboard.press("Escape");
}

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

  await publishMacbookOrder(page);
  await page.getByRole("link", { name: "Orders", exact: true }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByText("MacBook Pro 16 Creator Bundle")).toBeVisible();
  await expect(page.getByText("Paid").first()).toBeVisible();
});

test("seller console can log in and observe paid orders", async ({ page }) => {
  await publishMacbookOrder(page);

  await page.goto("/seller");
  await expect(
    page.getByRole("heading", {
      name: /Log in as the built-in operator or promote this customer to seller/i,
    }),
  ).toBeVisible();

  await page.locator("#seller-email").fill("robot@nestia.io");
  await page.locator("#seller-password").fill("samchon");
  await page.getByRole("button", { name: "Log in as seller" }).click();
  await expect(
    page.getByRole("heading", {
      name: /Operate sales and watch paid orders from one surface/i,
    }),
  ).toBeVisible();

  await expect(page.getByText("MacBook Pro 16 Creator Bundle").first()).toBeVisible();
  await expect(page.getByText("Kim Buyer")).toBeVisible();
});

test("seller console can replicate, pause, and restore a sale", async ({ page }) => {
  await page.goto("/seller");
  await page.locator("#seller-email").fill("robot@nestia.io");
  await page.locator("#seller-password").fill("samchon");
  await page.getByRole("button", { name: "Log in as seller" }).click();
  await expect(
    page.getByRole("heading", {
      name: /Operate sales and watch paid orders from one surface/i,
    }),
  ).toBeVisible();

  await page.locator("#replica-title").fill("MacBook Pro 16 Creator Bundle Replica");
  await page.getByRole("button", { name: "Create replica sale" }).click();
  await expect(page.getByText("Replica sale created.")).toBeVisible();

  const replicaCard = page.locator('[data-sale-title="MacBook Pro 16 Creator Bundle Replica"]').first();
  await expect(replicaCard).toBeVisible();
  await replicaCard.getByRole("button", { name: "Pause sale" }).click();
  await expect(page.getByText("Sale paused.")).toBeVisible();
  await expect(replicaCard.getByText("Paused")).toBeVisible();
  await replicaCard.getByRole("button", { name: "Restore sale" }).click();
  await expect(page.getByText("Sale restored.")).toBeVisible();
});

test("wallet shows balances and can claim a coupon ticket", async ({ page }) => {
  await openSessionAndVerifyIdentity(page, "Wallet Buyer", "01022223333");

  await page.goto("/wallet");
  await expect(
    page.getByRole("heading", {
      name: /Track balances, issued tickets, and claimable coupons/i,
    }),
  ).toBeVisible();
  await expect(page.getByText("₩180,000", { exact: true })).toBeVisible();
  await expect(page.getByText("₩7,000", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Claim coupon" }).first().click();
  await expect(page.getByText("Coupon claimed.")).toBeVisible();
  await expect(page.getByText("Owned coupon tickets")).toBeVisible();
  await expect(page.getByText("Spring Launch 10%").first()).toBeVisible();
});

test("admin console can log in and observe market summaries", async ({ page }) => {
  await publishMacbookOrder(page);

  await page.goto("/admin");
  await expect(
    page.getByRole("heading", {
      name: /Promote the current customer or use the built-in operator account/i,
    }),
  ).toBeVisible();

  await page.locator("#admin-email").fill("robot@nestia.io");
  await page.locator("#admin-password").fill("samchon");
  await page.getByRole("button", { name: "Log in as admin" }).click();
  await expect(
    page.getByRole("heading", {
      name: /View market-wide sales, orders, coupons, and policy metadata/i,
    }),
  ).toBeVisible();
  await expect(page.getByText("Spring Launch 10%")).toBeVisible();
  await expect(page.getByText("Deposit charge")).toBeVisible();
  await expect(page.getByText("Welcome bonus")).toBeVisible();
});

test("admin console can create coupon and ledger metadata", async ({ page }) => {
  await page.goto("/admin");
  await page.locator("#admin-email").fill("robot@nestia.io");
  await page.locator("#admin-password").fill("samchon");
  await page.getByRole("button", { name: "Log in as admin" }).click();
  await expect(
    page.getByRole("heading", {
      name: /View market-wide sales, orders, coupons, and policy metadata/i,
    }),
  ).toBeVisible();

  await page.locator("#coupon-name").fill("Golden Week 15%");
  await page.locator("#coupon-value").fill("15");
  await page.locator("#coupon-threshold").fill("100000");
  await page.getByRole("button", { name: "Create coupon" }).click();
  await expect(page.getByText("Coupon created.")).toBeVisible();
  await expect(page.getByText("Golden Week 15%").first()).toBeVisible();

  await page.locator("#deposit-code").fill("manual_charge");
  await page.locator("#deposit-source").fill("Manual charge");
  await page.getByRole("button", { name: "Create deposit meta" }).click();
  await expect(page.getByText("Deposit metadata created.")).toBeVisible();
  await expect(page.getByText("Manual charge").first()).toBeVisible();

  await page.locator("#mileage-code").fill("review_reward");
  await page.locator("#mileage-source").fill("Review reward");
  await page.locator("#mileage-default-value").fill("3000");
  await page.getByRole("button", { name: "Create mileage meta" }).click();
  await expect(page.getByText("Mileage metadata created.")).toBeVisible();
  await expect(page.getByText("Review reward").first()).toBeVisible();
});
