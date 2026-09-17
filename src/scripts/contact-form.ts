import type { PaymentView } from '../lib/payments/policy';
import { trackBrowserConversion } from './meta-tracking';

const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
const select = form?.querySelector<HTMLSelectElement>('[data-enquiry-type]');
const website = form?.querySelector<HTMLInputElement>('#contact-website');
const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
const label = form?.querySelector<HTMLElement>('[data-submit-label]');
const id = form?.querySelector<HTMLInputElement>('[data-submission-id]');
const status = form?.querySelector<HTMLElement>('[data-form-status]');
const dialog = document.querySelector<HTMLDialogElement>('[data-payment-dialog]');
const pay = dialog?.querySelector<HTMLButtonElement>('[data-pay-card]');
const agreement = dialog?.querySelector<HTMLInputElement>('[data-payment-agreement]');
const feedback = dialog?.querySelector<HTMLElement>('[data-payment-feedback]');
const close = dialog?.querySelector<HTMLButtonElement>('[data-close-payment]');
const turnstile = () =>
  (window as typeof window & { turnstile?: { reset: (target: string) => void } }).turnstile?.reset(
    '.cf-turnstile'
  );
let busy = false;
let sessionReady = false;
let sessionRequest: Promise<void> | undefined;
let leadReady = false;
let leadRequest: Promise<void> | undefined;
let leadCaptured = false;
let capturedVerificationToken = '';
let verificationReset = false;

function prepareLead(data: FormData) {
  if (leadCaptured) return Promise.resolve();
  if (!leadRequest)
    leadRequest = (async () => {
      const response = await fetch('/api/nomination/lead', {
        method: 'POST',
        body: data,
        keepalive: true,
        signal: AbortSignal.timeout(25_000)
      });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.captured)
        throw new Error(
          result.message || 'We could not save your details. Close this window and try again.'
        );
      leadCaptured = true;
      trackBrowserConversion('Lead', String(data.get('submissionId')));
      capturedVerificationToken = String(data.get('cf-turnstile-response') || '');
    })().finally(() => {
      leadRequest = undefined;
    });
  return leadRequest;
}

function prepareSession() {
  if (sessionReady) return Promise.resolve();
  if (!sessionRequest)
    sessionRequest = (async () => {
      const response = await fetch('/api/nomination/session', {
        method: 'POST',
        signal: AbortSignal.timeout(12_000)
      });
      const result = await response.json();
      if (!response.ok || !result.ok)
        throw new Error(result.message || 'Secure checkout is temporarily unavailable.');
      sessionReady = true;
    })().finally(() => {
      sessionRequest = undefined;
    });
  return sessionRequest;
}

const remember = (reference: string) => {
  try {
    sessionStorage.setItem('bwaPaymentReference', reference);
  } catch {
    /* The return URL still contains the reference. */
  }
};
const forget = () => {
  try {
    sessionStorage.removeItem('bwaPaymentReference');
  } catch {
    /* Storage is optional. */
  }
};
const showStatus = (message: string, kind = 'error') => {
  if (!status) return;
  delete status.dataset.verification;
  status.hidden = false;
  status.dataset.kind = kind;
  status.querySelector('p')!.textContent = message;
};
const update = () => {
  const nomination = select?.value === 'present';
  if (website) website.required = nomination;
  const requirement = form?.querySelector('[data-website-field] label span');
  if (requirement) requirement.textContent = nomination ? '*' : 'Optional';
  if (label) label.textContent = nomination ? 'Continue nomination' : 'Send enquiry';
  const feeNotice = form?.querySelector<HTMLElement>('[data-fee-notice]');
  if (feeNotice)
    feeNotice.textContent = nomination
      ? 'Nomination fee: Rs. 2,850. Pay securely in the next step.'
      : 'No fee for enquiries. We’ll reply by email.';
};
const showFeedback = (message: string) => {
  if (feedback) {
    feedback.hidden = false;
    feedback.textContent = message;
  }
};
const paymentDestination = (payment: PaymentView) => {
  remember(payment.reference);
  if (payment.checkoutUrl) {
    const url = new URL(payment.checkoutUrl);
    if (
      url.protocol !== 'https:' ||
      !['transaction.geniebiz.lk', 'transaction.uat.geniebiz.lk'].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.port
    )
      throw new Error('The payment address could not be verified.');
    window.location.assign(url.href);
  } else
    window.location.assign(`/nomination-status?reference=${encodeURIComponent(payment.reference)}`);
};

