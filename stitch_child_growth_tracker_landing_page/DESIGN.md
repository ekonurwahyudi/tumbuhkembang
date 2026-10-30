---
name: Tumbuh Ceria
colors:
  surface: '#f5faff'
  surface-dim: '#d5dbdf'
  surface-bright: '#f5faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4f9'
  surface-container: '#e9eef3'
  surface-container-high: '#e4e9ee'
  surface-container-highest: '#dee3e8'
  on-surface: '#171c20'
  on-surface-variant: '#414751'
  inverse-surface: '#2b3135'
  inverse-on-surface: '#ecf1f6'
  outline: '#727782'
  outline-variant: '#c1c6d3'
  surface-tint: '#005fae'
  primary: '#005298'
  on-primary: '#ffffff'
  primary-container: '#1e6bba'
  on-primary-container: '#e2ebff'
  inverse-primary: '#a5c8ff'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#6df5e1'
  on-secondary-container: '#006f64'
  tertiary: '#8a3a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b04c00'
  on-tertiary-container: '#ffe6db'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a5c8ff'
  on-primary-fixed: '#001c3a'
  on-primary-fixed-variant: '#004785'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783200'
  background: '#f5faff'
  on-background: '#171c20'
  surface-variant: '#dee3e8'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system blends **Gentle Pediatric Care** with **Modern Product Utility**. Crafted specifically for parents navigating the critical first 1,000 days of life, it bridges the gap between clinically rigorous Indonesian pediatric standards (IDAI, Fenton 2013, WHO 2006) and the soft, nurturing intimacy of family life.

### Design Principles
- **Clinically Calm & Reassuring:** Uses soft medical teals and calming sky blues instead of sterile clinical whites. Data visualizations, percentile curves, and vaccine alerts prioritize clarity over alarmism.
- **Friendly Modernism:** Embraces generous corner radiuses, soft pastel backdrop chips, tactile rounded buttons, and structured metric tiles.
- **Cognitive Ease for Tired Parents:** High legibility, distinct status badges (e.g., chronological vs. corrected age, premature flags), and thumb-friendly mobile ergonomics ensure zero friction during midnight feedings or pediatrician appointments.

## Colors

The palette is derived from the app's cheerful, clean interface. It prioritizes soothing base tones punctuated by crisp semantic signifiers.

### Palette Architecture
- **Primary (`#1E6BBA` - Royal Pediatric Blue):** Anchors major actions, interactive buttons, key milestone labels, and standard growth markers.
- **Secondary (`#14B8A6` - Gentle Mint/Teal):** Used for vaccination indicators, completed milestones, healthy status chips, and developmental progress cards.
- **Tertiary (`#F97316` - Warm Coral Amber):** Drives urgent but supportive alerts (such as overdue vaccinations, milk intake targets, premature baby badges, and registry highlights).
- **Neutral Light Base (`#F0F5FA` / `#F8FAFC`):** Soft, non-fatiguing cool canvas backgrounds that isolate pure white (`#FFFFFF`) elevated cards cleanly.
- **Text & Structure:** Rich Slate (`#0F172A`) for primary reading, Muted Steel (`#64748B`) for helper texts and units (e.g., `cm`, `kg`, `ml`), and Soft Border Ice (`#E2E8F0`) for low-contrast card enclosures.

## Typography

The typography leverages **Plus Jakarta Sans** across all roles. Its geometric yet friendly humanist curves bring warmth and contemporary readability, making it ideal for Indonesian parenting terminology and scientific growth metrics alike.

- **Numerals & Metrics:** Large numerical displays (such as `3,30 kg` or `495 ml`) use bold weights with tabular or proportional clarity to stand out against supporting unit labels.
- **Badges & Micro-Copy:** Small uppercase labels (`PREMATUR`, `Z-SCORE`, `IDAI STANDARD`) leverage `label-sm` with slight positive tracking to ensure instant legibility at reduced sizes on mobile devices.

## Layout & Spacing

The layout balances compact mobile data density with generous white space for narrative landing sections.

