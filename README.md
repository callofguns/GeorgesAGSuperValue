# George's AG Super Value — website

A fast, modern website for George's AG Super Value (66 Main St, Enfield, NH).
It's plain HTML, CSS and JavaScript — **no build tools, no installing anything**.
Open `index.html` in a browser and it just works.

## The files

| File | What it does |
| --- | --- |
| `index.html` | All the text and sections of the page (hero, weekly ad, departments, deli, about, visit, footer). |
| `styles.css` | All the looks — colors, spacing, rounded cards, animations, phone layout. |
| `app.js` | The behavior — search, filters, the shopping list, the open/closed clock. |
| `data/products.js` | **The weekly flyer items.** This is the only file you need to touch most weeks. |

## Updating next week's sale prices

Open `data/products.js`. Every item looks like this:

```js
{
  brand: "Barilla",                       // the company
  name: "Pasta",                          // what it is
  size: "12 - 16 oz Select Varieties",    // the small gray line
  price: "$0.98",                         // typed exactly like the flyer ("2/$6" is fine)
  unitPrice: 0.98,                        // price for ONE, used to total the shopping list
  category: "pantry",                     // pantry, bakery, dairy, frozen, household, beverages
  blockbuster: true                       // optional — adds the gold "Blockbuster" badge
}
```

To add an item, copy an existing block, paste it, and change the words. Keep the
commas between blocks. To remove one, delete the whole `{ ... },` block.
Save the file, refresh the page — that's it. The counts on the filter buttons and
the "X items on sale" number on the homepage update themselves.

## Things that update automatically

- **Open / Closed** — reads the visitor's clock against the 8am–10pm hours.
- **"Today"** badge on the store hours list.
- **Item counts** on every filter chip and in the hero.
- **Copyright year** in the footer.

Store hours live in one place: the `STORE` line near the top of `app.js`, plus the
rows in the "Visit" section of `index.html`.

## The shopping list

Customers tap the **+** on any special to build a list. It's saved in their own
browser (`localStorage`), so it's still there when they come back. Nothing is sent
anywhere and we don't collect any customer information. "Print list" prints just
the list, nothing else on the page.

## Putting it online

Because there's no build step, any static host works:

- **GitHub Pages** — repo Settings → Pages → Deploy from branch → pick the branch, folder `/ (root)`.
- **Netlify or Cloudflare Pages** — drag the folder in, or connect the repo. No build command, publish directory `/`.

## Checking it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Content sources

Store details (address, phone, 8am–10pm hours, departments, the deli's Indian
cuisine and Italian subs, the Monday/Tuesday gas discount, family owned since
1965) match georgesagsupervalue.com. Weekly ad items are transcribed from the
paper flyer.
