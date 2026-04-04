import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MultivRSS | Digital Organicism",
  description: "A Frank Lloyd Wright inspired RSS aggregator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-foreground selection:text-background">
        {/* FLW Detail: Structural Roofline */}
        <div className="h-1 w-full bg-black sticky top-0 z-50" />
        
        {children}
      </body>
    </html>
  );
}
