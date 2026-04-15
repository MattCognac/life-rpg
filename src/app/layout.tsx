import type { Metadata } from "next";
import { Cinzel, Cinzel_Decorative, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { MusicToggle } from "@/components/shared/music-toggle";
import { Toaster } from "@/components/shared/toaster";
import { TimezoneProvider } from "@/components/shared/timezone-provider";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "500", "600", "700"],
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  variable: "--font-cinzel-decorative",
  weight: ["400", "700", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const norse = localFont({
  src: "../../public/fonts/Norse-Bold.otf",
  variable: "--font-norse",
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Life RPG — Your Quest Begins",
  description:
    "An RPG quest system for real life. Organize goals into chains, earn XP, level up skills.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${cinzel.variable} ${cinzelDecorative.variable} ${inter.variable} ${norse.variable}`}
      >
        <TimezoneProvider />
        {children}
        <Toaster />
        <MusicToggle />
      </body>
    </html>
  );
}
