import { validReference, type PaymentView } from '../lib/payments/policy';

const params = new URLSearchParams(location.search);
let reference = params.get('reference') || '';
try {
  reference ||= sessionStorage.getItem('bwaPaymentReference') || '';
  if (validReference(reference)) sessionStorage.setItem('bwaPaymentReference', reference);
} catch {
  /* The reference remains usable for this page. */
}
// Do not pass payment references to referrers or analytics.
history.replaceState(null, '', location.pathname);
const title = document.querySelector<HTMLElement>('[data-payment-status-title]')!;
const message = document.querySelector<HTMLElement>('[data-payment-status-message]')!;
const ref = document.querySelector<HTMLElement>('[data-payment-reference]')!;
const check = document.querySelector<HTMLButtonElement>('[data-check-payment]')!;
const resume = document.querySelector<HTMLAnchorElement>('[data-resume-payment]')!;
const another = document.querySelector<HTMLAnchorElement>('main [data-another-nomination]')!;
const nominationsOpen =
  document.querySelector<HTMLElement>('main')?.dataset.nominationsOpen === 'true';
const success = document.querySelector<HTMLDialogElement>('[data-success-dialog]')!;
let checking = false;
let count = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let successShown = false;
const clearReference = () => {
  try {
    sessionStorage.removeItem('bwaPaymentReference');
  } catch {
    /* Optional storage. */
  }
};
document.querySelectorAll('[data-another-nomination]').forEach((link) => {
  if (!nominationsOpen) (link as HTMLElement).hidden = true;
  link.addEventListener('click', clearReference);
});
document.querySelector('[data-close-success]')?.addEventListener('click', () => success.close());

function render(payment: PaymentView) {
  message.textContent = payment.message;
  title.textContent = {
    creating: 'Checking your payment request.',
    pending: 'Your payment is pending.',
    paid: payment.submitted ? 'Your nomination is received.' : 'Payment confirmed.',
    failed: 'Payment not completed.',
    review: 'Let’s check this payment.'
  }[payment.state];
  resume.hidden = true;
  if (payment.state === 'pending' && payment.checkoutUrl) {
    const url = new URL(payment.checkoutUrl);
    if (
      url.protocol === 'https:' &&
      !url.port &&
      !url.username &&
      !url.password &&
      ['transaction.geniebiz.lk', 'transaction.uat.geniebiz.lk'].includes(url.hostname)
    ) {
      resume.href = url.href;
      resume.hidden = false;
    }
  }
  another.hidden = !nominationsOpen || (payment.state !== 'failed' && !payment.submitted);
  another.textContent = payment.submitted ? 'Submit another website' : 'Return to the form';
  check.hidden = payment.submitted || payment.state === 'failed' || payment.state === 'review';
  if (payment.state === 'paid' && payment.submitted && !successShown) {
    successShown = true;
    success.showModal();
  }
  if (!check.hidden && count < 6)
    timer = setTimeout(() => {
      if (!document.hidden) void refresh();
    }, 15_000);
}

async function refresh() {
  if (checking || !validReference(reference)) return;
  clearTimeout(timer);
  checking = true;
  check.disabled = true;
  check.setAttribute('aria-busy', 'true');
  count++;
  try {
    const response = await fetch(
      `/api/nomination/status?reference=${encodeURIComponent(reference)}`,
      { cache: 'no-store', signal: AbortSignal.timeout(25_000) }
    );
    const result = await response.json();
    if (!response.ok || !result.payment) {
      if (response.status === 404) {
        another.hidden = !nominationsOpen;
        another.textContent = 'Return to the form';
      }
      throw new Error(
        result.message || 'The payment status is temporarily unavailable. Please check again.'
      );
    }
    render(result.payment);
  } catch (error) {
    title.textContent = 'We could not confirm the status yet.';
    message.textContent =
      error instanceof Error
        ? error.message
        : 'Please check again. Do not make another payment if your bank shows a debit.';
  } finally {
    checking = false;
    check.disabled = false;
    check.removeAttribute('aria-busy');
  }
}
check.addEventListener('click', () => void refresh());
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && count < 6 && !check.hidden) void refresh();
});
if (validReference(reference)) {
  ref.hidden = false;
  ref.textContent = `Nomination reference: ${reference}`;
  void refresh();
} else {
  title.textContent = 'Find your nomination.';
  message.textContent =
    'Open the confirmation link from your checkout, or contact the awards team if you have already paid.';
  check.hidden = true;
}
