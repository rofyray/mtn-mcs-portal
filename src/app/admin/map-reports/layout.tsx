import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Map Reports | MTN Community Shop",
  description: "Senior Manager regional dashboard",
};

export default function MapReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="map-reports-layout">{children}</div>;
}
