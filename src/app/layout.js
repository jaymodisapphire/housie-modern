import "./globals.css";

export const metadata = {
  title: "Office Housie",
  description: "Modern Serverless Tambola Game",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}