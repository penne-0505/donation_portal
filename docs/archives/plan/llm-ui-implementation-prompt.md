---
title: 'LLM UI 実装プロンプト'
domain: 'donation-portal'
status: 'deprecated'
version: '0.1.0'
created: '2025-11-02'
related_docs:
  - ./ui-design-brief.md
  - ../survey/donation-portal/functional-requirements-survey.md
---

This prompt is intended for an expert frontend designer and UI/UX engineer LLM tasked with implementing the Donation Portal UI based on the provided design brief.

````

# Donation Portal UI Implementation Request

---

You are an expert frontend designer and UI/UX engineer. Create a complete, production-ready UI for a Donation Portal built with Next.js (app router).

Design and implement the following pages with a focus on user experience, visual hierarchy, and intuitive interaction. Follow the design specifications detailed below.

## Page Requirements

### 1. `/donate` - Donation Entry Page

**User Flow**:
- Display donation purpose and clear disclaimers: "This donation includes no rewards or benefits" and "Not tax-deductible"
- Show Discord login button as entry point
- After user logs in via Discord OAuth, display: donor display name (retrieved from Discord) and a toggle for "Consent to public listing"
- Offer three donation options: one-time ¥300, monthly ¥300, yearly ¥3,000
- When session expires (10 min TTL), show a login prompt to re-authenticate
- Checkout button proceeds to Stripe payment

**Visual Design**:
- Header with gradient text: "寄付してコミュニティを応援する"
- Three donation menu cards with glassmorphic style and individual gradient colors:
  - ¥300 / One-time: gradient blue→cyan with blue glow
  - ¥300 / Monthly: gradient green→emerald with green glow
  - ¥3,000 / Yearly: gradient amber→gold with gold glow
- Discord login button: purple glow, glassmorphic style
- Background: subtle radial glow from selected menu color (opacity 0.05–0.1)

**Interactions**:
- Card hover: subtle elevation effect + glow intensity increase (+20%)
- Button click: smooth scale animation + glow pulse
- Toggle switch: smooth color transition + small ping effect
- Menu selection: selected card glows brighter, background radial glow activates

---

### 2. `/thanks` - Post-Donation Confirmation Page

**Content**:
- Display a thank you message
- Link back to `/donate`
- No mention of donation amount, rewards, rankings, or special benefits
- Keep it simple and celebratory

**Visual Design**:
- Gradient text title: "ありがとうございます" (typewriter effect)
- Background: radial gradient from center (gold/amber tint, opacity 0.08)
- Thank you message: fade-in animation with staged transitions
- Confetti animation overlay (utilize existing `confetti-celebration.tsx`)
- Back button: `/donate` link with pulse glow animation

**Animations**:
- Elements appear from top with slide-in transitions
- Confetti begins on page load
- Background brightens during animation (achievement feeling)
- Total animation sequence: 5–7 seconds

---

### 3. `/donors` - Public Donor List Page

**Content**:
- Fetch and display a list of donor display names from the API
- Show total donor count
- Include sorting options with visual differentiation:
  - Newest first (desc): up arrow + "Recently" label, blue accent
  - Oldest first (asc): down arrow + "Early supporters" label, cyan accent
  - Random order: shuffle icon + "Surprise order" label, purple accent
- Provide guidance text: "To withdraw your public listing, log in again and toggle your consent"
- Note about cache: "Your preference may take up to 60 seconds to reflect"

**Visual Design**:
- Sort toggle buttons with color accents matching their function
- Donor list: names displayed with stage fade-in animations
- Self-identification: if your own name appears, highlight with inner glow + subtle background color change
- New donors: display with "new" label and flicker animation

**Interactions**:
- List display: slide-in from top
- Sort toggle: smooth list re-render with transition animations
- Name highlighting: subtle glow and color change

---

### 4. `/privacy` (Optional) - Privacy & Contact Page

**Content**:
- Contact information
- Data handling and privacy policy (concise)
- Explanation of how Stripe and Discord are used
- Professional, transparent tone

---

## Design System & Styling

### Glassmorphism

Apply to main interactive cards and overlays:

**Light Mode**:
- Background: `rgba(255, 255, 255, 0.1)`
- Backdrop-filter: `blur(10px)`
- Border: `1px solid rgba(255, 255, 255, 0.2)`

**Dark Mode**:
- Background: `rgba(0, 0, 0, 0.3)`
- Backdrop-filter: `blur(10px)`
- Border: `1px solid rgba(255, 255, 255, 0.05)`

**Apply to**:
- Donation menu cards
- Login button
- Session timeout notification overlay

---

### Glow Effects

**Color Palette**:
- One-time donation: blue glow (`#3B82F6`)
- Monthly donation: green glow (`#10B981`)
- Yearly donation: amber glow (`#F59E0B`)
- Discord login: purple glow (`#5865F2`)
- Consent toggle (checked): green glow (`#10B981`)

**Implementation**:
- Use `filter: drop-shadow()` for performance
- Light mode intensity: 0.7x
- Dark mode intensity: 1.0x
- CTA buttons: radial glow that intensifies on hover
- Ambient background glow: very subtle, semi-transparent

---

### Gradients

