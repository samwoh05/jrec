# Jensen — Design System (Master)

Global source of truth for the Jensen portfolio + After Work Haus promotion site.
Page-specific overrides (if any) go in `design-system/pages/<page>.md`.

## Concept — "The 5–9"

After Work Haus's line is *"Our 5-9 after the 9-5."* The whole site is structured as one evening.
Every section carries a time stamp (17:00 → 20:59), and the nav clock advances from 17:00 to 21:00 as
you scroll. The hero is framed like a camera viewfinder (REC + running timecode). The tone is nocturnal,
cinematic, moto-magazine. The work is always the brightest thing on the page.

## Color tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0B0A09` | Asphalt: page background |
| `--bg-2` | `#131110` | Raised surfaces, image placeholders |
| `--bg-3` | `#1C1917` | Hover surfaces |
| `--fg` | `#F1EBE1` | Bone: primary text on dark |
| `--fg-2` | `#B5ADA1` | Secondary text (8.9:1 on bg) |
| `--fg-3` | `#857E74` | Labels/meta only (4.8:1 on bg) |
| `--fg-dim` | `#6E6860` | Inactive display type only (3.6:1, large text) |
| `--line-strong` | `rgba(241,235,225,.38)` | Control borders: chips, outline buttons (3.2:1) |
| `--accent` | `#FF4B1F` | Taillight: CTAs, REC, active states (5.9:1 on bg) |
| `--on-accent` | `#0B0A09` | Text on accent fills. **Never white on accent** (3.3:1 fails) |
| `--bone` | `#EEE7DC` | The Haus section background |
| `--ink` | `#0B0A09` | Text on bone |
| `--ink-2` | `#4A443D` | Secondary text on bone (8.1:1) |
| `--accent-ink` | `#B8300B` | Accent *text* on bone (5.1:1). Raw `--accent` on bone fails for text |
| `--ink-line-strong` | `rgba(11,10,9,.55)` | Control borders on bone (4.2:1) |

## Typography

| Role | Family | Settings |
|---|---|---|
| Display | Archivo (variable) | `font-stretch: 125%`, weight 800–900, uppercase, line-height .8–.9, tracking −0.02 to −0.035em |
| Condensed labels | Archivo | `font-stretch: 62.5%–87.5%` |
| Body | Archivo | 100% stretch, 400, 1–1.125rem, line-height 1.6 |
| Accent | Instrument Serif *italic* | Only for single emphasized words inside headlines (`h2 em`) |
| Meta | JetBrains Mono | .75rem, uppercase, tracking .08–.12em. Time stamps, captions, HUD |

Body copy and labels use **rem** so they follow the reader's browser text size (tested at 150%).
Display headlines use `clamp(px, vw, px)` on purpose: they're sized to the layout, like artwork.

One variable family (Archivo) covers both the expanded headlines and condensed labels, which keeps
the page consistent without loading a fourth font.

## Spacing & layout

- Gutter: `clamp(16px, 4vw, 56px)`; max width 1520px.
- Section rhythm: `clamp(96px, 14vw, 200px)` vertical padding (spacious, density 3/10).
- Asymmetric 12-column editorial grid on desktop; single column below 768px.
- Breakpoints: 375 / 768 / 1024 / 1440.
- Corners: 0 radius everywhere (camera/print feel), except round REC dot, play button and badge.

## Motion

- Easing: `--ease-out: cubic-bezier(.16,1,.3,1)`. Durations: 160 / 280 / 600 / 1000ms; reveals 800ms with a 50ms stagger.
- Hero: letter-by-letter rise, viewfinder corners draw in, timecode runs only while the video plays.
- Scroll: fade/rise reveals (`data-reveal`), curtain reveals for figures (`data-reveal="clip"`; a pseudo-element
  curtain, because clip-path on the observed element stops IntersectionObserver from firing).
- **No endless ambient loops.** The ticker and the "5–9" badge are scroll-linked, so they move only while the reader
  scrolls. Grain is static. The nav REC dot blinks three times and then holds.
- **Every autoplaying video has a visible pause control** (hero: Pause/Play; Motion preview: Pause preview).
- **`prefers-reduced-motion: reduce`** (and Data Saver, for video) disables all of it: no autoplay, no scroll-linked
  ticker/badge, no parallax, and content renders in its final state.

## Components

- **Buttons**: `btn--accent` (primary), `btn--ghost` (secondary on dark), `btn--ink` / `btn--line-ink` (on bone). Min height 48px (44px for `btn--sm`).
  One accent button per view: the nav "Book a shoot" is a ghost button that fills with accent on hover.
- **Press feedback**: buttons scale to .98 (controls .96) on `:active`; photo/film cards dim. Transforms only, so layout never shifts.
- **Stamp**: `HH:MM / Label` mono label that opens every section.
- **Filter chips**: `button[aria-pressed]`, min 44px tall.
- **Dialogs**: native `<dialog>` for the menu, lightbox and video player (focus trap + Esc for free).
  The lightbox and player push a history entry, so the phone's Back gesture closes them instead of leaving the site.
  Photo changes in the lightbox are announced through a polite live region.

## Rules

- No emoji as icons; inline SVG (Lucide geometry) only.
- Every autoplaying video: muted, has a visible pause control, pauses off-screen, never autoplays under reduced motion.
- Hover is never the only way in: gallery captions show in the lightbox, "four lives" activates on scroll.
- Focus ring: 2px accent outline, 3px offset, always visible on keyboard focus.
- Images: WebP with `srcset`, explicit width/height (no CLS), `loading="lazy"` below the fold.
