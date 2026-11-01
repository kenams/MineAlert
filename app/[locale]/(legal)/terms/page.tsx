import type { Metadata } from "next";

import { LegalPageView, legalMetadata, type LegalPageProps } from "@/components/legal/LegalPageView";

export function generateMetadata({ params }: LegalPageProps): Metadata {
  return legalMetadata("terms", params.locale);
}

export default function Page({ params }: LegalPageProps): JSX.Element {
  return <LegalPageView pageKey="terms" locale={params.locale} />;
}
