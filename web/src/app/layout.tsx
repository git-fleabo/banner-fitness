import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "PT Learning Lab",
  description: "A private, self-guided learning companion for Level 3 personal training.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
