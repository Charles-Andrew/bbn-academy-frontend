import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/supabase/error-handler"; // Import global error handler
import { ThemeProvider } from "@/components/providers";
import { AppWrapper } from "@/components/providers/app-wrapper";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BBN Academy - Personal Book Showcase",
  description:
    "Discover and purchase personally written books from a passionate author. Explore stories, insights, and services.",
  keywords: ["books", "author", "writing", "storytelling", "personal library"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppWrapper>{children}</AppWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
