(function () {
  'use strict';

  const VAT_RATE = 0.25;
  const DE_MINIMIS_EUR = 150;
  const FLAT_DUTY_EUR = 3;
  const DEFAULT_CURRENCY = 'USD';

  const state = {
    rates: null,
    ratesUpdatedAt: null,
    ratesWarning: null,
  };

  const els = {
    form: document.getElementById('calc-form'),
    value: document.getElementById('value'),
    currencyFilter: document.getElementById('currency-filter'),
    currency: document.getElementById('currency'),
    shipping: document.getElementById('shipping'),
    dutyRate: document.getElementById('duty-rate'),
    quickButtons: document.querySelectorAll('.quick-duty'),
    ratesStatus: document.getElementById('rates-status'),
    ratesError: document.getElementById('rates-error'),
    resultValueSek: document.getElementById('result-value-sek'),
    resultShippingSek: document.getElementById('result-shipping-sek'),
    resultCustomsValue: document.getElementById('result-customs-value'),
    resultDuty: document.getElementById('result-duty'),
    resultVat: document.getElementById('result-vat'),
    resultTotal: document.getElementById('result-total'),
    ruleNote: document.getElementById('rule-note'),
  };

  const SEK_FMT = new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 2,
  });

  function populateCurrencies() {
    const frag = document.createDocumentFragment();
    CURRENCIES.forEach(({ code, name }) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = code + ' – ' + name;
      frag.appendChild(opt);
    });
    els.currency.appendChild(frag);
    els.currency.value = DEFAULT_CURRENCY;
  }

  function filterCurrencies() {
    const q = els.currencyFilter.value.trim().toLowerCase();
    let firstVisible = null;
    Array.from(els.currency.options).forEach((opt) => {
      const match = opt.textContent.toLowerCase().includes(q);
      opt.hidden = !match;
      if (match && firstVisible === null) firstVisible = opt.value;
    });
    if (q && firstVisible && els.currency.selectedOptions[0] && els.currency.selectedOptions[0].hidden) {
      els.currency.value = firstVisible;
      calculate();
    }
  }

  function showRatesError(message) {
    els.ratesError.hidden = false;
    els.ratesError.textContent = message;
  }

  function hideRatesError() {
    els.ratesError.hidden = true;
    els.ratesError.textContent = '';
  }

  function formatUpdatedAt(iso) {
    if (!iso) return 'okänt';
    const date = new Date(iso);
    return date.toLocaleString('sv-SE', { dateStyle: 'medium', timeStyle: 'short' });
  }

  async function loadRates() {
    els.ratesStatus.textContent = 'Hämtar valutakurser…';
    hideRatesError();
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      if (!res.ok || !data.rates) {
        throw new Error(data.error || 'Okänt fel från valutatjänsten');
      }
      state.rates = data.rates;
      state.ratesUpdatedAt = data.updatedAt;
      state.ratesWarning = data.warning;

      els.ratesStatus.textContent = 'Kurser uppdaterade: ' + formatUpdatedAt(state.ratesUpdatedAt);
      if (state.ratesWarning) {
        showRatesError(state.ratesWarning);
      } else {
        hideRatesError();
      }
      calculate();
    } catch (err) {
      els.ratesStatus.textContent = 'Kurser uppdaterade: okänt';
      showRatesError('Kunde inte hämta valutakurser: ' + err.message + '. Försök ladda om sidan om en liten stund.');
    }
  }

  function getRate(code) {
    if (!state.rates) return null;
    if (code === 'SEK') return 1;
    return state.rates[code] || null;
  }

  function calculate() {
    if (!state.rates) return;

    const value = parseFloat(els.value.value) || 0;
    const shipping = parseFloat(els.shipping.value) || 0;
    const dutyPct = parseFloat(els.dutyRate.value) || 0;
    const code = els.currency.value;
    const rate = getRate(code);
    const eurRate = getRate('EUR');

    if (!rate) {
      showRatesError('Ingen växelkurs tillgänglig för ' + code + ' just nu.');
      return;
    }
    if (!state.ratesWarning) hideRatesError();

    const valueSek = value / rate;
    const shippingSek = shipping / rate;
    const customsValueSek = valueSek + shippingSek;

    const thresholdSek = eurRate ? DE_MINIMIS_EUR / eurRate : null;
    const flatDutySek = eurRate ? FLAT_DUTY_EUR / eurRate : 0;

    let duty;
    let ruleText;

    if (thresholdSek !== null && customsValueSek <= thresholdSek) {
      duty = flatDutySek;
      ruleText =
        'Tullvärdet (' + SEK_FMT.format(customsValueSek) + ') är högst 150 EUR (' +
        SEK_FMT.format(thresholdSek) + '), så en schablontull på max 3 EUR (' +
        SEK_FMT.format(flatDutySek) + ') tillämpas per varurad, oavsett angiven tullsats.';
    } else {
      duty = customsValueSek * (dutyPct / 100);
      ruleText =
        'Tullvärdet (' + SEK_FMT.format(customsValueSek) + ') överstiger 150 EUR' +
        (thresholdSek !== null ? ' (' + SEK_FMT.format(thresholdSek) + ')' : '') +
        ', så tullsatsen ' + String(dutyPct).replace('.', ',') + ' % tillämpas på tullvärdet.';
    }

    const vat = VAT_RATE * (customsValueSek + duty);
    const total = valueSek + shippingSek + duty + vat;

    els.resultValueSek.textContent = SEK_FMT.format(valueSek);
    els.resultShippingSek.textContent = SEK_FMT.format(shippingSek);
    els.resultCustomsValue.textContent = SEK_FMT.format(customsValueSek);
    els.resultDuty.textContent = SEK_FMT.format(duty);
    els.resultVat.textContent = SEK_FMT.format(vat);
    els.resultTotal.textContent = SEK_FMT.format(total);
    els.ruleNote.textContent = ruleText;
  }

  function bindQuickDuty() {
    els.quickButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        els.dutyRate.value = btn.dataset.percent;
        calculate();
      });
    });
  }

  function init() {
    populateCurrencies();
    bindQuickDuty();
    els.currencyFilter.addEventListener('input', filterCurrencies);
    [els.value, els.shipping, els.dutyRate, els.currency].forEach((el) => {
      el.addEventListener('input', calculate);
    });
    els.form.addEventListener('submit', (e) => e.preventDefault());
    loadRates();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
