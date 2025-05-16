// app/sitemap.ts
import { MetadataRoute } from 'next';
import { API } from './config/constants'; // Changed APP_CONFIG to API

// Mark this route as static for Next.js static export
export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Added a fallback for appUrl

    // Initialize with static routes
    const staticRoutes = [
        '',
        '/home',
        '/about',
        '/privacy',
        '/terms',
        '/legal',
        '/developers',
        '/upload',
        '/download',
        '/docs',
        '/docs/api',
        '/docs/faq',
        '/docs/getting-started',
        '/docs/local-usage',
        '/docs/tutorials',
    ].map((route) => ({
        url: `${appUrl}${route}`,
        lastModified: new Date().toISOString(),
    }));

    return staticRoutes; // Return only static routes
}
