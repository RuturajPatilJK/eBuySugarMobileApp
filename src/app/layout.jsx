import './globals.css';
import Providers from '../components/providers/Providers';
import AppInitializer from '../components/auth/AppInitializer';
import SplashScreen from '../components/SplashScreen';

export const metadata = {
    title: 'eBuySugar — Sugar Trade Portal',
    description: 'Registered sugar miller and trader platform for buying, selling, and tracking sugar tenders.',
    manifest: '/manifest.json',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: '#ef3837',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="eBuySugar" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Signika:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body suppressHydrationWarning>
                <Providers>
                    <SplashScreen />
                    <AppInitializer>
                        {children}
                    </AppInitializer>
                </Providers>
            </body>
        </html>
    );
}
