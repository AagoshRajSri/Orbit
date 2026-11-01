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

import { ApolloWrapper } from "@/lib/ApolloWrapper";

export const metadata: Metadata = {
  title: "Orbit — Real-Time Feed & Social Platform",
  description: "Next-generation social platform with real-time feeds, nested discussions, and instant messaging.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050810] text-white">
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
