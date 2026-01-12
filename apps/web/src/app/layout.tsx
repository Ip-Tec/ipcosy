import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IP~Cosy - Secure & Anonymous Messaging",
  description:
    "The most secure way to connect anonymously. Everything flows from Google identity. No tracking, no logs, just pure privacy.",
  keywords: [
    "anonymous chat",
    "secure messaging",
    "privacy",
    "encrypted chat",
    "ipcosy",
    "google sso chat",
  ],
  authors: [{ name: "IP~Cosy Team" }],
  openGraph: {
    title: "IP~Cosy - Secure & Anonymous Messaging",
    description:
      "The most secure way to connect anonymously. No tracking, no logs, just pure privacy.",
    url: "https://ipcosy.vercel.app",
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
    title: "IP~Cosy - Secure & Anonymous Messaging",
    description:
      "The most secure way to connect anonymously. Everything flows from Google identity.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
