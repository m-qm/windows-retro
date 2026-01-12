import type { Metadata } from "next";
import "../styles/windows98.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Windows 98/XP Retro Simulator",
  description: "A nostalgic Windows 98/XP desktop simulation",
  icons: {
    icon: '/icons/windows.png',
    shortcut: '/icons/windows.png',
    apple: '/icons/windows.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden', height: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
