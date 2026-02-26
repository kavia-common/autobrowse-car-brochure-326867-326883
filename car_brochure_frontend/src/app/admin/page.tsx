"use client";

import Link from "next/link";
import React from "react";
import {
  adminAddCarImage,
  adminCreateCar,
  adminDeleteCar,
  adminListCars,
  adminListInquiries,
  adminUpdateCar,
  formatMoney,
  listCategories,
  type AdminCarUpsert,
  type CarSummary,
  type Category,
  type InquiryOut,
} from "@/lib/api";
import { Badge, Button, Card, EmptyState, Input, Select, Textarea } from "@/components/ui";

type Tab = "cars" | "inquiries" | "new";

function getStoredAdminKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("car_brochure_admin_key") || "";
}

function setStoredAdminKey(key: string) {
  window.localStorage.setItem("car_brochure_admin_key", key);
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = React.useState("");
  const [authed, setAuthed] = React.useState(false);

  const [tab, setTab] = React.useState<Tab>("cars");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [cars, setCars] = React.useState<CarSummary[]>([]);
  const [inquiries, setInquiries] = React.useState<InquiryOut[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);

  // New / edit car form
  const [editId, setEditId] = React.useState<number | null>(null);
  const [make, setMake] = React.useState("");
  const [model, setModel] = React.useState("");
  const [year, setYear] = React.useState<number>(2024);
  const [trim, setTrim] = React.useState("");
  const [price, setPrice] = React.useState<string>("");
  const [currency, setCurrency] = React.useState("USD");
  const [categoryId, setCategoryId] = React.useState<number | "">("");
  const [published, setPublished] = React.useState(true);
  const [description, setDescription] = React.useState("");
  const [specsJson, setSpecsJson] = React.useState<string>("{}");

  const [imageUrl, setImageUrl] = React.useState("");
  const [imageAlt, setImageAlt] = React.useState("");
  const [imagePrimary, setImagePrimary] = React.useState(true);

  React.useEffect(() => {
    const stored = getStoredAdminKey();
    if (stored) {
      setAdminKey(stored);
      setAuthed(true);
    }
  }, []);

  async function refreshAll(key: string) {
    setBusy(true);
    setError(null);
    try {
      const [c, i, cats] = await Promise.all([
        adminListCars(key),
        adminListInquiries(key),
        listCategories(),
      ]);
      setCars(c);
      setInquiries(i);
      setCategories(cats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Admin request failed");
      setAuthed(false);
    } finally {
      setBusy(false);
    }
  }

  React.useEffect(() => {
    if (authed && adminKey) void refreshAll(adminKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  function login() {
    setStoredAdminKey(adminKey);
    setAuthed(true);
  }

  function logout() {
    setStoredAdminKey("");
    setAdminKey("");
    setAuthed(false);
  }

  function fillForEdit(c: CarSummary) {
    setEditId(c.id);
    setMake(c.make);
    setModel(c.model);
    setYear(c.year);
    setTrim(c.trim || "");
    setPrice(c.price_msrp != null ? String(c.price_msrp) : "");
    setCurrency(c.currency || "USD");
    setCategoryId(c.category?.id ?? "");
    setPublished(true);
    setDescription("");
    setSpecsJson("{}");
    setTab("new");
  }

  async function submitCar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let specs: Record<string, unknown> | null = null;
      try {
        specs = specsJson.trim() ? JSON.parse(specsJson) : null;
      } catch {
        throw new Error("Specs must be valid JSON (e.g. {\"hp\": 300}).");
      }

      const payload: AdminCarUpsert = {
        make,
        model,
        year,
        trim: trim || null,
        description: description || null,
        specs,
        price_msrp: price ? Number(price) : null,
        currency: currency || null,
        category_id: categoryId === "" ? null : categoryId,
        is_published: published,
      };

      if (editId == null) {
        const created = await adminCreateCar(adminKey, payload);
        if (imageUrl) {
          await adminAddCarImage(adminKey, created.id, {
            url: imageUrl,
            alt: imageAlt || null,
            sort_order: 0,
            is_primary: imagePrimary,
          });
        }
      } else {
        await adminUpdateCar(adminKey, editId, payload);
      }

      setEditId(null);
      setImageUrl("");
      setImageAlt("");
      setImagePrimary(true);

      await refreshAll(adminKey);
      setTab("cars");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save car");
    } finally {
      setBusy(false);
    }
  }

  async function delCar(id: number) {
    if (!confirm(`Delete car #${id}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await adminDeleteCar(adminKey, id);
      await refreshAll(adminKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete car");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage cars and review inquiries. Uses backend header{" "}
            <code className="rounded bg-slate-100 px-1">X-Admin-Key</code>.
          </p>
        </div>
        <Link href="/" className="text-sm text-blue-700 hover:text-blue-800">
          ← Back to browse
        </Link>
      </div>

      {!authed ? (
        <Card className="p-4 md:p-6">
          <div className="text-base font-semibold">Admin key required</div>
          <div className="mt-1 text-sm text-slate-600">
            Enter the admin key configured on the backend as{" "}
            <code className="rounded bg-slate-100 px-1">ADMIN_API_KEY</code>.
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
            <Input
              label="Admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Paste key here"
            />
            <Button onClick={login} disabled={!adminKey}>
              Enter admin
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={tab === "cars" ? "primary" : "secondary"}
              onClick={() => setTab("cars")}
            >
              Cars
            </Button>
            <Button
              variant={tab === "new" ? "primary" : "secondary"}
              onClick={() => setTab("new")}
            >
              {editId == null ? "New car" : `Edit #${editId}`}
            </Button>
            <Button
              variant={tab === "inquiries" ? "primary" : "secondary"}
              onClick={() => setTab("inquiries")}
            >
              Inquiries
            </Button>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" onClick={() => refreshAll(adminKey)} disabled={busy}>
                Refresh
              </Button>
              <Button variant="secondary" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {tab === "cars" ? (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">Car listings</div>
                <div className="text-sm text-slate-600">{cars.length} cars</div>
              </div>

              {cars.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="No cars found"
                    description="Create a car to get started."
                    actions={<Button onClick={() => setTab("new")}>New car</Button>}
                  />
                </div>
              ) : (
                <div className="mt-4 overflow-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-3 py-2 text-left">ID</th>
                        <th className="px-3 py-2 text-left">Car</th>
                        <th className="px-3 py-2 text-left">Category</th>
                        <th className="px-3 py-2 text-left">MSRP</th>
                        <th className="px-3 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cars.map((c) => (
                        <tr key={c.id} className="border-t border-slate-200">
                          <td className="px-3 py-2 font-medium">#{c.id}</td>
                          <td className="px-3 py-2">
                            {c.year} {c.make} {c.model}{" "}
                            <span className="text-slate-500">
                              {c.trim ? `• ${c.trim}` : ""}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {c.category ? (
                              <Badge tone="blue">{c.category.name}</Badge>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2 font-semibold">
                            {formatMoney(c.price_msrp, c.currency)}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => fillForEdit(c)}
                              >
                                Edit
                              </Button>
                              <Link href={`/cars/${c.id}`}>
                                <Button size="sm" variant="ghost">
                                  View
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => delCar(c.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ) : null}

          {tab === "inquiries" ? (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">Customer inquiries</div>
                <div className="text-sm text-slate-600">
                  {inquiries.length} inquiries
                </div>
              </div>

              {inquiries.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="No inquiries yet"
                    description="When users submit the inquiry form, they will appear here."
                  />
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-3">
                  {inquiries.map((i) => (
                    <Card key={i.id} className="p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-sm font-semibold">
                            #{i.id} • {i.inquiry_type}
                            {i.car_id != null ? ` • car #${i.car_id}` : ""}
                          </div>
                          <div className="mt-1 text-sm text-slate-700">
                            {i.name} • {i.email}{" "}
                            {i.phone ? <span>• {i.phone}</span> : null}
                          </div>
                          {i.message ? (
                            <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                              {i.message}
                            </div>
                          ) : (
                            <div className="mt-2 text-sm text-slate-500">
                              (No message)
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(i.created_at).toLocaleString()}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          ) : null}

          {tab === "new" ? (
            <Card className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">
                  {editId == null ? "Create car" : `Update car #${editId}`}
                </div>
                {editId != null ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditId(null);
                      setTab("cars");
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>

              <form onSubmit={submitCar} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="Make" value={make} onChange={(e) => setMake(e.target.value)} required />
                <Input label="Model" value={model} onChange={(e) => setModel(e.target.value)} required />
                <Input
                  label="Year"
                  inputMode="numeric"
                  value={String(year)}
                  onChange={(e) => setYear(Number(e.target.value || "0"))}
                  required
                />
                <Input label="Trim (optional)" value={trim} onChange={(e) => setTrim(e.target.value)} />
                <Input label="MSRP (optional)" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 34999" />
                <Input label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" />

                <Select
                  label="Category (optional)"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Published"
                  value={published ? "yes" : "no"}
                  onChange={(e) => setPublished(e.target.value === "yes")}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>

                <div className="md:col-span-2">
                  <Textarea
                    label="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Specs JSON (optional)"
                    hint='Example: {"hp": 300, "range_miles": 320}'
                    value={specsJson}
                    onChange={(e) => setSpecsJson(e.target.value)}
                    rows={4}
                  />
                </div>

                {editId == null ? (
                  <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-800">
                      Optional primary image for new car
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Input
                        label="Image URL"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                      />
                      <Input
                        label="Alt text (optional)"
                        value={imageAlt}
                        onChange={(e) => setImageAlt(e.target.value)}
                      />
                      <Select
                        label="Is primary"
                        value={imagePrimary ? "yes" : "no"}
                        onChange={(e) => setImagePrimary(e.target.value === "yes")}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </Select>
                      <div className="text-xs text-slate-600 self-end">
                        Images are URLs (no upload UI in this simple admin).
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="md:col-span-2 flex items-center gap-3">
                  <Button type="submit" disabled={busy}>
                    {editId == null ? "Create car" : "Update car"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => refreshAll(adminKey)}
                    disabled={busy}
                  >
                    Refresh
                  </Button>
                </div>
              </form>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
