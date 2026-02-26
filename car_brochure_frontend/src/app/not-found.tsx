import Link from "next/link";
import React from "react";
import { Button, Card } from "@/components/ui";

export default function NotFound() {
  return (
    <Card className="p-6">
      <div className="text-2xl font-semibold">404 — Page Not Found</div>
      <div className="mt-2 text-sm text-slate-600">
        The page you’re looking for doesn’t exist.
      </div>
      <div className="mt-4">
        <Link href="/">
          <Button variant="secondary">Back to browse</Button>
        </Link>
      </div>
    </Card>
  );
}
