import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Classic Reads - Discover Timeless Literature",
  description: "Explore over 70,000 free classic books from Project Gutenberg. Discover timeless literature, poetry, philosophy, and more.",
  keywords: ["classic books", "free books", "Project Gutenberg", "literature", "poetry", "philosophy"],
  authors: [{ name: "Classic Reads" }],
  openGraph: {
    title: "Classic Reads - Discover Timeless Literature",
    description: "Explore over 70,000 free classic books from Project Gutenberg",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
