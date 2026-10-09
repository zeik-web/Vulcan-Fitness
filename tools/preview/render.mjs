// Renders templates/product.commercial.json with sample product data into a
// single static HTML file (preview/commercial-product-preview.html).
//
// It runs the real section Liquid through LiquidJS with small stand-ins for
// Shopify-only tags and filters, so the preview tracks the theme code. District
// theme parts (header, footer, product recommendations) are shown as labelled
// placeholders.
//
//   cd tools/preview && npm install && npm run build
//   node render.mjs [sample.json] [out.html]   # other sample data

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Liquid, Hash } from 'liquidjs';

const here = dirname(fileURLToPath(import.meta.url));
const themeRoot = resolve(here, '../..');
const read = (path) => readFileSync(join(themeRoot, path), 'utf8');

const [samplePath = join(here, 'sample-product.json'), outPath = join(themeRoot, 'preview/commercial-product-preview.html')] =
  process.argv.slice(2);
const product = JSON.parse(readFileSync(samplePath, 'utf8'));
const template = JSON.parse(read('templates/product.commercial.json'));
const MONEY_FORMAT = '${{amount}}';

/* ---------- Shopify stand-ins ---------- */

function formatMoney(cents, decimals = true) {
  const value = (Number(cents) / 100).toFixed(2);
  const [whole, fraction] = value.split('.');
  const amount = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (!decimals && fraction === '00') return `$${amount}`;
  return `$${amount}.${fraction}`;
}

function cdnUrl(src, width) {
  const url = new URL(src);
  if (width) url.searchParams.set('width', width);
  // Browsers can't show HEIC; Shopify's image_url serves a web format.
  if (url.pathname.endsWith('.heic')) url.searchParams.set('format', 'pjpg');
  return url.toString();
}

const escapeAttr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const engine = new Liquid({
  root: [join(themeRoot, 'snippets')],
  extname: '.liquid',
  strictFilters: true,
});

engine.registerFilter('money', (cents) => formatMoney(cents));
engine.registerFilter('money_without_trailing_zeros', (cents) => formatMoney(cents, false));
engine.registerFilter('image_url', function (source, ...args) {
  const options = Object.fromEntries(args.filter(Array.isArray));
  const src = typeof source === 'string' ? source : source?.src;
  return { src: cdnUrl(src, options.width), base: src, width: options.width };
});
engine.registerFilter('image_tag', function (image, ...args) {
  const options = Object.fromEntries(args.filter(Array.isArray));
  const attrs = { src: image.src, loading: options.loading ?? 'lazy' };
  if (options.widths) {
    attrs.srcset = String(options.widths)
      .split(',')
      .map((w) => `${cdnUrl(image.base, w.trim())} ${w.trim()}w`)
      .join(', ');
  }
  if (options.sizes) attrs.sizes = options.sizes;
  attrs.alt = options.alt ?? '';
  if (options.width) attrs.width = options.width;
  if (options.height) attrs.height = options.height;
  if (options.class) attrs.class = options.class;
  return `<img ${Object.entries(attrs)
    .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
    .join(' ')}>`;
});
engine.registerFilter('asset_url', (name) => `asset://${name}`);
engine.registerFilter('stylesheet_tag', (url) =>
  url.startsWith('asset://') ? `<style>\n${read(`assets/${url.slice(8)}`)}\n</style>` : `<link rel="stylesheet" href="${url}">`
);
engine.registerFilter('placeholder_svg_tag', (_name, cls) =>
  `<svg class="${cls}" viewBox="0 0 525 525" xmlns="http://www.w3.org/2000/svg"><rect width="525" height="525"/><text x="50%" y="50%" text-anchor="middle" fill="#fff" font-size="22" font-family="sans-serif">Choose an image in the theme editor</text></svg>`
);
engine.registerFilter('payment_button', () =>
  '<div class="shopify-payment-button"><button type="button" class="shopify-payment-button__button preview-shop-pay">Buy with <b>Shop</b><span>Pay</span></button>' +
  '<button type="button" class="shopify-payment-button__more-options">More payment options</button></div>'
);
engine.registerFilter('video_tag', () => '');
engine.registerFilter('external_video_tag', () => '');

