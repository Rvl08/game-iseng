import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pixel-Clash Battle Royale',
  description: 'A 2D Pixel Art multiplayer Battle Royale game where players use smartphones as controllers',
  keywords: ['game', 'battle royale', 'multiplayer', 'pixel art', '2D', 'mobile controller'],
  authors: [{ name: 'Pixel-Clash Team' }],
  openGraph: {
    title: 'Pixel-Clash Battle Royale',
    description: 'A 2D Pixel Art multiplayer Battle Royale game',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a12',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
