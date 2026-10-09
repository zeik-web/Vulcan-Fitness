/*
  Vulcan commercial product page
  Gallery thumbnails, Shipping/Installation/Warranty dropdowns, the consultant
  popover, quantity stepper and variant changes (price, stock, Afterpay).
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
        thumb.setAttribute('aria-current', String(thumb.getAttribute('data-vcp-thumb') === id));
      });
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        showMedia(thumb.getAttribute('data-vcp-thumb'));
      });
    });

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

    /* ---------- Quantity, price and stock ---------- */

    var priceEl = root.querySelector('[data-vcp-price]');
    var compareEl = root.querySelector('[data-vcp-compare]');
    var badgeEl = root.querySelector('[data-vcp-badge]');
    var stockEl = root.querySelector('[data-vcp-stock]');
    var stockTextEl = root.querySelector('[data-vcp-stock-text]');
    var atcButton = root.querySelector('[data-vcp-atc]');
    var atcLabel = root.querySelector('[data-vcp-atc-label]');
    var afterpayIn = root.querySelector('[data-vcp-afterpay-in]');
    var afterpayOut = root.querySelector('[data-vcp-afterpay-out]');
    var afterpayAmount = root.querySelector('[data-vcp-afterpay-amount]');
    var hummAmount = root.querySelector('[data-vcp-humm-amount]');

    function money(cents) {
      return formatMoney(cents, config.moneyFormat);
    }

    function quantity() {
      var value = parseInt(qtyInput ? qtyInput.value : '1', 10);
      return isNaN(value) || value < 1 ? 1 : value;
    }

    function stockFor(variant) {
      if (!variant.available) {
        return { state: 'out', badge: config.badgeOut, line: config.stockOut };
      }
      var status = (config.splitTitle && titleStatus(variant.title)) || config.productStatus || '';
      if (!status) {
        return { state: 'in', badge: config.badgeIn, line: config.stockIn };
      }
      if (status.toUpperCase().indexOf('IN STOCK') !== -1) {
        return { state: 'in', badge: status, line: config.stockIn };
      }
      return { state: 'other', badge: status, line: status };
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

      var stock = stockFor(current);
      if (badgeEl) {
        badgeEl.textContent = stock.badge;
        badgeEl.setAttribute('data-state', stock.state);
      }
      if (stockEl) stockEl.setAttribute('data-state', stock.state);
      if (stockTextEl) stockTextEl.textContent = stock.line;

      if (atcButton) {
        atcButton.disabled = !current.available;
        if (atcLabel) {
          atcLabel.textContent = current.available
            ? config.atcLabel + ' — ' + money(price * quantity())
            : config.soldOutLabel;
        }
      }

      if (afterpayIn && afterpayOut) {
        var eligible = price >= (config.afterpayMin || 0) && (!config.afterpayMax || price <= config.afterpayMax);
        afterpayIn.hidden = !eligible;
        afterpayOut.hidden = eligible;
        if (afterpayAmount) afterpayAmount.textContent = money(Math.round(price / 4));
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
          render();
        });
      });
      qtyInput.addEventListener('input', render);
      qtyInput.addEventListener('change', function () {
        qtyInput.value = quantity();
        render();
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

  function initAll(scope) {
    (scope || document).querySelectorAll('[data-vcp-product]').forEach(initProduct);
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
  });
})();
