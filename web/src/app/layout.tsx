import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Engine PT - Construction",
  description: "An explainable programme-design workspace for personal trainers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
