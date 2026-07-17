import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NYU Space Talks",
  description:
    "A lecture series on the history, politics, and astroculture of outer space.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