**Color Gradients by Menu**:
- One-time: `linear-gradient(90deg, #3B82F6, #06B6D4)` (blue → cyan)
- Monthly: `linear-gradient(90deg, #10B981, #34D399)` (green → emerald)
- Yearly: `linear-gradient(90deg, #F59E0B, #FBBF24)` (amber → gold)

**Application**:
- Page title text: `background-clip: text; -webkit-text-fill-color: transparent`
- Menu card backgrounds: linear gradient at 45 degrees (optional animation on hover)
- `/thanks` page background: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1), transparent)`

**Animated Gradients** (Optional Polish):
- On CTA button hover: gradient direction animates (45deg → 90deg) over 3–5 seconds

---

### Color Palette

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | #FAFAFA | #0F172A |
| Text Primary | #1F2937 | #F3F4F6 |
| Card Background | `rgba(255,255,255,0.1)` | `rgba(0,0,0,0.3)` |
| Card Border | `rgba(255,255,255,0.2)` | `rgba(255,255,255,0.05)` |
| Glow Intensity | 0.7x | 1.0x |
| Ambient Glow Opacity | 0.03 | 0.08 |

---

## Micro-Interactions

- **Button Hover**: subtle scale (1.02x) + glow intensity increase
- **Button Click**: smooth scale animation (1.02x → 1.0x) + glow pulse
- **Toggle Switch**: color transition + small "ping" effect
- **Loading State**: spinner with subtle backdrop blur overlay
- **Fade-In/Slide-In**: use CSS transitions (150–300ms)
- **Checkmark**: draw-stroke animation on consent confirmation

---

## Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Card layout: 1 column on mobile, 3 columns on desktop (for donation menu)
- Donor list: single column, cards or list items
- Touch-friendly: buttons ≥ 44px height, adequate spacing

---

## Accessibility & Performance

**Accessibility**:
- WCAG 2.1 AA compliant
- Sufficient contrast ratios (4.5:1 for text, 3:1 for UI components)
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus indicators: clear, visible, non-ambiguous

**Motion & Preferences**:
- Respect `prefers-reduced-motion` media query: disable animations for users who prefer reduced motion
- Provide fallback styles for unsupported CSS features (e.g., backdrop-filter)
- Glassmorphism fallback: solid background color in absence of backdrop-filter support

**Performance**:
- Use `filter: drop-shadow()` instead of `box-shadow` for glow effects (GPU-efficient)
- Limit `backdrop-filter` usage (GPU-intensive)
- Optimize CSS animations using GPU-accelerated properties (transform, opacity)
- Lazy-load images if any

---

## Implementation Notes

**Technology Stack**:
- Next.js (app router)
- CSS Modules or Tailwind CSS for styling
- Assume backend APIs are fully implemented (`/api/oauth/start`, `/api/checkout/session`, `/api/donors`)
- Assume session management via cookies is handled by backend
- Assume Stripe Checkout integration is configured

**Component Scope**:
- Focus on page layouts, components, and visual design
- Assume backend provides:
  - `sess` cookie with `display_name`, `discord_id`, `consent_public`
  - `/api/donors` endpoint returning list of donor names and total count
  - `/api/checkout/session` endpoint for Stripe integration
  - `/oauth/start` and `/oauth/callback` for Discord login

**File Structure** (Suggested):
```
app/
  (app-shell)/
    layout.tsx
    page.tsx        # Home or redirect
    donate/
      page.tsx
    thanks/
      page.tsx
    donors/
      page.tsx
    privacy/        # Optional
      page.tsx

components/
  pages/
    donate-page.tsx
    thanks-page.tsx
    donors-page.tsx
    privacy-page.tsx
  ui/
    donation-card.tsx
    sort-toggle.tsx
    donor-list.tsx
```

---

## Design Principles Summary

- **Minimal & Austere**: Clean, uncluttered aesthetic; focus on functionality
- **Subtle Elegance**: Glassmorphism, glow, and gradients enhance without overwhelming
- **Contribution Feeling**: Micro-interactions and celebration animations reinforce positive user sentiment
- **Dark Mode Ready**: Seamless adaptation to both light and dark themes
- **Accessibility First**: All visual effects support keyboard navigation and reduced-motion preferences

---

## Expected Deliverables

1. **Component Structure**: Clear organization of page layouts and reusable components
2. **Visual Specifications**: Detailed styling decisions (colors, typography, spacing)
3. **Interactive States**: Illustrations or descriptions of key UI states (loading, error, logged-in, logged-out, selected, etc.)
4. **Responsive Breakpoints**: How layouts adapt across device sizes
5. **Animation Descriptions**: Timing, easing, and effects for key interactions
6. **Accessibility Checklist**: Confirmation of WCAG 2.1 AA compliance measures
7. **Code Samples** (Optional): TSX/component snippets demonstrating key patterns

---

## Notes

- Design focused on elegance and user experience
- Visual effects should enhance, not distract
- All functionality is backend-provided; UI integrates seamlessly
- Test thoroughly on mobile, tablet, and desktop
- Ensure animations feel natural and responsive

Thank you. Please deliver a cohesive, production-ready UI design that brings the Donation Portal to life.

````
