# Jensen: Portfolio + After Work Haus

A single-page portfolio for Jensen (photographer, filmmaker, rider, dancer, bandmate) that also promotes his
media agency, **After Work Haus** ([@afterworkhaus](https://www.instagram.com/afterworkhaus/)).

Plain HTML, CSS and JavaScript: no build step, no framework, no dependencies apart from Google Fonts.

## Concept: "The 5–9"

After Work Haus's line is *"Our 5-9 after the 9-5."* The site plays out as one evening:

| Time | Section | What it does |
|---|---|---|
| 17:00 | Hero | Night-ride video framed like a camera viewfinder, with REC and a running timecode |
| 17:00 | Clock out | Who Jensen is |
| 17:45 | Off the clock | Rider / Shooter / Dancer / Bandmate |
| 18:30 | Stills | Filterable photo gallery with lightbox |
| 19:15 | Motion | Featured film + film cards (video player) |
| 20:00 | The Haus | Agency pitch, services, work, process (the page switches to a light "room") |
| 20:59 | Last call | Contact |

The **TC clock** in the nav runs from 17:00 to 21:00 as you scroll and lands on each section's time stamp.

## Run it locally

```bash
cd "Jensen's Portfolio Website"
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly also works. A local server is closer to how it will run once hosted.

## Deploy

Upload the folder as-is to any static host (Netlify drop, Vercel, GitHub Pages, Cloudflare Pages, or plain hosting).

## Replace the placeholder content

**All imagery and video are placeholder stock from Pexels** (free to use, no attribution required).
Swap them for Jensen's own work before launch. All copy is also a first draft for Jensen to approve.
The "After Work Haus" lockup in The Haus section is typographic. If the agency has an official logo, use it there instead.

### Photos (`assets/img/`)
Each image has two sizes, `name-sm.webp` and `name-lg.webp`:

| Orientation | `-sm` width | `-lg` width |
|---|---|---|
| Landscape | 800px | 1600px |
| Portrait | 600px | 1100px |

To replace an image, export his photo at those widths as WebP, keep the same file names, and update the
`width` / `height` attributes plus the `alt` text in `index.html`. Keeping the file names means no other markup changes.
Quick export with ffmpeg: `ffmpeg -i photo.jpg -vf scale=1600:-2 -q:v 80 name-lg.webp`.

**Stills gallery:** each photo is one `<li class="shot" data-cat="moto">`. The fields:

- `data-cat`: one of `moto`, `auto`, `street`, `stage`, `dance`, matching the filter buttons
- `data-title` / `data-meta`: the caption shown on hover and in the lightbox
- `data-full`: the large image the lightbox opens

To add a photo, copy an `<li>` and update the `(12)` count in the heading. JavaScript updates the count when filters are used.

### Video (`assets/video/`)
- `hero.mp4` + `hero-poster.webp`: silent background loop (keep it under ~10s and ~3 MB).
  Encode: `ffmpeg -i in.mov -an -c:v libx264 -crf 27 -preset slow -vf scale=1280:-2 -movflags +faststart hero.mp4`
- `reel.mp4` + `reel-poster.webp`: the featured film preview.
- **Film cards and "Play film"** use `data-play-video="…"`. Point it at a local `.mp4`, **or paste a YouTube or
  Vimeo URL** and the player embeds it automatically (e.g. `data-play-video="https://vimeo.com/123456"`).

### Contact details
Every contact link currently uses **talkafterwork@gmail.com** (from the After Work Haus Instagram bio).
If Jensen has a personal booking email, search and replace it in `index.html`.
Add his personal Instagram, YouTube or Vimeo where the commented-out example sits in the *Last call* section.

### Link preview (`assets/og-image.jpg`)
The card that shows when the link is shared (iMessage, WhatsApp, Instagram DMs, X, LinkedIn, Slack) is a 1200×630 JPG
rendered from `design-system/og-card.html`, which uses `hero-poster.webp` as its background. After swapping the hero
poster, re-render it from the project folder (Chrome saves the image and may then hang; stop it with Ctrl+C):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=8000 \
  --screenshot=og.png "file://$PWD/design-system/og-card.html"
ffmpeg -y -i og.png -q:v 3 assets/og-image.jpg && rm og.png
```

The preview tags in the `<head>` of `index.html` use absolute URLs for `https://samwoh05.github.io/jrec/`.
If the site moves to a custom domain, search and replace that URL. Platforms cache previews: after changing the card,
refresh it with the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (also used by WhatsApp and
Instagram) and the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).

## Files

```
index.html               all content
css/styles.css           design tokens (top of file) + all styles
js/main.js               nav clock, video, reveals, filters, lightbox, player, copy-email
assets/img/              placeholder stills (WebP, two sizes)
assets/video/            placeholder hero loop + featured reel
assets/og-image.jpg      link preview card (1200×630)
design-system/MASTER.md  colours, type, spacing, motion and accessibility rules
design-system/og-card.html  source for the link preview card
```

## Accessibility & performance notes

- `prefers-reduced-motion` (and Data Saver): no video autoplay, no parallax, reveal or scroll-linked motion.
- Nothing loops forever without a control. The ticker and badge only move while you scroll.
  The hero video and the Motion preview each have a visible Pause/Play button and pause when off-screen.
- Phone Back closes an open photo or video instead of leaving the site.
- Body text uses `rem`, so it follows the visitor's browser text size (tested at 150%).
- Lightbox, video player and mobile menu use native `<dialog>`: focus is trapped, Esc closes, and focus returns to the trigger.
- Lightbox: ← / → keys and swipe on touch.
- Text contrast meets WCAG AA (see `design-system/MASTER.md`). Tap targets are at least 44px.
- Images are WebP with `srcset`, lazy-loaded below the fold, and have explicit dimensions (no layout shift).

## Placeholder media sources (Pexels)

Photos: https://www.pexels.com/photo/ followed by the ID below.

| File | Pexels ID |
|---|---|
| jensen-rider | 30012213 |
| life-ride / life-shoot / life-dance / life-band | 4560539 / 14408918 / 11063372 / 10518430 |
| still-moto-sportbike / helmet / headlight | 34757489 / 17462172 / 10855084 |
| still-auto-r34 / evo / gtr | 9661447 / 12590851 / 4940918 |
| still-street-neon / rain | 18867525 / 35131834 |
| still-stage-drummer / mono | 16844640 / 2614942 |
| still-dance-cypher / freeze | 2820896 / 1510540 |
| film-bts / carmeet / event / concert | 19470779 / 9661473 / 5175593 / 416831 |
| awh-auto / events / meet / production | 9827718 / 33588956 / 30145520 / 2773498 |
| lastcall-sunset | 30645602 |

Videos: `hero.mp4` is Pexels video 10597765, and `reel.mp4` is Pexels video 5052676 (https://www.pexels.com/video/ followed by the ID).
