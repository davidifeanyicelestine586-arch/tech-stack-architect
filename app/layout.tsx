import React from "react";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "@/components/Themeprovider";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const PRODUCT_TITLE = "Ediccrew Tech Stack Architect";
const PRODUCT_DESCRIPTION = "Design, validate, understand, and generate production-ready technology stacks.";

export const metadata: Metadata = {
  title: {
    default: PRODUCT_TITLE,
    template: `%s | ${PRODUCT_TITLE}`,
  },
  description: PRODUCT_DESCRIPTION,
  openGraph: {
    title: PRODUCT_TITLE,
    description: PRODUCT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: PRODUCT_TITLE,
    description: PRODUCT_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-color-theme="CUSTOM_THEME"
      data-layout="vertical"
      data-boxed-layout="boxed"
      data-sidebar-type="true"
      data-card-shadow="false"
      className="style-lyra"
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${geist.className} antialiased selection:bg-primary/20`}>
        <NextTopLoader color="var(--primary)" showSpinner={false} />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
