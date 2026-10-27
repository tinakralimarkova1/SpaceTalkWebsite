import type { Metadata } from "next";
import { ParallaxBackground } from "./components/ParallaxBackground";
import { SiteHeader } from "./components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "NYU Space Talks",
  description:
    "A lecture series on the history, politics, and astroculture of outer space.",
  icons: {
    icon: { url: "/space-favicon.png", type: "image/png", sizes: "64x64" },
    shortcut: "/space-favicon.png",
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
