# Design system & implementation guide

The website for George's AG Super Value — 66 Main St, Enfield NH. Plain HTML, CSS
and JavaScript, no build step. Open `design-system.html` in a browser to see every
token and component rendered live.

**Context this was designed for**

| | |
|---|---|
| Platform | Responsive web, built mobile-first and PWA-ready |
| Industry | Independent grocery retail, single location |
| Audience | Upper Valley locals, roughly 25–75, mixed technical confidence |
| Personality | Warm and plainspoken. Not premium, not precious |
| The page's one job | Tell someone what's on sale this week and how to get to the store |

---

## 1. The concept

**The circular, made native.**

The store's paper flyer is the most characteristic thing it owns: mint-green stock,
black ink, prices set enormous, and a dotted leader line running from each product
name to its price. That flyer is the design language. The interaction model on top of
it is native-mobile — 44px targets, a tab bar, a sheet you can drag away.

Three decisions follow from that, and they're the ones worth defending:

**The hero is the price list, not a slogan.** A marketing headline over a stock photo
is what every grocery site does. What this store actually has to say first is *what is
cheap this week*, so the three Blockbuster deals are the first thing on the page, set
like the paper flyer. The story about 1965 comes after.

**Prices get hierarchy from scale, not colour.** On the paper flyer, prices are the
same black ink as everything else — what makes them shout is that they're four times
the size. So the price is the brightest neutral in both themes, set in Anton, and
the green is spent only on actions. One accent, used once.

**The leader line is the signature.** `Folgers ·············· $6.99`. It's lifted
straight off the client's own printed material, it costs nothing to render (a repeating
radial gradient), and no other grocery site has it.

---

## 2. Colour

Every value lives in `styles.css` under `@layer tokens`. Two themes, both first class:
dark is the default, light is the flyer's own paper. The site follows the visitor's OS
setting until they pick one themselves, and then remembers their choice.

### Semantic tokens

| Token | Job |
|---|---|
| `--canvas` | The page ground |
| `--surface` / `--surface-raised` / `--surface-sunken` | Cards, lifted things, recessed panels |
| `--ink` / `--ink-secondary` / `--ink-tertiary` | Text, in three levels of importance |
| `--accent` | Actions and brand. Nothing else |
| `--flag` | The Blockbuster starburst. Nothing else |
| `--danger` / `--info` | Destructive, informational |

There's a nine-step primary ramp (`--green-50` … `--green-900`) behind those; the
semantic tokens point into it so a theme change is one block of CSS, not a find-and-replace.

### Contrast — measured, not assumed

Every pairing was run through the WCAG formula. Results:

| Pairing | Dark | Light |
|---|---|---|
| Primary text on canvas | 17.8:1 AAA | 15.7:1 AAA |
| Secondary text | 8.5:1 AAA | 6.4:1 AA |
| Tertiary text | 4.6:1 AA | 5.1:1 AA |
| Accent on canvas | 9.7:1 AAA | 4.8:1 AA |
| Text on accent fill | 9.2:1 AAA | 5.4:1 AA |

The light tertiary started at 3.98:1 and was darkened from `#6B7A71` to `#5A6960` to
clear 4.5:1. **High contrast:** `prefers-contrast: more` thickens every border and
raises the two quiet text levels.

### Colour independence

No information is carried by colour alone. The Blockbuster flag is amber *and* a ★
*and* the word "Blockbuster". The open/closed dot is green/red *and* says which. An
added item shows a check mark, not just a green fill.

### The aisle palette — colour as wayfinding

One colour per department, the way a real store colour-codes its aisle signage:
meat, deli, produce, bakery, dairy, frozen, household, beverages and gas each get
their own hue. It shows up three places — a department's icon on the homepage, the
dot and sliding indicator on the weekly-ad filter, and a 3px edge on a deal card —
and nowhere else. Actions stay the single green accent no matter which department a
product belongs to; colour here identifies a *place in the store*, not a thing to do.

Two buckets are deliberately left neutral: "All items" and "Grocery" (the catch-all
pantry aisle), same reasoning as the "Grocery" department card — a colour for
*everything* isn't wayfinding, it's noise. A Blockbuster card always keeps its full
amber ring instead of its department's edge colour; status outranks wayfinding.

Every hue was contrast-checked the same way as the base palette: the label text on
its filled chip clears 4.5:1, and the icon on its own quiet tint clears 3:1, in both
themes.

| Department | Fill | On-fill text |
|---|---|---|
| Meat | `#D8383D` | white |
| Deli | `#C76A0B` | near-black |
| Produce | `#4C9A2A` | near-black |
| Bakery | `#B75B3D` | white |
| Dairy | `#2176C7` | white |
| Frozen | `#0E93AC` | near-black |
| Household | `#7C4CE0` | white |
| Beverages | `#C93FB0` | near-black |
| Gas | `#5C6DE0` | black |

