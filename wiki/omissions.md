# Intentional Omissions

These SDK capabilities were read during discovery but intentionally left out of the first storefront product.

## Omitted On Purpose

- Coupon, deposit, mileage, and ticket management UI
- Review, question, answer, and comment surfaces
- Seller and admin workflows
- Multi-channel switching UI
- Direct-order shortcuts that bypass the cart composition flow
- Manual payment vendor selection
- Diagnostic or redundant SDK endpoints that do not improve the main buyer journey

## Why

- The first product goal is a coherent buyer flow: browse, inspect, configure, cart, order, verify identity, publish.
- The omitted areas either add operational complexity, duplicate an existing path, or expose backend mechanics that are not helpful to shoppers.
- The current adapter layer keeps replacement cost low if any omitted feature is later promoted into the UI.
