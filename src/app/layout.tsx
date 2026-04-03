import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const interSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fontLora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MultivRSS | High-Performance RSS",
  description: "A Bauhaus-inspired RSS aggregator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${interSans.variable} ${fontLora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050505] text-zinc-300">
        {children}
      </body>
    </html>
  );
}
