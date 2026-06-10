# Technical Specifications: MultivRSS Suggested Feeds Page

## Overview
This document provides the necessary implementation details for the "Suggested Feeds" page of the MultivRSS application. The design follows a "Technical Brutalism" aesthetic: high contrast, sharp edges (2px borders), monospace typography for metadata, and a strict color palette.

## Core Design Tokens (Tailwind CSS)
- **Background**: `#141409` (Paper-like dark)
- **Surface**: `#1c1c11` (Slightly lighter containers)
- **Accent (Terracotta)**: `#e07a5f` (Used for active buttons, highlights, and icons)
- **Typography**: 
  - Main: `Inter` (sans-serif)
  - Technical/Meta: `JetBrains Mono` (monospace)
- **Borders**: `2px solid` using `currentColor` or specific brand colors.

## Component Specifications

### 1. Header (Navigation)
- **Brand**: "MULTIVRSS" in bold, uppercase, tracked-tighter.
- **Nav Links**: "Reader", "Saved", "Suggested" (Active state: underline or accent color).
- **Search Bar**: Minimalist input with a border, placed on the right.

### 2. Sidebar (Categories)
- **Title**: "Categories" with "Filter directory" subtext in monospace.
- **Items**: List of categories (Tech, News, Design, Culture) with associated icons (code, public, palette, theater_comedy).
- **CTA**: "ADD CUSTOM RSS" button at the bottom of the sidebar.

### 3. Main Content: Directory
- **Header**: `// DIRECTORY — CURATED_SOURCES` in monospace.
- **Search**: A large search input with a magnifying glass icon for filtering the directory.
- **Feed Grid**: A 2-column grid layout containing category blocks.
- **Feed Cards**:
  - Name (Uppercase, bold).
  - Description (Muted text).
  - URL (Monospace, accent color).
  - "+ ADD" Button: Outlined style, turns filled on hover.

### 4. Staff Pick / Recommended Section
- A large featured block at the bottom.
- Visual: An image or code-like graphic on the left.
- Label: "STAFF PICK — RECOMMENDED" (pill style).
- Title: "THE LOW-LEVEL LOGS" (Heavy heading).
- Actions: "SUBSCRIBE TO LOGS" (Primary button) and "PREVIEW" (Secondary button).

### 5. Footer
- Technical metadata: `MultivRSS Terminal v1.0.4. (c) 2024`.
- Links: Docs, API, Privacy, Status.
- Style: Monospace, all caps, small font size.

## Implementation Notes
- Use **Tailwind CSS** for all styling.
- Ensure the layout is responsive (sidebar hides or collapses on mobile).
- Buttons should have a `active:translate-x-[2px] active:translate-y-[2px]` effect to simulate a mechanical click.
- Use `gap-gutter` spacing consistent with the rest of the application.