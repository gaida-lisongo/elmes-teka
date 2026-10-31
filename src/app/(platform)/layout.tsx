import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plateforme | ELMES-TEKA",
  robots: { index: false, follow: false },
};

export default function PlatformRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50 dark:bg-gray-950">{children}</div>;
}
