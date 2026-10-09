# Vulcan Fitness — commercial product page

A Shopify product template for commercial equipment, built from the
*Commercial Product Page 1* design to plug into the live **District** theme.
Everything is editable in the theme editor (Online Store › Themes › Customize).

Open `preview/commercial-product-preview.html` in a browser to see it with the
live Leg Extension & Leg Curl data.

## What's on the page

| Section (theme editor name) | What it does |
| --- | --- |
| **Commercial product** | Breadcrumb, live Trustpilot widget, title + blurb, 4:3 photo gallery with stock badge, "Talk to a gym consultant" and a thumbnail carousel with arrows (swipe on phones), the Shipping / Installation / Warranty dropdowns (with black line icons), and the buy box |
| **Commercial description** | Each product's own description from Shopify admin (Products › Description), shown full width with no heading — edit the product and the page updates |
| **Commercial why us** | "Why us?" heading, intro line and up to 6 feature cards. They fade up in turn as you scroll to them; hovering one lifts and highlights it (on phones, the card in the middle of the screen highlights). Numbering (01, 02…) is a tickbox, off by default |
| **Commercial specs** | Front view and side view dimension photos with arrows (and swipe on phones) to switch between them, plus the specification rows |
| Product recommendations | District's existing "You may also like" section. Your Trustpilot app adds its review widget below it, as on the rest of the site |

Each Shipping / Installation / Warranty dropdown can also show a download button for a PDF
(set *Document link* on the dropdown block). The Installation dropdown links to the VUL-K5709A
installation manual, which is in Shopify under Content › Files (a copy is in `files/`).

`sections/vulcan-trustpilot-reviews.liquid` (a dark Trustpilot band) is still in the theme but no
longer on the template, since the Trustpilot app already shows reviews there.

### Trustpilot

The strip above the title is Trustpilot's own widget for business ID `6022a7fcf1069f000155785b`
(the same account your Trustpilot app uses), so the stars, TrustScore and review count stay live.
Choose *Mini* (stars, TrustScore and review count, like the one in the footer), or one of the
one-line *Micro* widgets, under **Trustpilot widget**. The TrustScore and review count settings
are only used for the plain strip, and while the widget loads.

### Buy box

- **Price** from the selected variant, with the compare-at price struck through when it's higher.
- **Stock badge** on the main photo. *Automatic* reads the status at the end of the product title
  (`| IN STOCK`, `| MADE-TO-ORDER 60~75 DAYS`, `| PRE-ORDER …`): green for in stock, orange for
  anything else. Or force it to *In stock* (green) or *Pre-order* (orange, text and colour
  editable). Sold-out variants show a grey "Sold out" badge and disable the button.
- **Afterpay**: shown by the Afterpay app snippet already in your theme (`theme.liquid`), not by
  this section.
- **Zip**: "Own it now, pay later with" followed by the Zip logo, like the Afterpay and humm
  messages — shown at every price, as Zip has no limit.
- **humm**: humm's own price widget, using the same script and merchant ID (30139735) as your
  current product pages, so the terms it shows stay current. You can switch to your own text.
- **Shop Pay**: Shopify's dynamic checkout button (`payment_button`) — Shop Pay plus the
  "More payment options" link. The card/wallet chips from the design are removed.
- **Add to cart** uses District's `<product-form>`, so it opens the theme's cart popup like the
  rest of the site.
- **Guarantees**: 90 Day Love It or Leave It and Commercial warranty, each a dropdown.
- **100% Australian owned** with the Australian Owned Certified #08375 badge.
- **Custom code** and **app** blocks can be added to the buy box (they appear under the payment
  rows) — useful for payment or app widgets.

### Fonts

The page uses your District theme fonts — the body font for text and the heading font for
headings (IBM Plex Sans and Archivo Narrow today). It reads them from the theme, so if you change
fonts in *Theme settings › Typography*, this page follows.

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
templates/product.commercial-legextcurl.json the Leg Extension & Leg Curl template
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
4. **Templates** › *Add a new template* › product › JSON, name it `commercial-legextcurl`, and
   replace its contents with `templates/product.commercial-legextcurl.json`.
5. **Products** › the product › *Theme template* › `commercial-legextcurl`.
6. Preview the duplicate theme, then publish it (or repeat the steps on the live theme).

With Shopify CLI instead: `shopify theme push --unpublished` from a full copy of the theme that
includes these files.

### More commercial products

Each product needs its own specs and "Why us" copy. In the theme editor, open the
`commercial-legextcurl` template and use **Create template › Based on commercial-legextcurl**
(naming it after the product, e.g. `commercial-latpulldown`), then change the text for that
product. Or connect the spec values and blurb to product metafields (the database icon next to a
setting) so one template fills itself per product.

## Before going live

Fill in or check these — they're placeholders or depend on your accounts:

- **Warranty years**: the Warranty dropdown, the Commercial warranty guarantee, and its
  subheading still have `[X years]` placeholders.
- **Colour** and **Upholstery** spec rows (`[Frame colour]`, `[Colour / material]`).
- **Dimension photos**: pick the front view and side view drawings in *Commercial specs*. Until
  then the specs show full width (the preview borrows two product photos as stand-ins).

## Rebuilding the preview

```
cd tools/preview
npm install
npm run build
```
