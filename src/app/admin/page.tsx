"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MIEMBROS } from "@/grupo/miembros";
import { RASGOS } from "@/grupo/rasgos";
import type { FilaVoto } from "@/lib/votos-store";

export default function AdminPage() {
  const [filas, setFilas] = useState<FilaVoto[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<{
    voter: string;
    target: string;
  } | null>(null);

  const cargar = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/votes");
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(j.error ?? "No se pudieron leer los votos");
      setFilas([]);
      return;
    }
    const data = (await res.json()) as FilaVoto[];
    setFilas(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const nombre = useMemo(() => {
    const m = new Map(MIEMBROS.map((x) => [x.slug, x.nombre]));
    return (slug: string) => m.get(slug) ?? slug;
  }, []);

  const porEvaluado = useMemo(() => {
    const map = new Map<string, FilaVoto[]>();
    if (!filas) return map;
    for (const f of filas) {
      const arr = map.get(f.target_slug) ?? [];
      arr.push(f);
      map.set(f.target_slug, arr);
    }
    return map;
  }, [filas]);

  const promedios = useMemo(() => {
    const out = new Map<
      string,
      { clave: string; promedio: number; n: number }[]
    >();
    if (!filas) return out;
    for (const m of MIEMBROS) {
      const lista = filas.filter((f) => f.target_slug === m.slug);
      const filaProm: { clave: string; promedio: number; n: number }[] = [];
      for (const r of RASGOS) {
        const vals = lista
          .map((f) => f.scores[r.clave])
          .filter((v): v is number => typeof v === "number");
        const n = vals.length;
        const sum = vals.reduce((a, b) => a + b, 0);
        filaProm.push({
          clave: r.clave,
          promedio: n ? Math.round((sum / n) * 10) / 10 : 0,
          n,
        });
      }
      out.set(m.slug, filaProm);
    }
    return out;
  }, [filas]);

  const filaDetalle = useMemo(() => {
    if (!detalle || !filas) return null;
    return filas.find(
      (f) =>
        f.voter_slug === detalle.voter && f.target_slug === detalle.target,
    );
  }, [detalle, filas]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Backoffice</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Quién votó a quién, detalle y promedios por evaluado.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void cargar()}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:border-zinc-500"
          >
            Recargar
          </button>
        </div>
      </div>
      {err ? (
        <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {err}
        </p>
      ) : null}
      {filas === null ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-amber-200/90">
              Respuestas por evaluado
            </h2>
            <div className="flex flex-col gap-6">
              {MIEMBROS.map((ev) => {
                const lista = porEvaluado.get(ev.slug) ?? [];
                return (
                  <div
                    key={ev.slug}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
                  >
                    <h3 className="font-medium">{ev.nombre}</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Votaron {lista.length} persona
                      {lista.length === 1 ? "" : "s"}
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {lista.map((f) => (
                        <li key={f.voter_slug}>
                          <button
                            type="button"
                            onClick={() =>
                              setDetalle({
                                voter: f.voter_slug,
                                target: f.target_slug,
                              })
                            }
                            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm hover:border-amber-700/60"
                          >
                            {nombre(f.voter_slug)}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {lista.length === 0 ? (
                      <p className="mt-2 text-sm text-zinc-500">
                        Todavía nadie votó a esta persona.
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-amber-200/90">
              Promedios por evaluado
            </h2>
            <div className="flex flex-col gap-4">
              {MIEMBROS.map((ev) => {
                const fila = promedios.get(ev.slug) ?? [];
                return (
                  <div
                    key={ev.slug}
                    className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40"
                  >
                    <table className="w-full min-w-[480px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400">
                          <th className="px-3 py-2 font-medium">{ev.nombre}</th>
                          <th className="px-3 py-2 font-medium">Promedio</th>
                          <th className="px-3 py-2 font-medium">Cant. votos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {RASGOS.map((r) => {
                          const p = fila.find((x) => x.clave === r.clave);
                          return (
                            <tr
                              key={r.clave}
                              className="border-b border-zinc-800/80"
                            >
                              <td className="px-3 py-2">{r.etiqueta}</td>
                              <td className="px-3 py-2 tabular-nums">
                                {p && p.n > 0 ? p.promedio : "—"}
                              </td>
                              <td className="px-3 py-2 tabular-nums text-zinc-500">
                                {p?.n ?? 0}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
      {detalle && filaDetalle ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="presentation"
          onClick={() => setDetalle(null)}
        >
          <div
            role="dialog"
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">
              Voto de {nombre(detalle.voter)} → {nombre(detalle.target)}
            </h3>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {RASGOS.map((r) => (
                <li
                  key={r.clave}
                  className="flex justify-between gap-4 border-b border-zinc-800/80 py-1"
                >
                  <span className="text-zinc-400">{r.etiqueta}</span>
                  <span className="tabular-nums font-medium">
                    {filaDetalle.scores[r.clave] ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-6 w-full rounded-xl border border-zinc-600 py-2 text-sm hover:bg-zinc-900"
              onClick={() => setDetalle(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
