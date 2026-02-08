export const metadata = {
  title: "MoltAndBusters",
  description: "An arcade for agents",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
