"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RASGOS } from "@/grupo/rasgos";
import { avatarUrl } from "@/grupo/miembros";

type Props = {
  voterSlug: string;
  targetSlug: string;
  otroNombre: string;
};

export function CalificarCliente({
  voterSlug,
  targetSlug,
  otroNombre,
}: Props) {
  const router = useRouter();
  const claves = useMemo(() => RASGOS.map((r) => r.clave), []);
  const [scores, setScores] = useState<Partial<Record<string, number>>>({});
  const [movido, setMovido] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listo = claves.length > 0 && claves.every((k) => movido[k]);

  async function guardar() {
    if (!listo) return;
    const scoresFinal: Record<string, number> = {};
    for (const k of claves) {
      const v = scores[k];
      if (typeof v !== "number" || Number.isNaN(v)) return;
      scoresFinal[k] = v;
    }
    setEnviando(true);
    setError(null);
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voter_slug: voterSlug,
        target_slug: targetSlug,
        scores: scoresFinal,
      }),
    });
    setEnviando(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "No se pudo guardar");
      return;
    }
    router.push(`/v/${voterSlug}`);
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <div className="flex items-center gap-3">
        <Image
          src={avatarUrl(targetSlug)}
          alt=""
          width={80}
          height={80}
          className="h-20 w-20 shrink-0 rounded-full bg-zinc-800 ring-2 ring-zinc-700"
          unoptimized
        />
        <div>
          <p className="text-sm text-zinc-400">Calificando a</p>
          <h1 className="text-xl font-semibold">{otroNombre}</h1>
        </div>
      </div>
      <p className="text-sm text-zinc-400">
        Izquierda 0, derecha 100. Mové cada barra para activarla; recién ahí
        podés guardar.
      </p>
      {error ? (
        <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-5">
        {RASGOS.map((r) => {
          const activo = movido[r.clave];
          const valor = scores[r.clave] ?? 50;
          return (
            <label
              key={r.clave}
              className={`flex flex-col gap-1 ${activo ? "" : "opacity-50"}`}
            >
              <div className="flex justify-between text-sm">
                <span className={activo ? "text-zinc-100" : "text-zinc-500"}>
                  {r.etiqueta}
                </span>
                <span
                  className={`tabular-nums ${activo ? "text-zinc-300" : "text-zinc-600"}`}
                >
                  {activo ? valor : "—"}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={valor}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setScores((s) => ({ ...s, [r.clave]: n }));
                  setMovido((m) => ({ ...m, [r.clave]: true }));
                }}
                className={`h-2 w-full cursor-pointer ${
                  activo
                    ? "accent-amber-400"
                    : "accent-zinc-600 opacity-80"
                }`}
              />
            </label>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={enviando || !listo}
          onClick={() => void guardar()}
          className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enviando ? "Guardando…" : "Guardar y volver"}
        </button>
        <Link
          href={`/v/${voterSlug}`}
          className="rounded-xl border border-zinc-700 px-4 py-3 text-center text-sm text-zinc-300 hover:border-zinc-500"
        >
          Cancelar
        </Link>
      </div>
    </main>
  );
}
