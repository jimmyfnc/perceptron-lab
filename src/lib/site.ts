/**
 * Site-wide SEO constants and the per-page <head> builder.
 * Every route's head() goes through pageHead so titles, descriptions,
 * OpenGraph/Twitter tags, and canonical URLs never drift apart.
 */

export const SITE_URL = "https://perceptronlab.com";
export const SITE_NAME = "Perceptron Lab";
export const OG_IMAGE = `${SITE_URL}/og.png`;

const AUTHOR = { "@type": "Person", name: "James Caldwell" };

/** Schema.org JSON-LD: the site is a WebSite; every station is a LearningResource. */
function jsonLd(path: string, title: string, description: string, url: string) {
  if (path === "/") {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      description,
      author: AUTHOR,
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: title.split(" | ")[0],
    description,
    url,
    learningResourceType: "Interactive simulation",
    educationalLevel: "Beginner",
    inLanguage: "en",
    isAccessibleForFree: true,
    author: AUTHOR,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };
}

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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLd(path, title, description, url)),
      },
    ],
  };
}
