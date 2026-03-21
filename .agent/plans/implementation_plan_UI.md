# Claude-Themed UI Redesign Plan (Revised)

This plan outlines the steps to reskin the **existing** frontend pages and components to match the elegant, minimalist aesthetic of the Claude web app. This redesign now includes full support for Light/Dark modes, styled Auth pages, and utility classes to ensure consistency.

## Design System Strategy (Claude Aesthetic)
- **Typography**: Clean sans-serif (Inter) with optional elegant serif accents for major headers.
- **Colors (Light/Dark Support)**:
  - **Light Mode**: Background `#f9f8f6`, Text `#1f2937`.
  - **Dark Mode**: Background `#21201D`, Text `#e5e5e5`.
  - Cards/Containers: Slightly lighter/darker than the background for soft depth.
  - Borders: Very subtle (`rgba(0,0,0,0.08)` or `rgba(255,255,255,0.1)`).
  - Accents: Claude's rust/orange `#d97757` or soft blues/greens.
- **Shapes**: Gently rounded corners (`8px` to `12px`), soft shadows on hover only.

## Proposed Changes

### Global Styles
#### [MODIFY] globals.css (`apps/web/app/globals.css`)
- Define CSS color variables for both Light and Dark modes using `@media (prefers-color-scheme: dark)`.
- **Utility Classes**:
  - `.claude-card`: Standardized card styling (background, border, padding, radius).
  - `.claude-button`: Understated minimalist button (primary and secondary).
  - `.claude-input`: Clean, minimalist input fields.
  - `.claude-link`: Subtle link styling.

### Pages & Layouts
#### [MODIFY] layout.tsx (`apps/web/app/layout.tsx`)
- Ensure `<body>` correctly applies the new background and text variables.

#### [MODIFY] Dashboard & Timeline
- `apps/web/app/dashboard/page.tsx`, `apps/web/app/timeline/page.tsx`
- Replace hardcoded colors with CSS variables or utility classes.
- Re-style the "AI is rebalancing..." banner with a softer, premium alert design.

#### [MODIFY] Analytics (`apps/web/app/analytics/page.tsx`)
- Apply background, card styling, and typography variables.
- Update `AnalyticsChart.tsx` to use the new color palette.

#### [MODIFY] Auth Pages
- `apps/web/app/auth/login/page.tsx`
- Create `apps/web/app/auth/register/page.tsx` (if missing).
- Apply the Claude theme to forms, inputs, and buttons to ensure a consistent first-user experience.

#### [MODIFY] Wizard (All Steps)
- `apps/web/app/wizard/step1` through `step5` and `done`.
- Apply uniform variables and utility classes to maintain flow across all 6+ pages.

### Components
#### [MODIFY] SessionCard (`apps/web/app/components/SessionCard.tsx`)
- Remove inline styles; use `.claude-card` and standardized status colors.
- Soften status colors (e.g., muted green for COMPLETED, amber for PARTIAL).

## Verification Plan
- Start the frontend server (`npm run dev`).
- Verify Light/Dark mode transitions.
- Navigate through Auth -> Wizard -> Dashboard -> Timeline -> Analytics.
- Confirm all session cards and interactive elements are cohesive and premium.
