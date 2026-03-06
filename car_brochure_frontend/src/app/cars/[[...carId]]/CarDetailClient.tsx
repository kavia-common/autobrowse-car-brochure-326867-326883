"use client";

import Link from "next/link";
import React from "react";
import {
  addFavorite,
  createInquiry,
  formatMoney,
  getCarDetail,
  getUserKey,
  removeFavorite,
  type CarDetail,
} from "@/lib/api";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui";
import { PaymentCalculator, type PaymentCalculatorApi } from "@/components/PaymentCalculator";
import { TradeInEstimator } from "@/components/TradeInEstimator";

function SpecsTable({ specs }: { specs: Record<string, unknown> | null }) {
  if (!specs || Object.keys(specs).length === 0) {
    return <div className="text-sm text-slate-600">No specs provided.</div>;
  }
  const entries = Object.entries(specs);
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} className="border-t border-slate-200 first:border-t-0">
              <td className="w-1/3 bg-slate-50 px-3 py-2 font-medium text-slate-700">
                {k}
              </td>
              <td className="px-3 py-2 text-slate-700">
                {typeof v === "string" || typeof v === "number"
                  ? String(v)
                  : JSON.stringify(v)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function CarDetailClient({ carId }: { carId: number }) {
  /** Interactive car detail UI: loads data client-side and supports favorites/inquiry. */
  const [car, setCar] = React.useState<CarDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [activeImageIdx, setActiveImageIdx] = React.useState(0);
  const [favoriteBusy, setFavoriteBusy] = React.useState(false);
  const [favoriteStatus, setFavoriteStatus] = React.useState<
    "unknown" | "added" | "removed"
  >("unknown");

  const [inqName, setInqName] = React.useState("");
  const [inqEmail, setInqEmail] = React.useState("");
  const [inqPhone, setInqPhone] = React.useState("");
  const [inqMessage, setInqMessage] = React.useState("");
  const [inqSent, setInqSent] = React.useState<string | null>(null);
  const [inqBusy, setInqBusy] = React.useState(false);

  // Payment calculator integration API for reusable cross-widget flows (e.g. trade-in estimator).
  const [paymentApi, setPaymentApi] = React.useState<PaymentCalculatorApi | null>(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCarDetail(carId);
        setCar(data);
        setActiveImageIdx(0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [carId]);

  async function onAddFavorite() {
    if (!car) return;
    setFavoriteBusy(true);
    try {
      await addFavorite(getUserKey(), car.id);
      setFavoriteStatus("added");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to add favorite");
    } finally {
      setFavoriteBusy(false);
    }
  }

  async function onRemoveFavorite() {
    if (!car) return;
    setFavoriteBusy(true);
    try {
      await removeFavorite(getUserKey(), car.id);
      setFavoriteStatus("removed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to remove favorite");
    } finally {
      setFavoriteBusy(false);
    }
  }

  async function submitInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!car) return;
    setInqBusy(true);
    setError(null);
    setInqSent(null);
    try {
      const out = await createInquiry({
        car_id: car.id,
        inquiry_type: "test_drive",
        name: inqName,
        email: inqEmail,
        phone: inqPhone || null,
        message: inqMessage || null,
      });
      setInqSent(`Inquiry #${out.id} submitted. We'll contact you soon.`);
      setInqMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit inquiry");
    } finally {
      setInqBusy(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-6 w-1/2 rounded bg-slate-100 animate-pulse" />
        <div className="mt-4 aspect-[16/10] rounded bg-slate-100 animate-pulse" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-sm text-red-700">{error}</div>
        <div className="mt-4">
          <Link href="/" className="text-sm text-blue-700 hover:text-blue-800">
            ← Back to browse
          </Link>
        </div>
      </Card>
    );
  }

  if (!car) return null;

  const images = car.images?.length ? car.images : [];
  const active =
    images[activeImageIdx] ||
    ({
      url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='750'%3E%3Crect width='1200' height='750' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' fill='%2364748b' font-family='system-ui' font-size='28'%3ENo image%3C/text%3E%3C/svg%3E",
      alt: "No image",
      id: -1,
      is_primary: true,
      sort_order: 0,
    } as const);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            ← Back to browse
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">
            {car.year} {car.make} {car.model}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>{car.trim || "—"}</span>
            {car.category ? (
              <Badge tone="blue">{car.category.name}</Badge>
            ) : null}
            <span className="font-semibold text-slate-900">
              {formatMoney(car.price_msrp, car.currency)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/compare?add=${car.id}`}>
            <Button variant="secondary">Add to compare</Button>
          </Link>
          <Button
            onClick={onAddFavorite}
            disabled={favoriteBusy}
            variant="primary"
          >
            Favorite
          </Button>
          <Button
            onClick={onRemoveFavorite}
            disabled={favoriteBusy}
            variant="ghost"
          >
            Unfavorite
          </Button>
        </div>
      </div>

      {favoriteStatus !== "unknown" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          Favorite status:{" "}
          <span className="font-medium">
            {favoriteStatus === "added" ? "Added" : "Removed"}
          </span>
          .{" "}
          <Link href="/favorites" className="text-blue-700 hover:text-blue-800">
            View favorites →
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <div className="aspect-[16/10] bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.alt || `${car.make} ${car.model}`}
              className="h-full w-full object-cover"
            />
          </div>
          {images.length > 1 ? (
            <div className="flex gap-2 overflow-auto border-t border-slate-200 bg-white p-3">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={[
                    "h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border transition",
                    idx === activeImageIdx
                      ? "border-blue-500"
                      : "border-slate-200 hover:border-slate-300",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.alt || "Car image"}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </Card>

        <div className="space-y-6">
          <TradeInEstimator
            currency={car.currency}
            onApply={({ tradeInCredit, negativeEquity }) => {
              // Canonical integration point: all updates go through PaymentCalculatorApi.
              // (We intentionally ignore negativeEquity in the payment estimate for now.)
              paymentApi?.applyTradeIn({ tradeInCredit, negativeEquity });
            }}
          />

          <PaymentCalculator
            price={car.price_msrp}
            currency={car.currency}
            carLabel={`${car.year} ${car.make} ${car.model}`}
            onReady={(api) => setPaymentApi(api)}
          />

          <Card className="p-4">
            <div className="text-base font-semibold">Overview</div>
            <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
              {car.description || "No description provided."}
            </div>

            <div className="mt-4">
              <div className="text-base font-semibold">Specs</div>
              <div className="mt-2">
                <SpecsTable specs={car.specs} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-base font-semibold">Request a test drive</div>
            <div className="text-sm text-slate-600">
              Submit an inquiry and we’ll contact you.
            </div>
          </div>
          <Link
            href="/inquiry"
            className="text-sm text-blue-700 hover:text-blue-800"
          >
            Use general inquiry form →
          </Link>
        </div>

        <form
          onSubmit={submitInquiry}
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"
        >
          <Input
            label="Name"
            value={inqName}
            onChange={(e) => setInqName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={inqEmail}
            onChange={(e) => setInqEmail(e.target.value)}
            required
          />
          <Input
            label="Phone (optional)"
            value={inqPhone}
            onChange={(e) => setInqPhone(e.target.value)}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Message (optional)"
              value={inqMessage}
              onChange={(e) => setInqMessage(e.target.value)}
              rows={4}
              placeholder="Preferred times, questions, etc."
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <Button type="submit" disabled={inqBusy}>
              Submit inquiry
            </Button>
            {inqSent ? (
              <div className="text-sm text-emerald-700">{inqSent}</div>
            ) : null}
          </div>
        </form>
      </Card>
    </div>
  );
}
