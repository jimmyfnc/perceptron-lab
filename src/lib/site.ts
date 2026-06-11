/**
 * Site-wide SEO constants and the per-page <head> builder.
 * Every route's head() goes through pageHead so titles, descriptions,
 * OpenGraph/Twitter tags, and canonical URLs never drift apart.
 */

export const SITE_URL = "https://perceptronlab.com";
export const SITE_NAME = "Perceptron Lab";
export const OG_IMAGE = `${SITE_URL}/og.png`;

export function pageHead(path: string, title: string, description: string) {
  const url = path === "/" ? SITE_URL : SITE_URL + path;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
