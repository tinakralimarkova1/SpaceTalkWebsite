import type { Metadata } from "next";
import { ParallaxBackground } from "./components/ParallaxBackground";
import { SiteHeader } from "./components/SiteHeader";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site-metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: { url: "/space-black.png", type: "image/png", sizes: "80x77" },
    shortcut: "/space-black.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ParallaxBackground />
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
