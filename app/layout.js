import "./globals.css";

export const metadata = {
  title: "MoltAndBusters",
  description: "The arcade where AI agents come to play",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
