import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const display = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VYBE — Where ambition connects",
  description:
    "VYBE is the private network for entrepreneurs. An iOS app. Request early access.",
  applicationName: "VYBE",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    title: "VYBE — Where ambition connects",
    description: "The private network for entrepreneurs. iOS only. Request early access.",
    images: [{ url: "/og.jpg", width: 1024, height: 1024 }],
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={display.variable}>
      <body>{children}</body>
    </html>
  );
}