// {% schema %} is metadata only.
engine.registerTag('schema', {
  parse(_token, remainTokens) {
    const stream = this.liquid.parser.parseStream(remainTokens);
    stream.on('tag:endschema', () => stream.stop()).on('template', () => {}).start();
  },
  render() {},
});

// {% style %} renders a <style> element on Shopify.
engine.registerTag('style', {
  parse(_token, remainTokens) {
    this.templates = [];
    const stream = this.liquid.parser.parseStream(remainTokens);
    stream
      .on('tag:endstyle', () => stream.stop())
      .on('template', (tpl) => this.templates.push(tpl))
      .start();
  },
  *render(ctx, emitter) {
    const css = yield this.liquid.renderer.renderTemplates(this.templates, ctx);
    emitter.write(`<style>${css}</style>`);
  },
});

// {% form 'product', product, id: ..., class: ... %}
engine.registerTag('form', {
  parse(token, remainTokens) {
    this.hash = new Hash(token.args.split(',').slice(2).join(','));
    this.templates = [];
    const stream = this.liquid.parser.parseStream(remainTokens);
    stream
      .on('tag:endform', () => stream.stop())
      .on('template', (tpl) => this.templates.push(tpl))
      .start();
  },
  *render(ctx, emitter) {
    const attrs = yield this.hash.render(ctx);
    const inner = yield this.liquid.renderer.renderTemplates(this.templates, ctx);
    const attrText = Object.entries(attrs)
      .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
      .join(' ');
    emitter.write(
      `<form method="post" action="/cart/add" accept-charset="UTF-8" enctype="multipart/form-data" ${attrText}>` +
        `<input type="hidden" name="form_type" value="product"><input type="hidden" name="utf8" value="✓">${inner}</form>`
    );
  },
});

/* ---------- Section settings from schema defaults + template ---------- */

function schemaOf(source) {
  const match = source.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
  return JSON.parse(match[1]);
}

function resolveValue(setting, value) {
  if (setting?.type === 'url' && typeof value === 'string' && value.startsWith('shopify://')) {
    return '/' + value.slice('shopify://'.length);
  }
  return value;
}

function settingsFor(definitions, values = {}) {
  const settings = {};
  for (const def of definitions ?? []) {
    if (!def.id) continue;
    const raw = def.id in values ? values[def.id] : def.default;
    settings[def.id] = resolveValue(def, raw ?? null);
  }
  return settings;
}

async function renderSection(key, data) {
  const path = `sections/${data.type}.liquid`;
  let source;
  try {
    source = read(path);
  } catch {
    return `<div class="preview-theme-part">District theme section: <code>${data.type}</code></div>`;
  }
  const schema = schemaOf(source);
  const blocks = (data.block_order ?? []).map((id) => {
    const block = data.blocks[id];
    const def = schema.blocks.find((b) => b.type === block.type) ?? {};
    return { id, type: block.type, settings: settingsFor(def.settings, block.settings), shopify_attributes: '' };
  });
  const section = { id: `template--preview__${key}`, settings: settingsFor(schema.settings, data.settings), blocks };
  // No dimension drawings are picked yet; borrow two product photos so the
  // front/side arrows show in the preview.
  if (data.type === 'vulcan-dimensions-specs' && !section.settings.image && !section.settings.image_side) {
    section.settings.image = { src: media[3].src };
    section.settings.image_side = { src: media[4].src };
  }
  const html = await engine.parseAndRender(source, {
    section,
    product: liquidProduct,
    shop: { money_format: MONEY_FORMAT },
    routes: { root_url: '/', all_products_collection_url: '/collections/all' },
    request: { design_mode: false },
  });
  return `<section class="shopify-section">${html}</section>`;
}

const media = product.media.map((m) => ({ ...m, preview_image: { src: m.src } }));
const variants = product.variants;
const liquidProduct = {
  ...product,
  media,
  featured_media: media[0],
  selected_or_first_available_variant: variants.find((v) => v.available) ?? variants[0],
};

/* ---------- Page ---------- */

const sectionsHtml = [];
for (const key of template.order) {
  if (template.sections[key].disabled) continue;
  sectionsHtml.push(await renderSection(key, template.sections[key]));
}

