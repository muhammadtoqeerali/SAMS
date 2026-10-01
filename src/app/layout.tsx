import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SAMS", template: "%s · SAMS" },
  description: "Smart Apartment Management System",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
