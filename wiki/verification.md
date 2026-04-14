# Verification

## Date

- Verified on April 14, 2026
- Frontend-only test automation ran against the production build served locally through Playwright in deterministic simulation mode

## Automated Checks

- `pnpm check`
- `pnpm test:e2e`
- `pnpm ui:review`
- `pnpm readme:screens`

## Browser Flows

Browser automation was executed with Playwright after the production build completed.

- Desktop `1440x900`
  - opened the catalog
  - verified membership signup from the auto-created guest session
  - verified category filtering for `smart_phones`
  - searched for `MacBook`
  - opened `MacBook Pro 16 Creator Bundle`
  - added the product to cart
  - created an order draft
  - completed citizen verification
  - filled a shipping address
  - published the order
  - confirmed the order appeared as paid on the orders page
  - verified wallet balances and coupon claiming flow
  - logged into the seller console with `robot@nestia.io`
  - confirmed the paid order appeared in the seller dashboard
  - created a replica sale and toggled its paused state from the seller console
  - logged into the administrator console with `robot@nestia.io`
  - confirmed sales, orders, coupons, and ledger metadata appeared in the admin dashboard
  - created a new coupon plus deposit and mileage metadata from the admin console
- Tablet `834x1112`
  - verified catalog layout
  - verified category filtering for `smart_phones`
- Mobile `390x844`
  - verified compact navigation layout
  - verified catalog search for `iPhone`

## Artifacts

- UI review screenshots were written to `.artifacts/ui-review/` during the final pass and are ignored by Git.
- README screenshots were refreshed under `public/readme/`, including seller studio and admin policy authoring views.