if (id) id.value = crypto.randomUUID();
update();
select?.addEventListener('change', update);
// Editing after capture needs a fresh token; unchanged details use their saved verification.
form?.addEventListener('input', () => {
  if ((leadCaptured || leadRequest) && !verificationReset) {
    verificationReset = true;
    turnstile();
  }
});
// A previous ambiguous request is never silently converted into a second payment.
try {
  const previous = sessionStorage.getItem('bwaPaymentReference');
  if (previous && form) {
    const link = document.createElement('a');
    link.href = `/nomination-status?reference=${encodeURIComponent(previous)}`;
    link.textContent = 'Check your previous nomination payment';
    link.className = 'nomination-feedback';
    form.prepend(link);
  }
} catch {
  /* Browser storage can be disabled. */
}

close?.addEventListener('click', () => {
  if (!busy) dialog?.close();
});
dialog?.addEventListener('cancel', (event) => {
  if (busy) event.preventDefault();
});
agreement?.addEventListener('change', () => {
  if (pay) pay.disabled = busy || !agreement.checked || !sessionReady || !leadReady;
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy || !form.reportValidity() || !submit) return;
  if (!new FormData(form).get('cf-turnstile-response'))
    return showStatus('Please complete the secure verification before continuing.');
  if (select?.value === 'present') {
    if (!dialog || !pay || !agreement) return;
    try {
      const previous = sessionStorage.getItem('bwaPaymentReference');
      if (previous) {
        window.location.assign(`/nomination-status?reference=${encodeURIComponent(previous)}`);
        return;
      }
    } catch {
      /* Continue with server-side idempotency. */
    }
    dialog.showModal();
    const capturedDetails = new FormData(form);
    submit.disabled = true;
    leadReady = false;
    agreement.checked = false;
    pay.disabled = true;
    showFeedback('Preparing secure checkout…');
    try {
      await prepareSession();
      await prepareLead(capturedDetails);
      leadReady = true;
      if (feedback) feedback.hidden = true;
      pay.disabled = !agreement.checked;
    } catch (error) {
      turnstile();
      showFeedback(
        error instanceof Error
          ? error.message
          : 'Secure checkout is temporarily unavailable. Close this window and try again.'
      );
    } finally {
      submit.disabled = false;
    }
    return;
  }
  busy = true;
  submit.disabled = true;
  submit.setAttribute('aria-busy', 'true');
  if (label) label.textContent = 'Sending…';
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000)
    });
    const result = await response.json();
    if (!response.ok || !result.ok)
      throw new Error(result.message || 'We could not send your enquiry. Please try again.');
    if (id) trackBrowserConversion('Contact', id.value);
    form.reset();
    leadCaptured = false;
    capturedVerificationToken = '';
    leadReady = false;
    verificationReset = false;
    if (id) id.value = crypto.randomUUID();
    showStatus(result.message, 'success');
  } catch (error) {
    showStatus(
      error instanceof Error ? error.message : 'We could not send your enquiry. Please try again.'
    );
  } finally {
    busy = false;
    submit.disabled = false;
    submit.removeAttribute('aria-busy');
    turnstile();
    update();
  }
});

pay?.addEventListener('click', async () => {
  if (busy || !sessionReady || !leadReady || !agreement?.checked || !form || !id) return;
  busy = true;
  pay.disabled = true;
  pay.setAttribute('aria-busy', 'true');
  if (close) close.disabled = true;
  showFeedback('Opening secure checkout. Please keep this window open…');
  const data = new FormData(form);
  // The widget may clear its token while the popup is open. The server accepts
  // the saved verification only when the complete submission still matches.
  if (!data.get('cf-turnstile-response') && capturedVerificationToken)
    data.set('cf-turnstile-response', capturedVerificationToken);
  data.set('paymentTerms', agreement.value);
  remember(id.value);
  try {
    const response = await fetch('/api/nomination/start', {
      method: 'POST',
      body: data,
      signal: AbortSignal.timeout(25_000)
    });
    const result = await response.json();
    if (!response.ok || !result.payment) {
      if (response.status < 500) forget();
      else {
        window.location.assign(`/nomination-status?reference=${encodeURIComponent(id.value)}`);
        return;
      }
      throw new Error(result.message || 'We could not start checkout. Please try again.');
    }
    paymentDestination(result.payment);
  } catch (error) {
    if (error instanceof DOMException || error instanceof TypeError) {
      window.location.assign(`/nomination-status?reference=${encodeURIComponent(id.value)}`);
      return;
    }
    showFeedback(
      error instanceof Error
        ? `${error.message} Close this window to return to your details.`
        : 'Please check your payment status before trying again.'
    );
    turnstile();
    sessionReady = false;
  } finally {
    busy = false;
    pay.removeAttribute('aria-busy');
    if (close) close.disabled = false;
  }
});
