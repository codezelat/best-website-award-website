import {
  PACKAGES,
  PARTICIPATION_TERMS,
  money,
  participationQuote,
  type PackageCode,
  type ParticipationChoice,
  type ParticipationView
} from '../lib/participation/policy';

const root = document.querySelector<HTMLElement>('[data-accept]')!;
const demo = root.dataset.demo === 'true';
const element = <T extends HTMLElement = HTMLElement>(selector: string) =>
  root.querySelector<T>(selector)!;
const form = element<HTMLFormElement>('[data-website-form]');
const attendees = element<HTMLInputElement>('#accept-attendees');
const trophy = element<HTMLInputElement>('[data-extra-trophy]');
const agreement = element<HTMLInputElement>('[data-agreement]');
const pay = element<HTMLButtonElement>('[data-pay]');
let selected: PackageCode = 'A';
let busy = false;
let reference = new URL(location.href).searchParams.get('reference') || '';
let poll: ReturnType<typeof setTimeout> | undefined;
let polls = 0;
let statusBusy = false;

function showError(message = '') {
  const target = element('[data-accept-error]');
  target.textContent = message;
  target.hidden = !message;
}
function showPanel(name: string, focus = true) {
  root.querySelectorAll<HTMLElement>('[data-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.panel !== name;
  });
  root.querySelectorAll<HTMLElement>('[data-step-marker]').forEach((marker) => {
    if (marker.dataset.stepMarker === (name === 'status' ? 'attendees' : name))
      marker.setAttribute('aria-current', 'step');
    else marker.removeAttribute('aria-current');
  });
  if (focus)
    root
      .querySelector<HTMLElement>(`[data-panel="${name}"] h2, [data-panel="${name}"] input`)
      ?.focus({ preventScroll: true });
  showError();
}
function resetVerification() {
  (window as typeof window & { turnstile?: { reset: (target: string) => void } }).turnstile?.reset(
    '.cf-turnstile'
  );
}
async function api(action: string, data?: unknown) {
  const response = await fetch(`/api/participation/${action}`, {
    method: data === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    ...(data !== undefined
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
      : {}),
    signal: AbortSignal.timeout(25_000)
  }).catch(() => {
    throw new Error('The connection was interrupted. Please try again shortly.');
  });
  const result = await response.json().catch(() => {
    throw new Error('This service is temporarily unavailable. Please try again shortly.');
  });
  if (!response.ok || !result.ok)
    throw new Error(
      result.message || 'We could not complete this request. Please try again shortly.'
    );
  return result;
}
function choice(): ParticipationChoice {
  return {
    packageCode: selected,
    extraTrophy: selected === 'C' && trophy.checked,
    attendees: Number(attendees.value)
  };
}
function update() {
  const included = PACKAGES[selected].included;
  attendees.min = String(included);
  element('[data-trophy-wrap]').hidden = selected !== 'C';
  element('[data-attendee-inclusion]').textContent =
    `${included} ${included === 1 ? 'attendee is' : 'attendees are'} included with Package ${selected}.`;
  element<HTMLButtonElement>('[data-decrease]').disabled = Number(attendees.value) <= included;
  element<HTMLButtonElement>('[data-increase]').disabled = Number(attendees.value) >= 10;
  let valid = true;
  try {
    const quote = participationQuote(choice());
    element('[data-package-summary]').textContent = `Package ${selected}`;
    element('[data-base-amount]').textContent = money(quote.base);
    element('[data-trophy-summary]').hidden = !choice().extraTrophy;
    element('[data-attendees-summary]').textContent = `Additional attendees (${quote.additional})`;
    element('[data-attendees-amount]').textContent = money(quote.attendeeAmount);
    element('[data-total]').textContent = money(quote.total);
  } catch {
    valid = false;
  }
  pay.disabled = busy || !agreement.checked || !valid;
}
function remember(id: string) {
  reference = id;
  const url = new URL(location.href);
  url.searchParams.set('reference', id);
  history.replaceState(null, '', url);
}
function safeCheckout(value?: string) {
  try {
    const url = new URL(value || '');
    return url.protocol === 'https:' &&
      !url.port &&
      !url.username &&
      !url.password &&
      ['transaction.geniebiz.lk', 'transaction.uat.geniebiz.lk'].includes(url.hostname)
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
function renderPayment(payment: ParticipationView) {
  clearTimeout(poll);
  remember(payment.reference);
  showPanel('status');
  const titles = {
    creating: 'Preparing your payment.',
    pending: 'Complete your payment.',
    paid: 'Participation confirmed.',
    failed: 'Payment not completed.',
    review: 'Your payment needs a review.'
  };
  element('#accept-status-title').textContent = titles[payment.state];
  element('[data-paid-icon]').hidden = payment.state !== 'paid';
  element('[data-waiting-icon]').hidden = payment.state === 'paid';
  element('[data-payment-message]').textContent = payment.message;
  element('[data-payment-reference]').textContent = `Reference: ${payment.reference}`;
  const quote = participationQuote(payment.choice);
  const summary = element('[data-payment-summary]');
  summary.replaceChildren();
  for (const [label, value] of [
    ['Website', payment.website],
    [
      'Package',
      `Package ${payment.choice.packageCode}${payment.choice.extraTrophy ? ' + additional trophy' : ''}`
    ],
    ['Total attendees', `${payment.choice.attendees} (${quote.included} included)`],
    ['Full dinner buffet', 'Included for every attendee'],
    [payment.state === 'paid' ? 'Total paid' : 'Total', money(payment.amount)]
  ]) {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label!;
    detail.textContent = value!;
    row.append(term, detail);
    summary.append(row);
  }
  summary.hidden = false;
  const checkout = safeCheckout(payment.checkoutUrl);
  const resume = element<HTMLAnchorElement>('[data-continue-checkout]');
  resume.hidden = payment.state !== 'pending' || !checkout;
  if (checkout) resume.href = checkout;
  else resume.removeAttribute('href');
  element('[data-check-status]').hidden =
    payment.state === 'failed' ||
    payment.state === 'review' ||
    (payment.state === 'paid' && (payment.emailed || demo));
  element('[data-start-over]').hidden = payment.state !== 'failed';
  if (demo) element('[data-demo-confirm]').hidden = payment.state !== 'pending';
  if (
    !demo &&
    polls < 8 &&
    (['creating', 'pending'].includes(payment.state) ||
      (payment.state === 'paid' && !payment.emailed))
  ) {
    poll = setTimeout(() => {
      if (!document.hidden) {
        polls++;
        void checkStatus();
      }
    }, 15_000);
  }
}
async function checkStatus() {
  if (statusBusy || !reference) return;
  statusBusy = true;
  const button = element<HTMLButtonElement>('[data-check-status]');
  button.disabled = true;
  try {
    renderPayment((await api(`status?reference=${encodeURIComponent(reference)}`)).payment);
  } catch (error) {
    showError(
      error instanceof Error ? error.message : 'Please check your payment status again shortly.'
    );
  } finally {
    statusBusy = false;
    button.disabled = false;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy || !form.reportValidity()) return;
  busy = true;
  showError();
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  button.disabled = true;
  element('[data-lookup-label]').textContent = 'Checking website...';
  try {
    const data = new FormData(form);
    const result = await api('lookup', {
      website: data.get('website'),
      token: data.get('cf-turnstile-response') || ''
    });
    root.querySelectorAll<HTMLElement>('[data-website-label]').forEach((label) => {
      label.textContent = result.website;
    });
    if (result.payment) renderPayment(result.payment);
    else {
      reference = '';
      history.replaceState(null, '', '/accept');
      showPanel('package');
    }
  } catch (error) {
    showError(
      error instanceof Error ? error.message : 'We could not check your website. Please try again.'
    );
  } finally {
    busy = false;
    button.disabled = false;
    element('[data-lookup-label]').textContent = 'Check website';
    if (!demo) resetVerification();
  }
});
root.querySelectorAll<HTMLInputElement>('input[name="package"]').forEach((radio) =>
  radio.addEventListener('change', () => {
    selected = radio.value as PackageCode;
    if (selected !== 'C') trophy.checked = false;
    attendees.value = String(
      Math.min(
        10,
        Math.max(
          PACKAGES[selected].included,
          Number(attendees.value) || PACKAGES[selected].included
        )
      )
    );
    agreement.checked = false;
    update();
  })
);
trophy.addEventListener('change', () => {
  agreement.checked = false;
  update();
});
element('[data-next-attendees]').addEventListener('click', () => {
  update();
  showPanel('attendees');
});
root.querySelectorAll<HTMLElement>('[data-back]').forEach((button) =>
  button.addEventListener('click', () => {
    if (busy) return;
    clearTimeout(poll);
    agreement.checked = false;
    update();
    if (button.dataset.back === 'website') {
      reference = '';
      history.replaceState(null, '', '/accept');
    }
    showPanel(button.dataset.back!);
  })
);
attendees.addEventListener('input', () => {
  agreement.checked = false;
  update();
});
attendees.addEventListener('change', () => {
  attendees.value = String(
    Math.min(
      10,
      Math.max(
        PACKAGES[selected].included,
        Math.trunc(Number(attendees.value)) || PACKAGES[selected].included
      )
    )
  );
  agreement.checked = false;
  update();
});
for (const [selector, difference] of [
  ['[data-decrease]', -1],
  ['[data-increase]', 1]
] as const)
  element(selector).addEventListener('click', () => {
    attendees.value = String(
      Math.min(10, Math.max(PACKAGES[selected].included, Number(attendees.value) + difference))
    );
    agreement.checked = false;
    update();
  });
agreement.addEventListener('change', update);
pay.addEventListener('click', async () => {
  if (busy || !agreement.checked) return;
  try {
    participationQuote(choice());
  } catch {
    attendees.reportValidity();
    return;
  }
  busy = true;
  update();
  showError();
  const controls = root.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
    '[data-panel="attendees"] input, [data-panel="attendees"] button'
  );
  controls.forEach((control) => {
    control.disabled = true;
  });
  pay.querySelector('span')!.textContent = 'Preparing secure checkout...';
  try {
    const result = await api('start', { ...choice(), terms: PARTICIPATION_TERMS });
    renderPayment(result.payment);
    const checkout = safeCheckout(result.payment.checkoutUrl);
    if (result.payment.state === 'pending' && checkout && !demo) location.assign(checkout);
  } catch (error) {
    showPanel('website');
    showError(
      `${error instanceof Error ? error.message : 'The payment response was interrupted.'} Check your website again to recover any payment already started. Do not pay twice.`
    );
  } finally {
    busy = false;
    controls.forEach((control) => {
      control.disabled = false;
    });
    pay.querySelector('span')!.textContent = 'Complete payment securely';
    update();
  }
});
element('[data-check-status]').addEventListener('click', () => {
  polls = 0;
  void checkStatus();
});
if (demo) {
  element('[data-demo-confirm]').addEventListener('click', async () => {
    try {
      renderPayment((await api('demo-confirm', {})).payment);
    } catch {
      showError('Please restart the local preview.');
    }
  });
}
update();
if (reference) {
  showPanel('status', false);
  void checkStatus();
}
