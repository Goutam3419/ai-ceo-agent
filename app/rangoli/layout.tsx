import { Poppins, Inter } from "next/font/google";
import { RangoliAuthProvider } from "@/lib/rangoli-auth-context";

const display = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-rangoli-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-rangoli-body",
});

export default function RangoliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${display.variable} ${body.variable} font-rangolibody bg-rangolibg text-rangoliink min-h-screen`}
    >
      <RangoliAuthProvider>{children}</RangoliAuthProvider>
    </div>
  );
}
