import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

import "@/app/globals.css";
import { AppFrame } from "@/components/app-frame";
import { AppProviders } from "@/components/providers/app-providers";

const fontSans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Samchon Shopping Frontend",
  description:
    "A prototype storefront built around the @samchon/shopping-api customer flows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontMono.variable}`}>
        <AppProviders>
          <AppFrame>{children}</AppFrame>
        </AppProviders>
      </body>
    </html>
  );
}
