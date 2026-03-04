import type { Metadata } from "next";
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
  title: "USG — United States of Git",
  description: "A Tron-themed 3D visualization of the world's most impactful open-source GitHub repositories. Watch towers rise from a glowing globe — the taller the tower, the greater the impact.",
  keywords: ["github", "open source", "visualization", "3d", "tron", "repositories", "globe", "united states of git"],
  authors: [{ name: "Prabhat Teotia" }],
  creator: "Prabhat Teotia",
  metadataBase: new URL("https://unitedstatesofgit.com"),
  openGraph: {
    title: "United States of Git",
    description: "Explore the global skyline of open-source repositories in stunning 3D",
    type: "website",
    siteName: "United States of Git",
  },
  twitter: {
    card: "summary_large_image",
    title: "USG — United States of Git",
    description: "A Tron-themed 3D globe visualization of GitHub's most impactful repositories",
    creator: "@prabhatteotia",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
