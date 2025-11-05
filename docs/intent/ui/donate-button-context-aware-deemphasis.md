---
title: Context-aware Button Deemphasis for Donation Portal
domain: ui
status: active
version: 1
created: 2025-11-05
updated: 2025-11-05
related_issues: []
related_prs: []
references:
  - ../../guide/ui/
  - ../../reference/ui/
  - ../ui/donate-page-hero-context.md
---

# Context-aware Button Deemphasis for Donation Portal

## Overview

This intent document describes the design rationale for introducing **context-aware deemphasis** of the "寄付する" (Donate) button in the header, particularly on the `/donate` page. The goal is to improve user experience by reducing visual emphasis on the donation CTA when users are already in the donation flow.

## Background & Problem

### Current State
- The "寄付する" (Donate) button in the header uses a `primary` variant (dark background, high emphasis) across all pages
- On the home page, a `primary` CTA in the hero section is displayed alongside the header button
- On the `/donate` page, the header button remains in `primary` state despite users already being in the donation flow

### User Experience Issue
- **User Intent Clarity**: When a user navigates to `/donate`, they have already demonstrated clear intent to donate
  - Displaying a prominent "寄付する" button in the header is redundant
  - The main content area contains the donation menu and authentication flows, which should remain the primary focus
  
- **Visual Hierarchy Problem**: 
  - Multiple prominent CTAs (header button + page content) compete for attention
  - Reduces clarity about what users should focus on next
  - Particularly confusing on mobile where space is limited

- **Design Consistency**: 
  - Home page successfully suppresses the header button when hero section is in view
  - Donate page lacks this context awareness, leading to inconsistent patterns

## Design Decision

### Solution: Context-aware Button State Management

Instead of detecting the presence of a hero section, use an **explicit, page-level flag** (`shouldDeemphasizeButton`) in the `HeroContext` to indicate when the button should be deemphasized.

#### Rationale for Approach

1. **Direct Intent Representation**
   - The page itself, not visual elements, determines button state
   - More maintainable: adding/removing hero sections doesn't accidentally change button behavior
   - Clearer for future developers: `setShouldDeemphasizeButton(true)` is self-documenting

2. **Separation of Concerns**
   - Hero context manages both visibility detection (for home page) and explicit page state (for donate page)
   - Avoids the need to create artificial hero sections on pages that don't logically require them

3. **Extensibility**
   - Future pages can opt-in to button deemphasis by simply calling the setter
   - No architectural changes required

### Naming Decision: "Deemphasis" vs. Alternatives

After evaluation, **"deemphasized"** was chosen over alternatives:

| Candidate | Reason Accepted/Rejected |
|-----------|-------------------------|
| `"suppressed"` | ❌ Negative connotation; doesn't clarify intent |
| `"secondary"` | ❌ Conflicts with Button variant `secondary`, creating lexical ambiguity |
| `"subtle"` / `"muted"` | ⚠️ Descriptive of style rather than state purpose |
| `"contextual"` | ✅ Neutral; indicates context-driven display |
| **`"deemphasized"`** | ✅ Direct semantic meaning; clearly indicates reduced visual priority |

**Decision**: `"deemphasized"` provides the clearest intent without conflicting with existing UI terminology.

## Implementation Strategy

### Context Extension

Extend `HeroContext` to track page-level deemphasis intent:

```typescript
interface HeroContextType {
  heroInView: boolean;
  hasHeroSection: boolean;
  shouldDeemphasizeButton: boolean;
  setShouldDeemphasizeButton: (value: boolean) => void;
  buttonShouldBeDeemphasized: boolean; // computed: heroInView || shouldDeemphasizeButton
}
```

### Page-level Application

| Page | Mechanism | Reasoning |
|------|-----------|-----------|
| **Home** | Hero section visible → `heroInView = true` | User is reviewing hero content; donation CTA is secondary to information |
| **Donate** | Page mount → `setShouldDeemphasizeButton(true)` | User has explicit donation intent; page content is primary |
| **Donors** | Default (false) | Users are browsing; donation CTA should remain prominent |
| **Other pages** | Default (false) | Fallback: promote donation across the site |

### Header Button Behavior

```tsx
// app-shell.tsx
const { buttonShouldBeDeemphasized } = useHeroContext();

variant={buttonShouldBeDeemphasized ? 'outline' : 'primary'}
data-state={buttonShouldBeDeemphasized ? 'deemphasized' : 'active'}
```

## Expected User Experience Outcomes

| Scenario | Before | After | Benefit |
|----------|--------|-------|---------|
| **Home page, hero visible** | Header button `primary` | Header button `outline` | Focus on hero message |
| **Home page, scrolled past hero** | Header button `primary` | Header button `primary` | CTA becomes prominent when user leaves hero |
| **Donate page, anywhere** | Header button `primary` | Header button `outline` | Page content (authentication + menu) is primary focus |
| **Donors page** | Header button `primary` | Header button `primary` | Donation CTA remains visible and accessible |

## Trade-offs & Considerations

### Benefits
✅ Clearer visual hierarchy on `/donate` page  
✅ Consistent pattern with home page hero behavior  
✅ Reduced cognitive load (fewer competing CTAs)  
✅ Extensible to other context-driven pages  

### Trade-offs
⚠️ Header button becomes less visible on `/donate` → users may miss it if they scroll past the donation menu  
⚠️ Adds state management complexity to `HeroContext` → code becomes slightly more complex  

### Mitigation
- The "寄付する" button remains accessible in header with `outline` variant (not hidden)
- Users already on `/donate` typically don't need the header button; main content provides CTA
- Clear visual feedback (opacity change) signals state transition

## Related Decisions & Cross-references

- **Button Variants**: See `docs/reference/ui/button-variants.md` for styling details
- **Header Styling**: See `docs/reference/ui/header-layout.md` for responsive header behavior
- **Hero Context Usage**: See `docs/guide/ui/hero-context-usage.md` for implementation patterns

## Future Considerations

1. **Analytics**: Track donation button clicks by page to validate that deemphasis improves focus on page-primary CTAs
2. **Mobile Optimization**: Consider further UI adjustments if header space becomes critical on very small screens
3. **Pattern Reuse**: This context-aware pattern may be applied to other CTAs (e.g., "支援者一覧") based on page context

## Acceptance Criteria

- [ ] `HeroContext` extended with `shouldDeemphasizeButton` state and setter
- [ ] Header button uses `buttonShouldBeDeemphasized` for variant selection
- [ ] `/donate` page calls `setShouldDeemphasizeButton(true)` on mount
- [ ] Button state correctly reflects context (primary on home scrolled, outline on donate)
- [ ] No visual regressions on other pages
- [ ] Tested on mobile (< 640px) for layout stability
- [ ] Guide documentation updated with examples
- [ ] Related PRs and issues linked in front-matter

---

**Authors**: Copilot AI  
**Last Reviewed**: 2025-11-05  
**Review Status**: Pending implementation review
