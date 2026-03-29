import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Relay Control Dashboard | Industrial IoT',
  description: 'Industrial relay control and scheduling dashboard for IoT automation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen grid-pattern">
          {children}
        </div>
      </body>
    </html>
  );
}