### Grid & Canvas Structure
- **Mobile First:** Uses a 4-column layout bounded by `margin: 1rem` (16px) with an interior column gutter of 16px. Component groups (such as Quick Access or Vaccine Cards) adopt smooth horizontal scrolling carousels.
- **Desktop Landing Viewport:** Fluid 12-column system, maxing out at `1200px` content width with `margin-desktop: 3rem` (48px). Cards and health dashboards reflow from vertical card stacks into modular 2- and 3-column feature grids.
- **Vertical Rhythm:** 8px base grid rhythm (`0.5rem`, `1rem`, `1.5rem`, `2.25rem`). Tight child metrics maintain `space-xs` (4px) or `space-sm` (8px) distance, while top-level card sections breathe with `space-lg` (24px) padding.

## Elevation & Depth

This system avoids heavy drop shadows in favor of **Soft Ambient Tonal Surfaces** paired with ultra-diffused, soft-tinted borders.

### Elevation Hierarchy
- **Level 0 (Canvas Base):** Tinted soft canvas (`#F0F5FA` to `#F8FAFC`). No elevation.
- **Level 1 (Surface Cards & Informational Tiles):** Pure white `#FFFFFF` surface overlaid with a soft boundary stroke (`1px solid #E2E8F0` or `#EBF2F7`). A delicate ambient shadow (`0px 4px 16px rgba(30, 107, 186, 0.04)`) separates card panels from the cool canvas.
- **Level 2 (Active Modals & Floating CTA / Bottom Navigation):** Raised floating surfaces utilize a slightly warmer diffuse shadow (`0px 8px 24px rgba(15, 23, 42, 0.08)`), offering clear physical affordance above active scroll layers.
- **Tinted Informational Containers:** Medically certified blocks (e.g., standard WHO/IDAI alerts) employ zero shadow with a dedicated `5%` primary tint fill (`rgba(30, 107, 186, 0.06)`) and soft blue borders.

## Shapes

The roundedness level is set to **Level 2 (Rounded)** with purposeful accentuation for organic, baby-safe tactility.

- **Primary Cards:** `rounded-lg` (16px / `1rem`) creates soft, approachable enclosures that feel safe and protective.
- **Interactive Buttons & Pill Badges:** Full pill shape (`9999px`) for action chips, profile switcher pills, and modal action tags (e.g., `Target usia 0-24 jam`).
- **Metric Micro-Tiles:** `rounded` (8px to 12px) for metric sub-cards (weight, height, milk intake) inside the larger parent containers.
- **Avatars & Service Quick-Actions:** Circular (`rounded-full`) icon containers surrounded by soft circular pastel halos.

## Components

### Buttons
- **Primary Action:** Solid Royal Pediatric Blue (`#1E6BBA`) background with crisp white text. Pill-shaped or `rounded-lg`, 44px min touch target height, paired with subtle forward chevron or medical action icons.
- **Secondary / Outlined:** White background, `1.5px solid #1E6BBA`, primary blue text.
- **Soft Tone Buttons:** Mint or sky wash background (`#E0F2FE` or `#CCFBF1`) with high-contrast text for low-pressure secondary actions like "Ingatkan Saya".

### Metric & Growth Cards
- Enclosed in white `rounded-lg` cards with a hairline border (`#E2E8F0`).
- Displays 3-column quick metric grids (Berat, Tinggi, Lingkar Kepala) with bold numeral labels, percentile notations (`Z -1.29 · P9.9`), and dynamic delta indicators (`+180 g`).

### Chips & Badges
- **Medical & Age Pills:** Small, high-contrast, rounded pills indicating chronologic vs. corrected age and premature status (`#FEF3C7` yellow-amber background with `#92400E` text for premature tags).
- **Vaccine Target Chips:** `#E0F2FE` chip background with `#0369A1` text framing the recommended age bracket.

### Lists & Activity Rows
- Divided by hairline borders or encapsulated within micro-card tiles with `12px` padding.
- Leading icon containers feature circular, soft-hued pastel backgrounds (e.g., violet for milk feeding, green for vaccines, blue for growth chart).

### Form Inputs & Selectors
- Soft background inputs (`#F8FAFC`) framed by light gray borders (`#E2E8F0`), transitioning to a crisp primary blue focus ring (`#1E6BBA`) on active states.
- Dropdown select pills (e.g., interval toggles like "Tiap 3 jam") use nested rounded chips with trailing chevrons.

### Compliance & Standard Banner
- Dedicated full-width rounded callout with soft blue background (`#EFF6FF`) and primary blue shield iconography verifying official compliance with IDAI, Fenton 2013, and WHO 2006 guidelines.