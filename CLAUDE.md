## Goal
This project should produce a frontend that understands the SDK well.

Do not let raw SDK shapes take over the UI.

- Keep SDK-specific code in an adapter layer.
- Let the UI depend on normalized domain models and hooks.

## Stack
Use a fixed base unless the user explicitly wants something else.

- Use `TypeScript + Next.js + shadcn/ui` unless the user approves another stack.
- Use environment variables for the API host.
- Default API host: `http://127.0.0.1:37001`.
- Add libraries only when they solve a real problem.

## Start
Before designing screens, make the SDK surface clear.

- Scaffold the app.
- Install the SDK.
- Read `node_modules/@samchon/shopping-api/lib/**/*.d.ts` carefully.
- Read the comments too.
- Treat code, types, and comments as the source of truth.
- Map the main APIs, DTOs, and constraints before designing the UI.

## Account Guidance
This project has a default operator account that is shared by the seller and administrator flows.

- Customer accounts are not fixed in advance. Create and use them directly in the product, and use membership signup when needed.
- Seller accounts can also be joined through the product flow when seller onboarding is being tested.
- The built-in fixed operator account is shared by seller and administrator flows:
  Seller/administrator email: `robot@nestia.io`
  Password: `samchon`
- Preserve this built-in operator account anywhere the seller or administrator login flow is introduced.

## Design
The code structure should keep replacement cost low if the SDK changes later.

- Keep SDK code in a dedicated adapter layer.
- Do not spread SDK types across screens and components.
- Explain any non-default choice for routing, state, fetching, styling, forms, testing, or browser automation.

## Product
Read the SDK broadly.

Do not turn every endpoint into a feature. Prefer a clear product over full endpoint coverage.

- Do not force every API into the UI.
- Leave out APIs that are redundant, diagnostic, cluttering, or harmful to the main flow.
- Note intentional omissions in `wiki/`.
- Do not invent features the SDK does not support.
- Handle loading, empty, error, retry, and invalidation states.
- Finish the main user flows before adding secondary controls.

## Visual Style
The default direction is a simple prototype-first UI.

It is only a default. If the user gives a different direction, or if the existing product style is already clear, follow that instead.

- The UI must work well on mobile, tablet, and desktop.
- Start from real UI parts such as lists, tables, forms, detail views, dialogs, and pagination.
- Keep the layout readable and content-first.
- Avoid decorative choices that hurt clarity or usability.

## Workflow
Docs and helper commands should follow the code instead of drifting away from it.

- Keep `wiki/` aligned with the code.
- Update docs when architecture, package choices, user flows, or omissions change.
- If a useful project command does not exist yet, create it before relying on it.

## Testing
Testing should prove that the rendered product still works.

For frontend-only work, keep the test program focused on the frontend itself. Do not boot the backend, judge backend health, or let CI drift into server checks.

The SDK already supports simulation through the connection object. When `simulate: true` is set, the SDK returns simulated responses instead of calling the real backend. For frontend tests, treat this as API mocking at the SDK boundary.

```ts
const connection: IConnection = {
  host: "http://127.0.0.1:...",
  simulate: true,
};
```

- If the repo does not have a suitable test stack yet, add one.
- Keep a browser-first test program for the main user flows.
- Prefer Playwright for end-to-end and UI review work unless the user wants something else.
- Do not add backend health, startup, or server-state checks to the frontend test program or its GitHub Actions workflow.
- If integration testing is needed, keep it as a separate test program.
- Keep local test commands and GitHub Actions aligned when the test setup changes.

## UI Review
UI work is not done when the code compiles.

It is done after the flow has been used and checked.

- Run the flow yourself.
- Prefer direct browser interaction.
- Install browser automation before falling back.
- Check the UI at mobile, tablet, and desktop sizes.
- Verify that controls cause observable changes.
- Verify that search, sort, pagination, page size, toggles, dialogs, and forms actually work when present.
- Do one final pass for layout and copy before calling the work done.
- Fall back to screenshots or raw API checks only when browser automation is not available.

## Done
Done means the product works, not just that files were written.

- The app starts.
- Core flows work.
- The UI is coherent.
- The docs match the code.
- The tests match the code.
- If an SDK feature makes the product worse, simplify it or leave it out.
