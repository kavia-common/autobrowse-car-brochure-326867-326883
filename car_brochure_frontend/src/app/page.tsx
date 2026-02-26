"use client";

import Link from "next/link";
import React from "react";
import {
  formatMoney,
  listCars,
  listCategories,
  type CarListResponse,
  type Category,
} from "@/lib/api";
import { Badge, Button, Card, EmptyState, Input, Select, cn } from "@/components/ui";

function CarCard({ car }: { car: CarListResponse["items"][number] }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[16/10] w-full bg-slate-100">
        {/* Using <img> for simplicity with static export mode. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={car.primary_image_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500'%3E%3Crect width='800' height='500' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' fill='%2364748b' font-family='system-ui' font-size='24'%3ENo image%3C/text%3E%3C/svg%3E"}
          alt={`${car.make} ${car.model}`}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold">
              {car.year} {car.make} {car.model}
            </div>
            <div className="mt-0.5 text-sm text-slate-600">
              {car.trim || "—"}{" "}
              {car.category ? (
                <span className="ml-2">
                  <Badge tone="blue">{car.category.name}</Badge>
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {formatMoney(car.price_msrp, car.currency)}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <Link
            href={`/cars/${car.id}`}
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            View details →
          </Link>
          <Link
            href={`/compare?add=${car.id}`}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Add to compare
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default function BrowsePage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters / query state
  const [q, setQ] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<number | "">("");
  const [minYear, setMinYear] = React.useState<number | "">("");
  const [maxYear, setMaxYear] = React.useState<number | "">("");
  const [minPrice, setMinPrice] = React.useState<number | "">("");
  const [maxPrice, setMaxPrice] = React.useState<number | "">("");
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  const [data, setData] = React.useState<CarListResponse | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [cats, cars] = await Promise.all([
        listCategories(),
        listCars({
          q: q || undefined,
          category_id: categoryId === "" ? undefined : categoryId,
          min_year: minYear === "" ? undefined : minYear,
          max_year: maxYear === "" ? undefined : maxYear,
          min_price: minPrice === "" ? undefined : minPrice,
          max_price: maxPrice === "" ? undefined : maxPrice,
          page,
          page_size: pageSize,
        }),
      ]);
      setCategories(cats);
      setData(cars);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    void load();
  }

  function clearFilters() {
    setQ("");
    setCategoryId("");
    setMinYear("");
    setMaxYear("");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
    void load();
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="k-gradient rounded-2xl border border-slate-200 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Browse cars</h1>
          <p className="mt-1 text-sm text-slate-600">
            Search and filter by category, year, and MSRP. Compare up to 4 cars.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/favorites">
            <Button variant="secondary">View favorites</Button>
          </Link>
          <Link href="/compare">
            <Button variant="primary">Compare</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
        <Card className="p-4">
          <form onSubmit={applyFilters} className="space-y-4">
            <Input
              label="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Make, model, trim..."
            />

            <Select
              label="Category"
              value={categoryId}
              onChange={(e) =>
                setCategoryId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Min year"
                inputMode="numeric"
                value={minYear}
                onChange={(e) =>
                  setMinYear(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="2018"
              />
              <Input
                label="Max year"
                inputMode="numeric"
                value={maxYear}
                onChange={(e) =>
                  setMaxYear(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Min MSRP"
                inputMode="numeric"
                value={minPrice}
                onChange={(e) =>
                  setMinPrice(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="20000"
              />
              <Input
                label="Max MSRP"
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="70000"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Apply
              </Button>
              <Button type="button" variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <div className="font-medium text-slate-700">Backend API</div>
              <div className="mt-1">
                Configure <code>NEXT_PUBLIC_API_BASE_URL</code> to point to the
                FastAPI service (e.g. <code>http://localhost:8000</code>).
              </div>
            </div>
          </form>
        </Card>

        <div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {loading ? "Loading..." : `${total} results`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Prev
              </Button>
              <div className="text-sm text-slate-600">
                Page <span className="font-medium text-slate-900">{page}</span>{" "}
                / {totalPages}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {!loading && data && data.items.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No cars match your filters"
                description="Try clearing filters or broadening your search."
                actions={
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : null}

          <div
            className={cn(
              "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
              loading ? "opacity-70" : ""
            )}
          >
            {(data?.items || Array.from({ length: 6 }).map((_, i) => i)).map(
              (item, idx) =>
                typeof item === "number" ? (
                  <Card key={idx} className="overflow-hidden">
                    <div className="aspect-[16/10] bg-slate-100 animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 w-2/3 bg-slate-100 animate-pulse rounded" />
                      <div className="h-3 w-1/2 bg-slate-100 animate-pulse rounded" />
                      <div className="h-3 w-1/3 bg-slate-100 animate-pulse rounded" />
                    </div>
                  </Card>
                ) : (
                  <CarCard key={item.id} car={item} />
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
