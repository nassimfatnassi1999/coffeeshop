import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource-variable/manrope';
import 'lenis/dist/lenis.css';
import './globals.css';

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'KAHWA — Specialty Coffee Roasters',
  description:
    'Café de spécialité torréfié en petites séries. Origines uniques, espresso, latte et cold brew — du grain à la tasse.',
  openGraph: {
    title: 'KAHWA — Specialty Coffee Roasters',
    description: 'Torréfié lentement, servi avec soin.',
    images: ['/og.jpg'],
  },
};

export const viewport = {
  themeColor: '#120a06',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="is-loading">{children}</body>
    </html>
  );
}
