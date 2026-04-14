# Intentional Omissions

These SDK capabilities were read during discovery but intentionally left out of the current product.

## Omitted On Purpose

- Review, question, answer, and comment surfaces
- Deep seller operations such as raw SKU authoring, snapshot editing, inventory updates, and delivery workflows
- Deep admin operations such as coupon destruction, seller-scoped coupon criteria design, and donation policy workflows
- Multi-channel switching UI
- Direct-order shortcuts that bypass the cart composition flow
- Manual payment vendor selection
- Diagnostic or redundant SDK endpoints that do not improve the main buyer journey

## Why

- The current product goal is a coherent buyer flow plus practical operator tooling: browse, inspect, configure, cart, order, verify identity, publish, then manage wallet, seller, and admin operations from dedicated consoles.
- The omitted areas either add operational complexity, duplicate an existing path, or expose backend mechanics that are not helpful to shoppers.
- The current adapter layer keeps replacement cost low if any omitted feature is later promoted into the UI.
