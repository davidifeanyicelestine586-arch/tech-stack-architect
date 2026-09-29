# Header UX Audit & Remediation

## Scope

Audit and remediation of the Next.js workspace header only. Source of truth: `app/(dashboard-layout)/layout/vertical/header/index.tsx` and its directly rendered header children.

The deployed URL was requested for runtime verification, but the web reader could not retrieve the Vercel page in this run. Historical repository QA evidence confirms browser checks at 1440, 1280, 1024, 768, 390, and 375px; those historical checks reported no visible page-level horizontal overflow. The current source, however, implemented the header row with `min-w-max` and `overflow-x-auto`, so source-level remediation was required.

## 1. Executive summary

The header already had strong accessibility primitives: native controls, explicit accessible names, 44px action targets, a skip link, and a responsive Sheet-based sidebar. The primary UX defect was structural: the header deliberately made its row wider than the viewport and placed it inside a horizontal scroller, which avoids collisions by making the header itself scroll. The remediation changes the header to a true single-row layout with breakpoint-based compression, keeps Save prominent on mobile, and moves the header to normal-flow sticky positioning.

**Top 3 priorities**
1. Replace `min-w-max + overflow-x-auto` with a viewport-width flex row.
2. Progressively compress secondary labels/actions below 992px and collapse the brand/search presentation below 768px.
3. Preserve 44px targets, visible focus, keyboard sidebar behavior, and sticky-header focus safety.

## 2. 5W-H audit

### Brand / logo
- **What:** Ediccrew / Stack Architect brand link with Layers mark.
- **When:** Always visible.
- **Where:** First header item.
- **Why:** Product identity and home navigation.
- **Who:** All users.
- **How:** Full lockup on desktop/tablet; mark-only on narrow mobile while retaining the link's accessible name.

### Sidebar toggle
- **What:** Panel-left button controlling workspace navigation.
- **When:** Always available.
- **Where:** Immediately after the brand.
- **Why:** Primary navigation access.
- **Who:** Pointer, touch, keyboard and screen-reader users.
- **How:** Keep native button semantics plus existing `aria-expanded`/`aria-controls`. Do not introduce a second JS menu controller.

### Search
- **What:** Workspace navigation search input.
- **When:** Always available; compact presentation on mobile.
- **Where:** After the sidebar control.
- **Why:** Fast route/workspace discovery.
- **Who:** Users who prefer search over navigation traversal.
- **How:** Preserve the input's accessible label. On mobile it becomes a 44px search target and expands on focus using CSS `:focus-within`.

### Persistence status
- **What:** Ready/dirty/saving/loading/error status.
- **When:** During project editing.
- **Where:** Before New/Open/Save.
- **Why:** Communicates project persistence state.
- **Who:** Project authors.
- **How:** Keep `aria-live="polite"`; visually suppress only the badge on narrow mobile to reclaim space.

### New / Open / Save
- **What:** Project lifecycle actions.
- **When:** Throughout project creation/editing.
- **Where:** Central action cluster.
- **Why:** Core workflow controls.
- **Who:** Project authors.
- **How:** Keep 44px targets. At mobile widths, preserve icon + accessible name but hide the visible text labels. Save remains the visually strongest CTA.

### Sign in
- **What:** Authentication entry point.
- **When:** Anonymous state.
- **Where:** After persistence controls.
- **Why:** Enables durable saved projects.
- **Who:** Anonymous users.
- **How:** Retain the existing Dialog trigger and accessible name; compact its visible text below 992px.

### GitHub
- **What:** External repository link.
- **When:** Optional secondary action.
- **Where:** After authentication.
- **Why:** Repository/source discovery.
- **Who:** Developers/reviewers.
- **How:** Full label on desktop, icon-only on tablet, hidden from the narrow mobile header to protect core workflow space.

### Theme toggle
- **What:** Light/dark theme control.
- **When:** Always available.
- **Where:** Final header action.
- **Why:** Display preference.
- **Who:** All users.
- **How:** Retain explicit `aria-label` and 44px target.

### Sticky behavior
- **What:** Header remains reachable while scrolling.
- **When:** Workspace scrolling.
- **Where:** Top of the content shell.
- **Why:** Persistent access to workflow actions.
- **Who:** All users.
- **How:** Use `position: sticky` in normal flow instead of mobile `fixed` + compensating top padding.

### Focus states
- **What:** Visible keyboard focus.
- **When:** Keyboard/focus-visible interaction.
- **Where:** Header links, buttons and search input.
- **Why:** Keyboard orientation and accessibility.
- **Who:** Keyboard and assistive-technology users.
- **How:** Use a consistent 2px solid outline with 2px offset and test both themes.

