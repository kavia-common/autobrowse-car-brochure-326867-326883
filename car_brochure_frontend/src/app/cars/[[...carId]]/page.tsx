import CarDetailClient from "./CarDetailClient";
import { listCars } from "@/lib/api";

/**
 * This route must be statically exportable because `next.config.ts` uses
 * `output: "export"`. Therefore, this file is a Server Component and exports
 * `generateStaticParams()`. Interactive behavior lives in CarDetailClient.
 */

export const dynamicParams = false;

// PUBLIC_INTERFACE
export async function generateStaticParams(): Promise<Array<{ carId: string[] }>> {
  /** Pre-render car detail pages for the available catalog (up to 48 items). */
  try {
    const res = await listCars({ page: 1, page_size: 48 });
    return res.items.map((c) => ({ carId: [String(c.id)] }));
  } catch {
    // If API isn't reachable at build time, return empty and export will still succeed.
    return [];
  }
}

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ carId?: string[] }>;
}) {
  const { carId } = await params;

  // When no ID is provided (e.g. /cars), show a small redirect-ish UI.
  const first = carId?.[0];
  const id = first ? Number(first) : NaN;

  if (!Number.isFinite(id)) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
        Missing car id. Please go back to the browse page and select a car.
      </div>
    );
  }

  return <CarDetailClient carId={id} />;
}
