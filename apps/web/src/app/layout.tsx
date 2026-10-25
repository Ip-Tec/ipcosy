import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { NotificationProvider } from "@/components/notification-provider";
import { Toaster } from "sonner";
import { AppNavigation } from "@/components/app-navigation";
import { GoogleOneTap } from "@/components/google-one-tap";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://ipcosy.vercel.app",
  ),
  title: "IP~Cosy — Anonymous messages, real conversations",
  description:
    "Share a personal link to receive anonymous messages, reply in your inbox, and continue conversations in chat. IPCosy may collect account and device details.",
  keywords: [
    "anonymous chat",
    "message inbox",
    "privacy",
    "anonymous messages",
    "ipcosy",
    "google sso chat",
  ],
  authors: [{ name: "IP~Cosy Team" }],
  openGraph: {
    title: "IP~Cosy — Anonymous messages, real conversations",
    description:
      "Share a personal link to receive anonymous messages, reply in your inbox, and continue conversations in chat.",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://ipcosy.vercel.app",
    siteName: "IP~Cosy",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "IP~Cosy Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IP~Cosy — Anonymous messages, real conversations",
    description:
      "Share a personal link to receive anonymous messages, reply in your inbox, and continue conversations in chat.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IP~Cosy",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppNavigation />
            <GoogleOneTap />
            <NotificationProvider>{children}</NotificationProvider>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