let body = sectionsHtml.join('\n');
let scriptInlined = false;
const badge = readFileSync(join(themeRoot, 'assets/vulcan-australian-owned.webp')).toString('base64');
body = body
  .replace(/asset:\/\/vulcan-australian-owned\.webp/g, `data:image/webp;base64,${badge}`)
  // Sections each include the script; inline it once and drop the repeats.
  .replace(/<script src="asset:\/\/vulcan-commercial\.js" defer="defer"><\/script>/g, () => {
    if (scriptInlined) return '';
    scriptInlined = true;
    return `<script>\n${read('assets/vulcan-commercial.js')}\n</script>`;
  })
  // humm's widget only answers on the live store; show where it renders.
  .replace(
    /<script src="https:\/\/bpi\.humm-au\.com[^"]*"><\/script>/g,
    '<span class="preview-note">humm price widget (merchant 30139735) shows here on the live store</span><span class="vcp-pill vcp-pill--humm">humm</span>'
  );

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Commercial Product Preview</title>
<meta name="description" content="Static preview of the Vulcan commercial product template, rendered from the theme code with sample data.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@400;700&family=IBM+Plex+Sans:ital,wght@0,400;0,700;1,400&display=swap">
<style>
  /* Preview-only chrome. Not part of the theme. */
  /* District sets these from the theme's font settings (IBM Plex Sans / Archivo Narrow) */
  :root { --body-font-family: 'IBM Plex Sans', sans-serif; --heading-font-family: 'Archivo Narrow', sans-serif; }
  html { color-scheme: light; }
  body { margin: 0; background: #ffffff; }
  .preview-bar { position: sticky; top: 0; z-index: 50; padding: 10px 16px; background: #17171b; color: #ffffff; font: 13px/1.4 'IBM Plex Sans', Arial, sans-serif; text-align: center; }
  .preview-bar strong { color: #f3a14a; }
  .preview-theme-part { padding: 28px 16px; background: repeating-linear-gradient(135deg, #f5f2ec 0 12px, #efe9df 12px 24px); color: #5c5c62; font: 14px/1.4 'IBM Plex Sans', Arial, sans-serif; text-align: center; }
  .preview-theme-part code { font-size: 13px; }
  .vcp-humm-widget:has(.preview-note) { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .preview-note { color: #5c5c62; font-size: 13px; font-style: italic; }
  .preview-afterpay-logo { display: inline-block; margin: 0 2px; padding: 1px 8px; border-radius: 999px; background: #b2fce4; color: #000000; font-weight: 800; font-size: 12px; }
  .preview-shop-pay { width: 100%; border: 0; background: #5a31f4; color: #ffffff; font-size: 16px; cursor: pointer; }
  .preview-shop-pay span { margin-left: 2px; padding: 1px 5px; border-radius: 4px; background: #ffffff; color: #5a31f4; font-weight: 800; font-size: 13px; }
</style>
</head>
<body>
<div class="preview-bar"><strong>Preview</strong> — rendered from the theme files with the live Leg Extension &amp; Leg Curl data. Buttons don't add to cart here; the Afterpay/humm messages and dimension photos are stand-ins.</div>
<div class="preview-theme-part">District theme announcement bar &amp; header</div>
${body}
<div class="preview-theme-part">District theme footer</div>
<script>
  // Stand-in for the Afterpay app snippet, which inserts its message above the
  // add-to-cart form; the section script moves it into the payment box.
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('.vcp-form');
    if (!form) return;
    var p = document.createElement('p');
    p.className = 'afterpay-paragraph';
    p.innerHTML = 'Make 4 interest-free payments of <strong>${formatMoney(Math.round(liquidProduct.selected_or_first_available_variant.price / 4))}</strong> with <span class="preview-afterpay-logo">afterpay</span> &#9432;';
    form.parentNode.insertBefore(p, form);
  });
  document.addEventListener('submit', function (event) { event.preventDefault(); alert('Preview only — on the store this adds to cart and opens the District cart popup.'); });
  document.addEventListener('click', function (event) { if (event.target.closest('.shopify-payment-button')) alert('Preview only — on the store this opens Shop Pay checkout.'); });
</script>
</body>
</html>
`;

writeFileSync(outPath, page);
console.log(`Wrote ${outPath}`);
