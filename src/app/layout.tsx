import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond, Playfair_Display, Quicksand, Dancing_Script } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";

const outfit = Outfit({
    subsets: ["latin"],
    variable: '--font-outfit',
});

const cormorant = Cormorant_Garamond({
    subsets: ["latin"],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-cormorant',
    display: 'swap', // Prevent FOIT
});

const playfair = Playfair_Display({
    subsets: ["latin"],
    weight: ['400', '500', '600', '700', '800', '900'],
    variable: '--font-playfair',
    display: 'swap', // Prevent FOIT
});

const quicksand = Quicksand({
    subsets: ["latin"],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-quicksand',
    display: 'swap', // Prevent FOIT
});

const dancingScript = Dancing_Script({
    subsets: ["latin"],
    weight: ['400', '500', '600', '700'],
    variable: '--font-dancing',
    display: 'swap', // Prevent FOIT
});

export const metadata: Metadata = {
    title: "Our Love Space",
    description: "A private space for us to share memories and build our future.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${outfit.variable} ${cormorant.variable} ${playfair.variable} ${quicksand.variable} ${dancingScript.variable} font-sans antialiased`} suppressHydrationWarning={true}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
