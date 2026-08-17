import './globals.css';

export const metadata = {
  title: 'El Oráculo 🔮',
  description: 'Un juego para descubrir el gran secreto',
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
        <footer className="site-footer">🔮 El Oráculo</footer>
      </body>
    </html>
  );
}
