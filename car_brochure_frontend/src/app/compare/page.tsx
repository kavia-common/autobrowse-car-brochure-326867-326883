"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { compareCars, formatMoney, type CarDetail } from "@/lib/api";
import { Badge, Button, Card, EmptyState, Input } from "@/components/ui";

function useCompareSelection() {
  const key = "car_brochure_compare_ids";
  const [ids, setIds] = React.useState<number[]>([]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setIds(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(ids));
  }, [ids]);

  return { ids, setIds };
}

function CompareClient() {
  const sp = useSearchParams();
  const add = sp.get("add");
  const { ids, setIds } = useCompareSelection();

  const [manualId, setManualId] = React.useState("");
  const [cars, setCars] = React.useState<CarDetail[] | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!add) return;
    const id = Number(add);
    if (!Number.isFinite(id)) return;
    setIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id].slice(0, 4);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [add]);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      if (ids.length < 2) {
        setCars(null);
        return;
      }
      const out = await compareCars(ids);
      setCars(out.cars);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to compare cars");
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  function remove(id: number) {
    setIds((prev) => prev.filter((x) => x !== id));
  }

  function addManual() {
    const id = Number(manualId);
    if (!Number.isFinite(id)) return;
    setIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id].slice(0, 4);
      return next;
    });
    setManualId("");
  }

  const specKeys = Array.from(
    new Set((cars || []).flatMap((c) => (c.specs ? Object.keys(c.specs) : [])))
  ).slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Compare</h1>
          <p className="mt-1 text-sm text-slate-600">
            Select 2–4 cars to compare specs and pricing.
          </p>
        </div>
        <Link href="/" className="text-sm text-blue-700 hover:text-blue-800">
          ← Back to browse
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {ids.length === 0 ? (
              <Badge tone="slate">No cars selected</Badge>
            ) : (
              ids.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm"
                >
                  <span className="font-medium">#{id}</span>
                  <button
                    className="text-slate-500 hover:text-slate-900"
                    onClick={() => remove(id)}
                    type="button"
                    aria-label={`Remove ${id}`}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <Input
              label="Add car by ID"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="e.g. 3"
            />
            <Button
              type="button"
              onClick={addManual}
              disabled={ids.length >= 4}
            >
              Add
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIds([])}>
              Clear
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </Card>

      {ids.length < 2 ? (
        <EmptyState
          title="Add at least two cars to compare"
          description="Use “Add to compare” on the browse or detail pages, or add by ID above."
          actions={
            <Link href="/">
              <Button variant="secondary">Browse cars</Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[240px_repeat(4,minmax(180px,1fr))] border-b border-slate-200 bg-slate-50">
              <div className="p-4 text-sm font-semibold text-slate-700">
                Field
              </div>
              {(cars || []).map((c) => (
                <div key={c.id} className="p-4">
                  <div className="text-sm font-semibold">
                    {c.year} {c.make} {c.model}
                  </div>
                  <div className="text-xs text-slate-600">{c.trim || "—"}</div>
                  <div className="mt-2">
                    <Link
                      href={`/cars/${c.id}`}
                      className="text-xs text-blue-700 hover:text-blue-800"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[240px_repeat(4,minmax(180px,1fr))] border-b border-slate-200">
              <div className="p-4 text-sm font-medium text-slate-700">MSRP</div>
              {(cars || []).map((c) => (
                <div key={c.id} className="p-4 text-sm font-semibold">
                  {formatMoney(c.price_msrp, c.currency)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[240px_repeat(4,minmax(180px,1fr))] border-b border-slate-200">
              <div className="p-4 text-sm font-medium text-slate-700">
                Category
              </div>
              {(cars || []).map((c) => (
                <div key={c.id} className="p-4 text-sm">
                  {c.category ? (
                    <Badge tone="blue">{c.category.name}</Badge>
                  ) : (
                    "—"
                  )}
                </div>
              ))}
            </div>

            {specKeys.map((k) => (
              <div
                key={k}
                className="grid grid-cols-[240px_repeat(4,minmax(180px,1fr))] border-b border-slate-200"
              >
                <div className="p-4 text-sm font-medium text-slate-700">{k}</div>
                {(cars || []).map((c) => (
                  <div key={c.id} className="p-4 text-sm text-slate-700">
                    {c.specs && Object.prototype.hasOwnProperty.call(c.specs, k)
                      ? String((c.specs as Record<string, unknown>)[k])
                      : "—"}
                  </div>
                ))}
              </div>
            ))}

            {busy ? (
              <div className="p-4 text-sm text-slate-600">
                Loading comparison…
              </div>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <React.Suspense
      fallback={
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          Loading compare…
        </div>
      }
    >
      <CompareClient />
    </React.Suspense>
  );
}
