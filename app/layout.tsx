import type { Metadata } from "next";
    import { Inter } from "next/font/google";
    
    // Import Tailwind's core styles directly. This bypasses globals.css completely.
    import "tailwindcss/tailwind.css";

    const inter = Inter({ subsets: ["latin"] });

    export const metadata: Metadata = {
      title: "Cisco Compatibility Checker",
      description: "Find compatible transceivers for your Cisco switches",
    };

    export default function RootLayout({
      children,
    }: Readonly<{
      children: React.ReactNode;
    }>) {
      return (
        <html lang="en">
          <body className={inter.className}>{children}</body>
        </html>
      );
    }
