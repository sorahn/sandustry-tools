import { useEffect, useState } from "react";
import { BlueprintInspectorPage } from "./Inspector";
import { PageHeader } from "../components/PageHeader";
import { useParams } from "@tanstack/react-router";

type VaultBlueprint = {
  id: number;
  title: string;
  author: string;
};

const vaultApiBase = import.meta.env.VITE_VAULT_API_BASE_URL || "https://sandustryvault.com";

async function readResponse(response: Response) {
  if (response.ok) return response;
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  throw new Error(body?.error || `Vault request failed (${response.status})`);
}

export function VaultBlueprintInspectorPage() {
  const { vaultId } = useParams({ from: "/inspect/vault/$vaultId" });
  const id = Number(vaultId);
  const [blueprint, setBlueprint] = useState<VaultBlueprint | null>(null);
  const [encoded, setEncoded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    if (!Number.isInteger(id) || id <= 0) {
      setError("That Vault blueprint ID is not valid.");
      return () => controller.abort();
    }

    setBlueprint(null);
    setEncoded(null);
    setError(null);
    const pathId = encodeURIComponent(String(id));
    Promise.all([
      fetch(`${vaultApiBase}/blueprints/${pathId}`, { signal: controller.signal }).then(
        readResponse,
      ),
      fetch(`${vaultApiBase}/blueprints/${pathId}/string`, { signal: controller.signal }).then(
        readResponse,
      ),
    ])
      .then(async ([metadataResponse, stringResponse]) => {
        const metadata = (await metadataResponse.json()) as { blueprint?: VaultBlueprint };
        const value = (await stringResponse.text()).trim();
        if (!metadata.blueprint || !value) throw new Error("Vault returned an empty blueprint.");
        setBlueprint(metadata.blueprint);
        setEncoded(value);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Unable to load that Vault blueprint.");
      });

    return () => controller.abort();
  }, [id]);

  if (error) {
    return (
      <section className="space-y-6">
        <PageHeader title={`Vault blueprint #${vaultId}`}>
          We could not load this blueprint from Sandustry Vault.
        </PageHeader>
        <div
          role="alert"
          className="border border-red-400/40 bg-red-950/30 p-4 text-sm text-red-200"
        >
          {error}
        </div>
      </section>
    );
  }

  if (!encoded || !blueprint) {
    return (
      <section className="space-y-6">
        <PageHeader title={`Vault blueprint #${vaultId}`}>
          Loading the blueprint from Sandustry Vault…
        </PageHeader>
        <div
          role="status"
          className="border border-slate-800 bg-black/30 p-4 font-mono text-sm text-slate-400"
        >
          Fetching blueprint data…
        </div>
      </section>
    );
  }

  return (
    <BlueprintInspectorPage
      initialEncoded={encoded}
      initialMessage={`Loaded “${blueprint.title}” from Sandustry Vault.`}
      title={`Vault blueprint #${blueprint.id}: ${blueprint.title}`}
      description={
        <>
          From Sandustry Vault by {blueprint.author}. Inspect the fetched blueprint below, or use
          the Vault page to browse and share community prints.
        </>
      }
    />
  );
}
