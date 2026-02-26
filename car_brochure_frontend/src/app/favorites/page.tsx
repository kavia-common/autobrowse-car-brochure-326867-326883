"use client";

import Link from "next/link";
import React from "react";
import {
  formatMoney,
  getUserKey,
  listFavorites,
  removeFavorite,
  type CarSummary,
} from "@/lib/api";
import { Badge, Button, Card, EmptyState } from "@/components/ui";

export default function FavoritesPage() {
  const [busy, setBusy] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<
    Array<{ car: CarSummary; created_at: string }>
  >([]);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const res = await listFavorites(getUserKey());
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load favorites");
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  async function onRemove(carId: number) {
    setError(null);
    try {
      await removeFavorite(getUserKey(), carId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to remove favorite");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Favorites</h1>
          <p className="mt-1 text-sm text-slate-600">
            Your saved cars (stored in this browser).
          </p>
        </div>
        <Link href="/" className="text-sm text-blue-700 hover:text-blue-800">
          ← Back to browse
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!busy && items.length === 0 ? (
        <EmptyState
          title="No favorites yet"
          description="Browse cars and tap Favorite on a detail page."
          actions={
            <Link href="/">
              <Button variant="secondary">Browse cars</Button>
            </Link>
          }
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((it) => (
          <Card key={it.car.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">
                  {it.car.year} {it.car.make} {it.car.model}
                </div>
                <div className="mt-0.5 text-sm text-slate-600">
                  {it.car.trim || "—"}{" "}
                  {it.car.category ? (
                    <span className="ml-2">
                      <Badge tone="blue">{it.car.category.name}</Badge>
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="text-sm font-semibold">
                {formatMoney(it.car.price_msrp, it.car.currency)}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <Link
                href={`/cars/${it.car.id}`}
                className="text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                View details →
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(it.car.id)}
              >
                Remove
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
