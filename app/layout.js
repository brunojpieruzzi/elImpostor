import './globals.css';

export const metadata = {
  title: '🎭 Impostor',
  description: 'Un juego de palabras secretas, pistas y votos',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div id="confetti-layer" />
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
