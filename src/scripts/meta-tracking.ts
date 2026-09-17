import {
  META_CONSENT_COOKIE,
  META_CONTENT_PATHS,
  metaEventId,
  type MetaEventName
} from '../lib/meta';

type PixelWindow = typeof window & { fbq?: (...args: unknown[]) => void };
const granted = () => {
  try {
    return localStorage.getItem('bwa_analytics_consent_v1') === 'granted';
  } catch {
    return false;
  }
};
const cookie = (name: string) =>
  document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${value}; Path=/; Max-Age=7776000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
};

export function prepareMetaConsent() {
  if (!granted()) return;
  if (!cookie(META_CONSENT_COOKIE)) setCookie(META_CONSENT_COOKIE, crypto.randomUUID());
  const click = new URL(location.href).searchParams.get('fbclid');
  if (click && /^[A-Za-z0-9_-]{1,500}$/.test(click)) {
    const existing = cookie('_fbc');
    if (!existing?.endsWith(`.${click}`)) setCookie('_fbc', `fb.1.${Date.now()}.${click}`);
  }
}

export function revokeMetaTracking() {
  // fetch captures the current consent cookie before it is removed locally.
  void fetch('/api/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'revoke', consent: cookie(META_CONSENT_COOKIE) }),
    keepalive: true
  }).catch(() => {});
  document.cookie = `${META_CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

const fired = new Set<string>();
export function trackBrowserConversion(name: MetaEventName, reference: string) {
  if (!granted()) return;
  prepareMetaConsent();
  const eventID = metaEventId(name, reference);
  if (fired.has(eventID)) return;
  fired.add(eventID);
  (window as PixelWindow).fbq?.('track', name, {}, { eventID });
}

function trackPublic(name: 'ViewContent' | 'Contact', channel?: string) {
  if (!granted()) return;
  const reference = crypto.randomUUID();
  trackBrowserConversion(name, reference);
  void fetch('/api/meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, reference, channel }),
    keepalive: true
  }).catch(() => {});
}

let contentTracked = false;
export function startMetaTracking() {
  prepareMetaConsent();
  if (!contentTracked && META_CONTENT_PATHS.includes(location.pathname)) {
    contentTracked = true;
    trackPublic('ViewContent');
  }
}

document.addEventListener('click', (event) => {
  const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
  if (!link) return;
  const url = new URL(link.href);
  const channel =
    url.protocol === 'mailto:'
      ? 'email'
      : url.protocol === 'tel:'
        ? 'phone'
        : ['wa.me', 'api.whatsapp.com'].includes(url.hostname)
          ? 'whatsapp'
          : undefined;
  if (channel) trackPublic('Contact', channel);
});
