import { Suspense } from "react";

import { CatalogPage, CatalogPageFallback } from "@/components/catalog/catalog-page";

export default function HomePage() {
  return (
    <Suspense fallback={<CatalogPageFallback />}>
      <CatalogPage />
    </Suspense>
  );
}
