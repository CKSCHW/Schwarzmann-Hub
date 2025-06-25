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
        src: 'https://www.elektro-schwarzmann.at/images/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
