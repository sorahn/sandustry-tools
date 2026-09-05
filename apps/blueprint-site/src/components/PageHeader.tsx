import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { TextAction } from "@sandustry/ui";

export function PageHeader({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div>
      <TextAction as={Link} to="/" className="font-mono text-xs text-slate-500">
        ← Home
      </TextAction>
      <h1 className="mt-4 text-3xl font-bold text-white">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{children}</p>
    </div>
  );
}
