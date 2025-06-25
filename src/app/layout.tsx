
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/layout/AppLayout';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Elektro Schwarzmann',
  description: 'Interne App für News und Wocheneinteilungen von Elektro Schwarzmann.',
  applicationName: "Elektro Schwarzmann",
  appleWebApp: {
    capable: true,
    title: "Schwarzmann App",
    statusBarStyle: "default",
  },
  icons: {
    icon: 'https://www.elektro-schwarzmann.at/wp-content/uploads/2022/06/cropped-Favicon_Elektro_Schwarzmann-Wiener-Neustadt-180x180.png',
    apple: 'https://www.elektro-schwarzmann.at/wp-content/uploads/2022/06/cropped-Favicon_Elektro_Schwarzmann-Wiener-Neustadt-180x180.png',
  }
};

export const viewport: Viewport = {
  themeColor: '#eb680d',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
