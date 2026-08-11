import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Banner Fitness - PT Workspace",
  description: "An explainable programme-design workspace for personal trainers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
