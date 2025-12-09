import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "Verifiey - SMS Verification Service",
  description: "Get phone numbers for SMS verification. Receive OTP codes directly in your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${openSans.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <SocketProvider>
            {children}
            <Toaster position="top-center" />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
