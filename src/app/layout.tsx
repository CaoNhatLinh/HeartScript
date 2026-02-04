import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond } from "next/font/google"; // Using Outfit for modern look, Cormorant for letters
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
            <body className={`${outfit.variable} ${cormorant.variable} font-sans antialiased`} suppressHydrationWarning={true}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
