# Vulcan Fitness — commercial product page

A Shopify product template for commercial equipment, built from the
*Commercial Product Page 1* design to plug into the live **District** theme.
Everything is editable in the theme editor (Online Store › Themes › Customize).

Open `preview/commercial-product-preview.html` in a browser to see it with the
live Leg Extension & Leg Curl data.

## What's on the page

| Section (theme editor name) | What it does |
| --- | --- |
| **Commercial product** | Breadcrumb, Trustpilot strip, title + blurb, photo gallery with stock badge and "Talk to a gym consultant", the 🚚 Shipping / 🛠️ Installation / 🛡️ Warranty dropdowns, and the buy box |
| **Commercial description** | Each product's own description from Shopify admin (Products › Description), shown full width with no heading — edit the product and the page updates |
| **Commercial why us** | "Why us?" heading, intro line and up to 6 numbered feature cards. They fade up in turn as you scroll to them; hovering one lifts and highlights it (on phones, the card in the middle of the screen highlights) |
| **Commercial specs** | Dimensions photo and specification rows |
| **Commercial reviews** | Dark Trustpilot band — the "Read reviews →" link scrolls here |
| Product recommendations | District's existing "You may also like" section |

### Buy box

- **Price** from the selected variant, with the compare-at price struck through when it's higher.
- **Stock**: product titles here end with a status (`| IN STOCK`, `| MADE-TO-ORDER 60~75 DAYS`, `| PRE-ORDER …`).
  That part is taken out of the heading and shown in the photo badge (green for in stock, orange
  otherwise) and the stock line. A sold-out variant shows "Sold out" and disables the button.
- **Afterpay**: "4 interest-free payments of $X" (price ÷ 4). Set to your $4,000 Afterpay limit —
  products priced above it simply don't show the Afterpay row.
- **humm**: humm's own price widget, using the same script and merchant ID (30139735) as your
  current product pages, so the terms it shows stay current. You can switch to your own text.
- **Shop Pay**: Shopify's dynamic checkout button (`payment_button`) — Shop Pay plus the
  "More payment options" link. The card/wallet chips from the design are removed.
- **Add to cart** uses District's `<product-form>`, so it opens the theme's cart popup like the
  rest of the site. The button shows the total for the chosen quantity.
- **Guarantees**: 90 Day Love It or Leave It and Commercial warranty, each a dropdown.
- **100% Australian owned** with the Australian Owned Certified #08375 badge.
- **Custom code** and **app** blocks can be added to the buy box (they appear under the payment
  rows) — useful for Afterpay/humm/Trustpilot app widgets.

## Files

```
sections/vulcan-commercial-product.liquid    main section + buy box
sections/vulcan-product-description.liquid   Shopify product description
sections/vulcan-why-us.liquid
sections/vulcan-dimensions-specs.liquid
sections/vulcan-trustpilot-reviews.liquid
snippets/vulcan-commercial-assets.liquid     loads the stylesheet
snippets/vulcan-commercial-icon.liquid       line icons
assets/vulcan-commercial.css
assets/vulcan-commercial.js                  gallery, dropdowns, quantity, variants
assets/vulcan-australian-owned.webp
templates/product.commercial.json            the template, pre-filled for the Leg Extension & Leg Curl
preview/commercial-product-preview.html      static preview (not used by Shopify)
tools/preview/                               script that builds the preview
```

## Installing on the store

Work on a copy first: **Online Store › Themes › District › … › Duplicate**, then on the copy
choose **… › Edit code**.

1. **Assets** › *Add a new asset*: upload `vulcan-australian-owned.webp`, and create
   `vulcan-commercial.css` and `vulcan-commercial.js` with the contents of the files here.
2. **Snippets** › *Add a new snippet*: `vulcan-commercial-assets` and `vulcan-commercial-icon`.
3. **Sections** › *Add a new section*: the five `vulcan-*` sections.
4. **Templates** › *Add a new template* › product › JSON, name it `commercial`, and replace its
   contents with `templates/product.commercial.json`.
5. **Products** › the product › *Theme template* › `commercial`.
6. Preview the duplicate theme, then publish it (or repeat the steps on the live theme).

With Shopify CLI instead: `shopify theme push --unpublished` from a full copy of the theme that
includes these files.

### More commercial products

Each product needs its own specs and "Why us" copy. In the theme editor, open the `commercial`
template and use **Create template › Based on commercial**, then change the text for that
product. Or connect the spec values and blurb to product metafields (the database icon next to a
setting) so one template fills itself per product.

## Before going live

Fill in or check these — they're placeholders or depend on your accounts:

- **Warranty years**: the Warranty dropdown, the Commercial warranty guarantee, and its
  subheading still have `[X years]` placeholders.
- **Colour** and **Upholstery** spec rows (`[Frame colour]`, `[Colour / material]`).
- **Dimensions photo**: pick it in *Commercial specs*. Until then the specs show full width.
- **Trustpilot count**: "750+" is from the design; check it matches your profile.

## Rebuilding the preview

```
cd tools/preview
npm install
npm run build
```