Each hue is one flat value shared by both themes — only the quiet tint behind an
icon differs, and that's mixed live with `color-mix(in srgb, var(--aisle-x) N%,
var(--surface))`, so it adapts to whichever theme is active without a second set of
tokens per hue.

---

## 3. Type

Two families, three weights total.

- **Anton** — the circular's price voice. Prices, the year 1965, the stat numbers,
  the logo mark. One weight. It never sets prose.
- **Figtree** — everything else, at 400 / 600 / 800.

If the display font fails to load (offline, blocked CDN), JS adds `.no-display-font`
and the fallback thickens to 800 so a price never renders thin.

The scale matches iOS text styles, because those are already tuned for arm's length
on a phone: 12 / 13 / 15 / **17 body** / 20 / 24 / 28 / 34 / 44, plus a fluid display size.

- **17px body** — above the 16px floor, so iOS Safari never zooms when a field is focused.
- **1.55 body / 1.12 headings** — inside the 1.4–1.6 and 1.1–1.3 bands.
- **`--measure: 68ch`** — keeps prose in the 45–75 character range.

---

## 4. Touch

| Rule | How it's met |
|---|---|
| 44 × 44px minimum | `--touch-min`, applied to every button, link and control. Verified in the browser — zero elements under 44px |
| 8px between targets | `--touch-gap` on every action row |
| Thumb reach | Primary actions sit in the bottom third: the tab bar, the sheet footer |
| Gesture conflicts | A row swipe locks to an axis after 8px of movement, so it never fights the scroller. `touch-action: pan-y` backs this up at the browser level |
| 100ms feedback | Press states are pure CSS `:active` — no JavaScript in the path, so they can't be delayed by work on the main thread |
| Haptics | 6–12ms, on committed actions only (add, remove). Never on scroll or hover. Silently absent on iOS Safari, which doesn't expose the API |

---

## 5. Micro-interactions

Each is specified as trigger → rules → feedback → mode. All of them animate only
`transform` and `opacity` — the two properties a browser can composite on the GPU
without re-running layout.

| Interaction | Trigger | Feedback | Mode | Timing |
|---|---|---|---|---|
| **Press** | Touchdown on any control | Scales to 0.965; round buttons to 0.88 | Momentary | 120ms spring |
| **Add to list** | Tap + | Icon becomes a check, button fills, tab badge springs, 12ms haptic, toast with Undo | Item saved to this device | 180–240ms |
| **Filter** | Tap a department | One pill slides to it; grid re-renders; count announced to screen readers | Persists until changed | 240ms |
| **Search** | Typing | Clear button appears; live region reads the result count | Narrows within the active filter | Instant |
| **Sheet** | My List tab | Rises from the bottom edge, scrim fades in | Modal: scroll locked, focus trapped | 300ms |
| **Sheet drag** | Drag the grabber | Follows your finger, resists upward, scrim fades with the distance | Past 96px or a fast flick, it closes | Follows finger |
| **Swipe row** | Drag a row left | Red Remove revealed at 88px | Past 160px it commits | Follows finger |
| **App bar** | Scroll past 40px | Hairline appears; page title fades in as the brand fades out | Sticky | 240ms |
| **Theme** | Tap sun/moon | Whole page cross-fades via the View Transitions API where supported | Overrides the OS from then on | 240ms |
| **Reveal** | Section enters view | 10px rise and fade, once, then the observer lets go | One-shot | 420ms, stagger ≤180ms |

**`prefers-reduced-motion: reduce` collapses every duration to 0.01ms and shows all
revealed content immediately.** Nothing becomes unreachable; the page just stops moving.
Haptics switch off with it too — vibration is motion.

### Patterns deliberately not used

Your brief lists these; here's why each is absent, because choosing *not* to use a
pattern is a design decision too:

- **Pull-to-refresh** — the page has nothing to fetch. The gesture would be theatre.
- **Skeleton screens** — content is local and paints immediately. A fake loading state
  would make the site feel slower, not faster.
- **Floating action button** — the primary action already lives in the tab bar. Two
  competing primaries is one too many.

---

## 6. Accessibility checklist

- [x] **Contrast** — every text pairing measured at 4.5:1 or better, both themes
- [x] **Touch targets** — nothing under 44 × 44px, verified in-browser
- [x] **Focus** — one visible 3px ring on everything focusable, in both themes
- [x] **Semantic markup** — real `header` / `main` / `section` / `nav` / `footer`,
      one `h1`, headings in order, every section labelled by its own heading
- [x] **Gestures are never the only path** — swipe-to-delete is an accelerator; every
      row also carries a real Remove button reachable by mouse, keyboard and screen reader
- [x] **Modal behaviour** — the sheet traps focus, closes on Escape, and returns focus
      to whatever opened it
- [x] **Live regions** — filter and search results announce politely; the toast is a
      `role="status"` that never steals focus
- [x] **Motion** — `prefers-reduced-motion` respected throughout
- [x] **High contrast** — `prefers-contrast: more` supported
- [x] **No time limits** — the toast auto-hides, but its Undo is never the only way back;
      re-adding an item is always possible
- [x] **Plain language** — "Add to my list", not "Submit". Errors say what to do next
- [x] **Colour independence** — every state has a shape or a word as well as a colour

### Screen reader notes

The `+` button announces the product, its price and the action
(`"Barilla Pasta, $0.98. Add to my list"`), and carries `aria-pressed` so its state is
spoken. The swipe-reveal button underneath is `aria-hidden` with `tabindex="-1"` — the
visible Remove button is its accessible twin, so nothing is announced twice.

---

## 7. Performance

**What's actually shipped:** one 43KB stylesheet, one 21KB HTML file, two small JS
files. No framework, no build step, no images — every icon is inline SVG and the
flyer's leader lines are a CSS gradient. That's the largest performance decision on the page.

| Technique | How it's applied |
|---|---|
| Critical path | One tiny inline script sets the theme before first paint so the page can't flash the wrong colours. It's the only blocking script |
| Deferred JS | Both scripts are `defer`, so parsing is never blocked |
| Fonts | `display=swap` with a weight-corrected fallback, preconnect to both font hosts |
| Animation | `transform` and `opacity` only — no animation touches width, height, top or left |
| Layer hints | `will-change` is set at the *start* of a sheet drag and removed when it ends. Leaving it on permanently wastes memory |
| Scroll | Every scroll and touchmove listener is `{ passive: true }`; the scroll handler is throttled with `requestAnimationFrame` |
| Event hygiene | The 25 deal cards share one delegated listener, so re-rendering can't leak handlers. IntersectionObserver unobserves each element after it fires |
| Images | None — but if photos are added later: WebP, explicit `width`/`height` to reserve space, and `loading="lazy"` below the fold |

---

## 8. Platform notes

**iOS Safari**
- `viewport-fit=cover` plus `env(safe-area-inset-*)` keeps the tab bar and sheet clear
  of the home indicator and the notch.
- 17px inputs prevent the zoom-on-focus jump.
- `-webkit-backdrop-filter` is included alongside the standard property.
- No haptics available from the web — `navigator.vibrate` is absent, and the code
  handles that silently rather than breaking.
- `-webkit-tap-highlight-color: transparent` removes the grey flash so our own press
  state is the only feedback.

**Android Chrome**
- `navigator.vibrate` works, so haptics land here.
- Material's comfortable target is 48px; the tab bar and search field use it, and
  nothing is below the 44px floor.
- `overscroll-behavior: contain` on the sheet stops the page behind it from scrolling.

**Desktop web**
- At 860px the tab bar is replaced by a top nav and the sheet becomes a side panel —
  a bottom sheet is a phone idiom and looks wrong on a monitor.
- Hover states are inside `@media (hover: hover)` so touch devices never get a stuck
  hover after a tap.

---

## 9. Testing

**Automated, per change** (`node scratch/shot.mjs` style Playwright runs):
- Render at 320, 390, 768, 1024 and 1440px; assert the page never scrolls horizontally
- Walk every button, link and input; assert none is under 44 × 44px
- Assert zero console errors and zero uncaught exceptions
- Exercise the real flows: filter, search, add, remove, total, clear
- Run once with `colorScheme: light` and once with `reducedMotion: reduce`

**Manual, before a release:**
- Tab through the whole page — is the focus ring always visible, is the sheet trapped,
  does Escape close it, does focus return where it started?
- VoiceOver (iOS) and TalkBack (Android) through the add-to-list flow
- A real phone in sunlight — the light theme exists partly for this
- Airplane mode: the webfonts fail and the fallback must still look right
- Print preview with items on the list — you should get just the list

**Browser support:** current Chrome, Safari, Firefox and Edge, plus iOS Safari 15+ and
Chrome for Android. `color-mix()` and cascade layers need Safari 16.4+ / Chrome 111+;
older browsers lose some tinting but the page stays perfectly usable. The View
Transitions theme cross-fade is progressive enhancement — where it's missing, the
theme just switches instantly.

---

## 10. Files

| File | What it holds |
|---|---|
| `index.html` | The page. Semantic markup, all copy |
| `styles.css` | The whole design system, in cascade layers: `tokens → base → components → sections → utilities` |
| `app.js` | Behaviour and micro-interactions, commented by interaction |
| `data/products.js` | **The weekly flyer.** The only file to edit most weeks |
| `design-system.html` | Living style guide, rendered by the real stylesheet |

### Why cascade layers

`@layer tokens, base, components, sections, utilities;` at the top of the stylesheet
sets the priority order once. A rule in `sections` always beats one in `components`
regardless of how the selectors are written — which is why there's no `!important`
anywhere and no long selector chains. If you add CSS, put it in the right layer and
specificity stops being something you have to think about.
