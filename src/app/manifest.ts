import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Elektro Schwarzmann',
    short_name: 'Schwarzmann App',
    description: 'Interne App für News und Wocheneinteilungen von Elektro Schwarzmann.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#eb680d',
    icons: [
       {
        src: 'https://www.elektro-schwarzmann.at/wp-content/uploads/2022/06/cropped-Favicon_Elektro_Schwarzmann-Wiener-Neustadt-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://www.elektro-schwarzmann.at/wp-content/uploads/2022/06/cropped-Favicon_Elektro_Schwarzmann-Wiener-Neustadt-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
