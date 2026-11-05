import { Funnel_Display, Funnel_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";

const display = Funnel_Display({ variable: "--font-display-face", subsets: ["latin"] });
const text = Funnel_Sans({ variable: "--font-text", subsets: ["latin"] });
const mono = DM_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["400", "500"] });

export const metadata = {
  title: { default: "APL Auction", template: "%s · APL Auction" },
  description: "Live player auctions for cricket and football.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable} ${mono.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
