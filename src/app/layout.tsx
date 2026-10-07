import type { Metadata } from "next";
import "./globals.css";
import { NotificationProvider } from "@/features/notifications";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import { UserProvider } from "../features/user/presentation/context/UserContext";
import { WalletProvider, WrongNetworkBanner } from "../features/wallet";
import { Space_Grotesk } from "next/font/google";
import { QueryProvider } from "./providers/QueryProvider";

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-localsettle',
});

export const metadata: Metadata = {
  title: "LocalSettle — Local payments, settled on Stellar",
  description: "Trade stablecoins for local payments, coordinate peer-to-peer orders, and track escrow settlement on Stellar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${spaceGrotesk.className}`}>
        <QueryProvider>
          <NotificationProvider>
            <UserProvider>
              <WalletProvider>
                <WrongNetworkBanner />
                {children}
                <CookieConsentBanner />
              </WalletProvider>
            </UserProvider>
          </NotificationProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
