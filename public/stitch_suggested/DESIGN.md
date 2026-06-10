---
name: Technical Brutalism
colors:
  surface: '#141409'
  surface-dim: '#141409'
  surface-bright: '#3a3a2d'
  surface-container-lowest: '#0f0f05'
  surface-container-low: '#1c1c11'
  surface-container: '#202015'
  surface-container-high: '#2b2b1e'
  surface-container-highest: '#363529'
  on-surface: '#e6e3d0'
  on-surface-variant: '#dbc1ba'
  inverse-surface: '#e6e3d0'
  inverse-on-surface: '#313124'
  outline: '#a38b86'
  outline-variant: '#55423e'
  surface-tint: '#ffb4a1'
  primary: '#ffb4a1'
  on-primary: '#5d1805'
  primary-container: '#e07a5f'
  on-primary-container: '#5b1604'
  inverse-primary: '#9a442d'
  secondary: '#c2c4e5'
  on-secondary: '#2b2e48'
  secondary-container: '#444763'
  on-secondary-container: '#b4b6d7'
  tertiary: '#9fd1b8'
  on-tertiary: '#023826'
  tertiary-container: '#70a18a'
  on-tertiary-container: '#003725'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd2'
  primary-fixed-dim: '#ffb4a1'
  on-primary-fixed: '#3c0800'
  on-primary-fixed-variant: '#7c2e19'
  secondary-fixed: '#dfe0ff'
  secondary-fixed-dim: '#c2c4e5'
  on-secondary-fixed: '#161a32'
  on-secondary-fixed-variant: '#424560'
  tertiary-fixed: '#bbeed4'
  tertiary-fixed-dim: '#9fd1b8'
  on-tertiary-fixed: '#002115'
  on-tertiary-fixed-variant: '#1f4f3c'
  background: '#141409'
  on-background: '#e6e3d0'
  surface-variant: '#363529'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  technical-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  technical-xs:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.05em
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1200px
---

## Brand & Style
The brand personality is **brutalist-technical**, characterized by a raw, functional aesthetic that prioritizes speed and information density. It targets power users who value transparency and open-format data. The UI evokes a sense of efficiency and unadorned utility through high-contrast interfaces, heavy structural lines, and a typography-first approach.

The design style is a hybrid of **Brutalism** and **Modern Corporate**, utilizing aggressive 2px borders and monospaced technical accents to create a "built-for-builders" atmosphere. It balances the starkness of a code editor with the readability of a premium editorial site.

## Colors
The system employs a high-contrast dual-theme strategy. The application interface utilizes a deep dark mode for focus, while marketing and long-form "paper" sections use a high-contrast light mode.

- **Primary (Terracotta):** Used for active states, primary actions, and feed status indicators.
- **Neutral (Paper):** Used as the background for informational sections to mimic physical documentation.
- **Structural Black:** All borders and primary text in light mode use a true high-contrast black (#000000) or near-black (#1A1A1A).

## Typography
Typography is the primary driver of the visual hierarchy. 
- **Inter** is used for all headings (Extra Bold/Bold) and body copy to ensure maximum legibility and a modern feel.
- **JetBrains Mono** is reserved for technical metadata, feed URLs, timestamps, and UI labels, reinforcing the "open-format" developer aesthetic.
- Use tight letter-spacing for large headings to create a dense, impactful look.

## Layout & Spacing
The layout follows a **Fixed Grid** model for editorial content and a **Fluid Technical Grid** for the feed dashboard. 

- **Grid:** Use a 12-column system with hard 2px vertical dividers between major sections instead of standard whitespace gutters.
- **Density:** Elements should be tightly packed. Use a 4px baseline shift for vertical rhythm.
- **Responsive:** On mobile, columns collapse into a single stack, but the 2px black borders remain to maintain the structural "boxed" look.

## Elevation & Depth
This design system eschews shadows and blurs in favor of **Bold Borders** and **Tonal Layering**.

- **Depth:** Created by stacking "Paper" or "Dark" panels with 2px solid black borders. 
- **Active State:** Elements move physically using a `translate(2px, 2px)` effect on click, rather than glowing or lifting.
- **Hard Shadows:** If depth is required, use a solid, non-blurred offset shadow (e.g., 4px 4px 0px #000).

## Shapes
The shape language is strictly **Sharp**. All containers, buttons, and input fields must have a 0px border radius. This reinforces the technical, uncompromising nature of the brand. Progress bars and tags should also maintain square corners.

## Components
- **Buttons:** 2px solid black border, sharp corners. Default state is background color (Terracotta or Neutral); hover state inverts the colors or shifts the element position.
- **Suggested Feed Cards:** Large bold Inter headlines, followed by a JetBrains Mono "Source URL." Use a 2px border bottom to separate items in a list.
- **Chips/Tags:** Small JetBrains Mono text in all caps. Use a thin 1px border or a solid Terracotta background with white/black text.
- **Input Fields:** Thick 2px borders. Focus state changes the border color to Terracotta or adds a solid block shadow.
- **Lists:** Data-heavy rows with alternating subtle background tints. Every row is separated by a 1px solid line.