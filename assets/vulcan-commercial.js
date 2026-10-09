/*
  Vulcan commercial product page
  Gallery thumbnails, Shipping/Installation/Warranty dropdowns, the consultant
  popover, quantity stepper, variant changes (price, stock badge), moving the
  Afterpay app's message into the payment box, the live Trustpilot widget,
  front/side dimension views and the Why us effects.
  Adding to cart is handled by District's <product-form> element.
*/
(function () {
  'use strict';

  if (window.VulcanCommercial) return;

  function formatMoney(cents, format) {
    var template = String(format || '${{amount}}').replace(/<[^>]*>/g, '');
    var placeholder = /\{\{\s*(\w+)\s*\}\}/;
    var match = template.match(placeholder);

    function withDelimiters(precision, thousands, decimal) {
      var fixed = (Number(cents) / 100).toFixed(precision).split('.');
      var whole = fixed[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
      return fixed[1] ? whole + decimal + fixed[1] : whole;
    }

    var value;
    switch (match ? match[1] : 'amount') {
      case 'amount_no_decimals':
        value = withDelimiters(0, ',', '.');
        break;
      case 'amount_with_comma_separator':
        value = withDelimiters(2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = withDelimiters(0, '.', ',');
        break;
      case 'amount_with_apostrophe_separator':
        value = withDelimiters(2, "'", '.');
        break;
      case 'amount_with_space_separator':
        value = withDelimiters(2, ' ', ',');
        break;
      default:
        value = withDelimiters(2, ',', '.');
    }
    return template.replace(placeholder, value);
  }

  // Text after the last " | " in a title, e.g. "IN STOCK".
  function titleStatus(title) {
    var index = String(title || '').lastIndexOf(' | ');
    return index === -1 ? '' : title.slice(index + 3).trim();
  }

  function initProduct(root) {
    if (!root || root.dataset.vcpReady) return;
    root.dataset.vcpReady = 'true';

    var configEl = root.querySelector('[data-vcp-config]');
    var config = {};
    try {
      config = configEl ? JSON.parse(configEl.textContent) : {};
    } catch (error) {
      console.error('[vulcan-commercial] Could not read section config', error);
    }
    var variants = config.variants || [];

    var idInput = root.querySelector('[data-vcp-variant-id]');
    var qtyInput = root.querySelector('[data-vcp-qty]');
    var variantSelect = root.querySelector('[data-vcp-variant-select]');
    var current =
      variants.find(function (v) {
        return idInput && String(v.id) === idInput.value;
      }) || variants[0];

    /* ---------- Gallery ---------- */

    var mediaItems = root.querySelectorAll('[data-vcp-media]');
    var thumbs = root.querySelectorAll('[data-vcp-thumb]');
    var thumbTrack = root.querySelector('[data-vcp-thumbs-track]');
    var mediaIds = Array.prototype.map.call(mediaItems, function (item) {
      return item.getAttribute('data-vcp-media');
    });

    // Scroll the thumbnail row just enough to show the active thumbnail.
    function revealThumb(thumb) {
      if (!thumbTrack || !thumb) return;
      var left = thumb.offsetLeft;
      var right = left + thumb.offsetWidth;
      if (left < thumbTrack.scrollLeft) {
        thumbTrack.scrollTo({ left: left });
      } else if (right > thumbTrack.scrollLeft + thumbTrack.clientWidth) {
        thumbTrack.scrollTo({ left: right - thumbTrack.clientWidth });
      }
    }

    function stepMedia(step) {
      var current = Array.prototype.findIndex.call(mediaItems, function (item) {
        return !item.hidden;
      });
      var next = (current + step + mediaIds.length) % mediaIds.length;
      showMedia(mediaIds[next]);
    }

    function showMedia(mediaId) {
      var id = String(mediaId);
      var found = false;
      mediaItems.forEach(function (item) {
        var active = item.getAttribute('data-vcp-media') === id;
        if (active) found = true;
        item.hidden = !active;
        if (!active) {
          var video = item.querySelector('video');
          if (video) video.pause();
        }
      });
      if (!found) return;
      thumbs.forEach(function (thumb) {
        var active = thumb.getAttribute('data-vcp-thumb') === id;
        thumb.setAttribute('aria-current', String(active));
        if (active) revealThumb(thumb);
      });
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        showMedia(thumb.getAttribute('data-vcp-thumb'));
      });
    });

    root.querySelectorAll('[data-vcp-media-step]').forEach(function (button) {
      button.addEventListener('click', function () {
        stepMedia(parseInt(button.getAttribute('data-vcp-media-step'), 10));
      });
    });

    // Swipe left/right on the main photo on touch screens
    var stage = root.querySelector('.vcp-stage');
    if (stage && mediaIds.length > 1) {
      var touchStart = null;
      stage.addEventListener('touchstart', function (event) {
        touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }, { passive: true });
      stage.addEventListener('touchend', function (event) {
        if (!touchStart) return;
        var dx = event.changedTouches[0].clientX - touchStart.x;
        var dy = event.changedTouches[0].clientY - touchStart.y;
        touchStart = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) stepMedia(dx < 0 ? 1 : -1);
      });
    }

    /* ---------- Shipping / Installation / Warranty ---------- */

    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-vcp-tab]'));

    function setTab(tab, open) {
      tab.setAttribute('aria-expanded', String(open));
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.hidden = !open;
    }

    function openTab(tab, open) {
      tabs.forEach(function (other) {
        if (other !== tab) setTab(other, false);
      });
      setTab(tab, open);
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        openTab(tab, tab.getAttribute('aria-expanded') !== 'true');
      });
    });

    root.vcpOpenTab = function (element) {
      var tab = tabs.indexOf(element) !== -1 ? element : null;
      if (tab) openTab(tab, true);
    };

    /* ---------- Consultant popover ---------- */

    var consult = root.querySelector('[data-vcp-consult]');
    if (consult) {
      document.addEventListener('click', function (event) {
        if (consult.open && !consult.contains(event.target)) consult.open = false;
      });
      consult.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && consult.open) {
          consult.open = false;
          consult.querySelector('summary').focus();
        }
      });
    }

    /* ---------- Afterpay ---------- */

    // The Afterpay app snippet inserts its own message next to the price or
    // form. Move it into the first row of the payment box so Afterpay, Zip and
    // humm share one border. The app may re-insert it when the price changes,
    // so keep watching.
    var afterpaySlot = root.querySelector('[data-vcp-afterpay-slot]');
    var AFTERPAY = '[class*="afterpay" i], afterpay-placement, square-placement';

    function adoptAfterpay() {
      var found = Array.prototype.filter.call(root.querySelectorAll(AFTERPAY), function (el) {
        var parent = el.parentElement && el.parentElement.closest(AFTERPAY);
        return !afterpaySlot.contains(el) && !(parent && root.contains(parent));
      });
      if (!found.length) return;
      afterpaySlot.replaceChildren(found[found.length - 1]);
      found.slice(0, -1).forEach(function (el) {
        el.remove();
      });
      afterpaySlot.hidden = false;
    }

    if (afterpaySlot && 'MutationObserver' in window) {
      adoptAfterpay();
      new MutationObserver(adoptAfterpay).observe(root, { childList: true, subtree: true });
    }

    /* ---------- Quantity, price and stock badge ---------- */

    var priceEl = root.querySelector('[data-vcp-price]');
    var compareEl = root.querySelector('[data-vcp-compare]');
    var badgeEl = root.querySelector('[data-vcp-badge]');
    var atcButton = root.querySelector('[data-vcp-atc]');
    var atcLabel = root.querySelector('[data-vcp-atc-label]');
    var hummAmount = root.querySelector('[data-vcp-humm-amount]');

    function money(cents) {
      return formatMoney(cents, config.moneyFormat);
    }

    function quantity() {
      var value = parseInt(qtyInput ? qtyInput.value : '1', 10);
      return isNaN(value) || value < 1 ? 1 : value;
    }

    // Same rules as the Liquid: green in stock, orange pre-order, grey sold out.
    function badgeFor(variant) {
      if (!variant.available) return { state: 'out', text: config.badgeOut };
      if (config.badgeMode === 'pre_order') return { state: 'other', text: config.badgePre };
      var status = (config.splitTitle && titleStatus(variant.title)) || config.productStatus || '';
      if (config.badgeMode === 'in_stock' || !status) return { state: 'in', text: config.badgeIn };
      if (status.toUpperCase().indexOf('IN STOCK') !== -1) return { state: 'in', text: status };
      return { state: 'other', text: status };
    }

    function render() {
      if (!current) return;
      var price = current.price;

      if (priceEl) priceEl.textContent = money(price);
      if (compareEl) {
        var onSale = current.compare_at_price && current.compare_at_price > price;
        compareEl.hidden = !onSale;
        if (onSale) compareEl.textContent = money(current.compare_at_price);
      }

      if (badgeEl) {
        var badge = badgeFor(current);
        badgeEl.textContent = badge.text;
        badgeEl.setAttribute('data-state', badge.state);
      }

      if (atcButton) {
        atcButton.disabled = !current.available;
        if (atcLabel) atcLabel.textContent = current.available ? config.atcLabel : config.soldOutLabel;
      }

      if (hummAmount && config.hummPayments > 0) {
        hummAmount.textContent = money(Math.ceil(price / config.hummPayments));
      }
    }

    if (qtyInput) {
      root.querySelectorAll('[data-vcp-qty-step]').forEach(function (button) {
        button.addEventListener('click', function () {
          var step = parseInt(button.getAttribute('data-vcp-qty-step'), 10);
          var max = parseInt(qtyInput.max, 10) || 99;
          qtyInput.value = Math.min(Math.max(quantity() + step, 1), max);
        });
      });
      qtyInput.addEventListener('change', function () {
        qtyInput.value = quantity();
      });
    }

    if (variantSelect) {
      variantSelect.addEventListener('change', function () {
        var next = variants.find(function (v) {
          return String(v.id) === variantSelect.value;
        });
        if (!next) return;
        current = next;
        if (idInput) idInput.value = current.id;
        if (current.featured_media) showMedia(current.featured_media.id);
        render();

        var url = new URL(window.location.href);
        url.searchParams.set('variant', current.id);
        window.history.replaceState({}, '', url.toString());
      });
    }
  }

  /* ---------- Trustpilot ---------- */

  // The Trustpilot app normally loads Trustpilot's widget script on every
  // page. If it hasn't by the time the page has loaded, load it ourselves.
  var TRUSTPILOT_SRC = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';

  function initTrustbox(element) {
    if (!element || element.dataset.vcpReady) return;
    element.dataset.vcpReady = 'true';

    function load() {
      if (element.querySelector('iframe')) return;
      if (window.Trustpilot && typeof window.Trustpilot.loadFromElement === 'function') {
        window.Trustpilot.loadFromElement(element);
      } else if (!document.querySelector('script[src*="tp.widget.bootstrap"]')) {
        var script = document.createElement('script');
        script.src = TRUSTPILOT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
    }

    if (document.readyState === 'complete') {
      load();
    } else {
      window.addEventListener('load', load);
    }
  }

  /* ---------- Dimension views (front / side) ---------- */

  function initViews(root) {
    if (!root || root.dataset.vcpReady) return;
    root.dataset.vcpReady = 'true';

    var views = Array.prototype.slice.call(root.querySelectorAll('[data-vcp-view]'));
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-vcp-view-go]'));
    if (views.length < 2) return;
    var index = 0;

    function show(next) {
      index = (next + views.length) % views.length;
      views.forEach(function (view, i) {
        view.hidden = i !== index;
      });
      tabs.forEach(function (tab, i) {
        tab.setAttribute('aria-pressed', String(i === index));
      });
    }

    root.querySelectorAll('[data-vcp-view-step]').forEach(function (button) {
      button.addEventListener('click', function () {
        show(index + parseInt(button.getAttribute('data-vcp-view-step'), 10));
      });
    });
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        show(i);
      });
    });

    // Swipe left/right on touch screens
    var startX = null;
    root.addEventListener('touchstart', function (event) {
      startX = event.touches[0].clientX;
    }, { passive: true });
    root.addEventListener('touchend', function (event) {
      if (startX === null) return;
      var delta = event.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(delta) > 40) show(index + (delta < 0 ? 1 : -1));
    });
  }

  /* ---------- Why us ---------- */

  function initWhy(root) {
    if (!root || root.dataset.vcpReady) return;
    root.dataset.vcpReady = 'true';

    var items = Array.prototype.slice.call(root.querySelectorAll('[data-vcp-why-item]'));
    var canObserve = 'IntersectionObserver' in window;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Fade the cards up one after another as they scroll into view.
    if (!canObserve || reduceMotion) {
      items.forEach(function (item) {
        item.classList.add('is-visible');
      });
    } else {
      root.classList.add('vcp-why--ready');
      var revealObserver = new IntersectionObserver(
        function (entries) {
          entries
            .filter(function (entry) {
              return entry.isIntersecting;
            })
            .forEach(function (entry, index) {
              revealObserver.unobserve(entry.target);
              setTimeout(function () {
                entry.target.classList.add('is-visible');
              }, index * 120);
            });
        },
        { threshold: 0.2 }
      );
      items.forEach(function (item) {
        revealObserver.observe(item);
      });
    }

    // Touch screens can't hover, so highlight the card crossing the middle
    // of the screen instead.
    if (canObserve && window.matchMedia('(hover: none)').matches) {
      var activeObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            entry.target.classList.toggle('is-active', entry.isIntersecting);
          });
        },
        { rootMargin: '-45% 0px -45% 0px' }
      );
      items.forEach(function (item) {
        activeObserver.observe(item);
      });
    }
  }

  function initAll(scope) {
    (scope || document).querySelectorAll('[data-vcp-product]').forEach(initProduct);
    (scope || document).querySelectorAll('[data-vcp-why]').forEach(initWhy);
    (scope || document).querySelectorAll('[data-vcp-trustbox]').forEach(initTrustbox);
    (scope || document).querySelectorAll('[data-vcp-views]').forEach(initViews);
  }

  window.VulcanCommercial = { init: initAll, formatMoney: formatMoney };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initAll();
    });
  } else {
    initAll();
  }

  // Theme editor: re-initialise re-rendered sections and open a dropdown
  // when its block is selected in the sidebar.
  document.addEventListener('shopify:section:load', function (event) {
    initAll(event.target);
  });
  document.addEventListener('shopify:block:select', function (event) {
    var root = event.target.closest('[data-vcp-product]');
    if (root && root.vcpOpenTab) root.vcpOpenTab(event.target);
    if (event.target.matches('[data-vcp-why-item]')) event.target.classList.add('is-visible');
  });
})();
