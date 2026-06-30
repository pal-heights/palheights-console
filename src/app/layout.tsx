import "@/utils/disableConsoleInProd";
import { Inter } from "next/font/google";
import "./globals.css";
import "./variables.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Pal Heights Console</title>
        <link
          rel="icon"
          href="https://pub-df2be1f0ac924e4f81cce390b6cc6cee.r2.dev/Pal%20Icons/Favicon.png"
          type="image/png"
        />
      </head>
      <body className={inter.className}>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
