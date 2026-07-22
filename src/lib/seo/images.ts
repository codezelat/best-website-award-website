import type { ManagedImage } from '../content/types';

export interface ResolvedManagedImage {
  url: URL;
  caption: string;
  width?: number;
  height?: number;
}

export function resolveManagedImage(
  image: ManagedImage,
  site: URL = new URL('https://bestwebsiteaward.com')
): ResolvedManagedImage {
  const source = image.src;

  return {
    url: new URL(typeof source === 'string' ? source : source.src, site),
    caption: image.alt,
    width: typeof source === 'string' ? image.width : source.width,
    height: typeof source === 'string' ? image.height : source.height
  };
}

export function resolveManagedImages(
  images: readonly ManagedImage[],
  site: URL = new URL('https://bestwebsiteaward.com')
): ResolvedManagedImage[] {
  const seen = new Set<string>();

  return images.flatMap((image) => {
    const resolved = resolveManagedImage(image, site);
    if (seen.has(resolved.url.href)) return [];

    seen.add(resolved.url.href);
    return [resolved];
  });
}
