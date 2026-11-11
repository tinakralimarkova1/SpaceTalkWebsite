import type { Metadata } from "next";

export const SITE_NAME = "NYU Space Talks";
export const SITE_URL = "https://www.space-talks.com";
export const SITE_DESCRIPTION =
  "A lecture series on the history, politics, and astroculture of outer space.";

const SOCIAL_IMAGE = {
  url: "/space-black.png",
  width: 80,
  height: 77,
  alt: "NYU Space Talks icon",
};

type PageMetadataOptions = {
  title: string;
  description: string;
  path: "/" | "/archive" | "/posters" | "/thinking-outer-space";
  absoluteTitle?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: PageMetadataOptions): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [SOCIAL_IMAGE.url],
    },
  };
}