## 3. Responsive behavior report

| Breakpoint | Before | After |
|---|---|---|
| **1200px+** | Full row inside horizontal scroller; `min-w-max`. | One true row: brand / sidebar / search / status + New/Open/Save / Sign in / GitHub / theme. Full labels. |
| **992–1199px** | Same overflow strategy; project name consumes space. | One row. Project name collapses, search contracts to ~180px, secondary labels can compact. |
| **768–991px** | Header can exceed viewport and relies on horizontal scrolling. | One row. Search ~140px, GitHub/auth labels compact, New/Open/Save remain visible. |
| **480–767px** | Horizontal toolbar behavior can be required to reach controls. | One row. Brand mark-only, 44px search target that expands on focus, New/Open/Save icon-only, GitHub removed from dense mobile header, Save stays prominent. |
| **<480px** | Same structural overflow risk. | Same mobile contract with tighter gaps/padding; no header-level horizontal scroll. |

The implementation follows the WCAG reflow principle rather than using page/header horizontal scrolling as the default responsive strategy. WCAG 2.2's reflow guidance targets presentation equivalent to 320 CSS px without two-dimensional scrolling for ordinary content. citeturn2search0

## 4. Accessibility report

### Strengths retained
- Native buttons/links/inputs.
- Sidebar toggle has an accessible name, `aria-expanded`, and `aria-controls`.
- Search has an accessible label.
- Persistence status uses `aria-live="polite"`.
- Header actions use 44px targets.
- Dashboard has a skip-to-content link.

WCAG 2.2 AA defines a 24px minimum target-size criterion with exceptions; 44px is the stronger target used here for touch ergonomics. citeturn1search7turn1search3

### Fixes
1. Removed `min-w-max` and `overflow-x-auto` from the header row.
2. Changed the header from mobile fixed positioning to normal-flow sticky positioning.
3. Removed the dashboard's `max-lg:pt-16` compensation that existed for the fixed mobile header.
4. Added a consistent visible 2px focus outline.
5. Kept accessible names when visual labels collapse.
6. Kept the existing Sheet/sidebar keyboard interaction instead of adding duplicate hamburger JavaScript.

WCAG 2.2 requires focused components not to be entirely hidden by author-created sticky/fixed content. citeturn5search0

Normal text should be verified at 4.5:1 minimum contrast under WCAG AA; large text has a 3:1 threshold. citeturn1search6

## 5. Implementation artifacts

### Changed files

- `app/(dashboard-layout)/layout/vertical/header/index.tsx`
  - Replaced overflow-scrolling header structure with semantic `nav` + single flex row.
  - Switched to sticky normal-flow behavior.
  - Added scoped `site-header__*` layout hooks.
- `app/css/components/site-header.css`
  - Added mobile-first responsive contract.
  - Breakpoints: 1199px, 991px, 767px.
  - 44px controls.
  - Focus styling.
  - Mobile search expansion via `:focus-within`.
- `app/globals.css`
  - Imports the new scoped header stylesheet.
- `app/(dashboard-layout)/layout.tsx`
  - Removed fixed-header mobile top padding.
- `components/architect/project-persistence-toolbar.tsx`
  - Added `data-header-project-name` hook for responsive project-name collapse.

### Semantic skeleton

```tsx
<header className="site-header">
  <nav className="site-header__row" aria-label="Workspace controls">
    <a href="/" aria-label="Ediccrew Tech Stack Architect home">…</a>

    <button
      type="button"
      aria-label="Toggle workspace navigation"
      aria-expanded="false"
      aria-controls="workspace-navigation"
    >
      …
    </button>

    <div className="site-header__search">
      <label className="sr-only" htmlFor="workspace-search">
        Search workspace navigation
      </label>
      <input id="workspace-search" type="search" />
    </div>

    <div className="site-header__persistence">
      <span aria-live="polite">Ready</span>
      <button type="button">New</button>
      <button type="button">Open</button>
      <button type="button">Save</button>
    </div>

    <a href="/auth">Sign in</a>
    <a href="https://github.com/…" target="_blank" rel="noreferrer">GitHub</a>
    <button type="button" aria-label="Switch to dark theme">…</button>
  </nav>
</header>
```

### Responsive CSS contract

