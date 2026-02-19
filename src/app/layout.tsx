import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "ShipOrSkip — BNB Ecosystem Intelligence for Builders",
  description:
    "Don't Ship Blind. Analyze 50+ BSC projects, validate your idea with AI, and learn from the dead before you build.",
  openGraph: {
    title: "ShipOrSkip — Don't Ship Blind",
    description:
      "BNB ecosystem intelligence: survival scores, post-mortems, whale signals, and AI-powered idea validation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
