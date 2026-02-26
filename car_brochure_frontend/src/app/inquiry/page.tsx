"use client";

import Link from "next/link";
import React from "react";
import { createInquiry } from "@/lib/api";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";

export default function InquiryPage() {
  const [type, setType] = React.useState<"contact" | "test_drive">("contact");
  const [carId, setCarId] = React.useState<string>("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const out = await createInquiry({
        inquiry_type: type,
        car_id: carId ? Number(carId) : null,
        name,
        email,
        phone: phone || null,
        message: message || null,
      });
      setSuccess(`Submitted inquiry #${out.id}. We'll contact you soon.`);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit inquiry");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inquiry</h1>
          <p className="mt-1 text-sm text-slate-600">
            Send a message or request a test drive.
          </p>
        </div>
        <Link href="/" className="text-sm text-blue-700 hover:text-blue-800">
          ← Back to browse
        </Link>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="cyan">Fast</Badge>
          <Badge tone="blue">Secure</Badge>
          <span className="text-sm text-slate-600">
            Inquiries are stored server-side for admin review.
          </span>
        </div>

        <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Inquiry type"
            value={type}
            onChange={(e) => {
              const v = e.target.value;
              setType(v === "test_drive" ? "test_drive" : "contact");
            }}
          >
            <option value="contact">Contact</option>
            <option value="test_drive">Test drive</option>
          </Select>

          <Input
            label="Car ID (optional)"
            value={carId}
            onChange={(e) => setCarId(e.target.value)}
            placeholder="Link to a specific car, e.g. 2"
          />

          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <div className="md:col-span-2">
            <Textarea
              label="Message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="What can we help with?"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={busy}>
              Submit inquiry
            </Button>
            {error ? <div className="text-sm text-red-700">{error}</div> : null}
            {success ? (
              <div className="text-sm text-emerald-700">{success}</div>
            ) : null}
          </div>
        </form>
      </Card>
    </div>
  );
}