```css
.site-header {
  --site-header-height: 64px;
  --site-header-gap: 8px;
  --site-header-control: 44px;
  --site-header-focus: #2563eb;
  width: 100%;
}

.site-header__row {
  display: flex;
  align-items: center;
  gap: var(--site-header-gap);
  min-height: var(--site-header-height);
  width: 100%;
  padding: 8px 12px;
}

.site-header__search {
  flex: 1 1 220px;
  min-width: 120px;
  max-width: 280px;
}

.site-header button:focus-visible,
.site-header a:focus-visible,
.site-header input:focus-visible {
  outline: 2px solid var(--site-header-focus);
  outline-offset: 2px;
}

@media (max-width: 1199px) {
  .site-header__search {
    flex-basis: 180px;
    max-width: 200px;
  }
}

@media (max-width: 991px) {
  .site-header__search {
    flex-basis: 140px;
    max-width: 160px;
  }
}

@media (max-width: 767px) {
  .site-header__search {
    flex: 0 0 44px;
    width: 44px;
    min-width: 44px;
    max-width: 44px;
  }

  .site-header__search:focus-within {
    position: absolute;
    left: 54px;
    right: 54px;
    z-index: 20;
    width: auto;
    max-width: none;
    background: var(--background);
  }

  .site-header__persistence button {
    width: 44px;
    min-width: 44px;
    padding-inline: 0;
  }

  .site-header__persistence button span,
  .site-header__github,
  .site-header__optional-separator {
    display: none;
  }
}
```

### Responsive JS contract

No additional vanilla JavaScript is required. The existing React sidebar state is already the correct controller:

```tsx
const { toggleSidebar, isMobile, openMobile, open } = useSidebar();

<Button
  onClick={toggleSidebar}
  aria-expanded={isMobile ? openMobile : open}
  aria-controls="workspace-navigation"
/>
```

The mobile navigation itself uses the repository's Sheet primitive, so adding another hamburger controller would duplicate state and make keyboard behavior harder to maintain.

### Inline SVG placeholder

```tsx
<svg
  viewBox="0 0 32 32"
  width="32"
  height="32"
  aria-hidden="true"
  focusable="false"
>
  <path d="M6 7h20v18H6z" fill="currentColor" opacity=".18" />
  <path d="M9 10h14v12H9z" fill="currentColor" />
</svg>
```

The repository already has `FullLogo`; replace its internal mark only if a finalized SVG asset is supplied.

## 6. Testing checklist

### Manual
- [ ] Tab through every header control.
- [ ] Shift+Tab reverses the same logical order.
- [ ] Every focused control has a visible outline.
- [ ] Sidebar toggle exposes expanded/collapsed state.
- [ ] Mobile sidebar opens with keyboard activation and closes with Escape.
- [ ] Mobile search can be focused and typed into.
- [ ] New/Open/Save remain reachable at 375px.
- [ ] Save remains visually prominent.
- [ ] No header/page horizontal scrollbar at 375, 390, 414, 480, 768, 992, 1200, 1440px.
- [ ] Sticky header does not completely cover focused content.
- [ ] Test light and dark themes.
- [ ] Test 200% text zoom and 320px-equivalent reflow.

### Automated
- [ ] Playwright at 375/390/414/480/768/992/1200/1440.
- [ ] Axe/Lighthouse accessibility scan.
- [ ] Assert `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
- [ ] Assert required header controls are >=44×44px.
- [ ] Assert no header element extends beyond viewport.
- [ ] Record keyboard traversal order.
- [ ] Lighthouse targets: Accessibility >=95, Best Practices >=95, Performance >=90, with no new critical accessibility failures.

## 7. Priority task list

| Priority | Task | Effort | Location |
|---|---|---|---|
| P0 | Remove header horizontal scrolling | Low | `app/(dashboard-layout)/layout/vertical/header/index.tsx` |
| P0 | Add responsive header contract | Medium | `app/css/components/site-header.css` |
| P0 | Preserve 44px targets and focus | Low | Header stylesheet |
| P1 | Keep sticky header in normal flow | Low | Header component |
| P1 | Remove fixed-header compensation padding | Low | `app/(dashboard-layout)/layout.tsx` |
| P1 | Verify mobile search/action reachability | Medium | Header Playwright suite |
| P2 | Add light/dark contrast assertions | Medium | Accessibility tests |
| P2 | Add screenshot regression coverage | Medium | `scripts/header-collision-audit.spec.mjs` |

## 8. Acceptance criteria

- One visual header row at desktop, tablet and mobile.
- No header-level horizontal scrolling.
- Desktop preserves: brand / sidebar / search | status + New/Open/Save | Sign in | GitHub | theme.
- Mobile preserves the primary workflow CTA (Save), sidebar access, search access, auth and theme.
- Header interactive targets remain >=44px.
- Mobile sidebar remains keyboard accessible through the existing Sheet primitive.
- Focus indicators remain visible.
- Sticky header does not completely obscure keyboard-focused content.
