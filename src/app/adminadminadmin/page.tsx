"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MIEMBROS,
  avatarUrl,
  clasesAvatarRecorte,
} from "@/grupo/miembros";
import { RASGOS } from "@/grupo/rasgos";
import type { FilaVoto } from "@/lib/votos-store";

type FilaProm = { clave: string; promedio: number; n: number };

function BarraValor({
  etiqueta,
  valor,
  maximo,
  subtitulo,
  variante,
}: {
  etiqueta: string;
  valor: number;
  maximo: number;
  subtitulo?: string;
  variante?: "linea" | "bloque";
}) {
  const pct = maximo > 0 ? Math.min(100, Math.max(0, (valor / maximo) * 100)) : 0;
  const esBloque = variante === "bloque";
  const altoBarra = esBloque ? "h-2" : "h-1.5";
  const inner = (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-zinc-800 ring-1 ring-zinc-700/60 ${altoBarra}`}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-800 via-amber-500 to-amber-300 transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
  if (esBloque) {
    return (
      <div className="rounded-lg border border-zinc-800/90 bg-zinc-900/40 px-2 py-1.5 ring-1 ring-zinc-800/30">
        <div className="mb-1 flex items-start justify-between gap-2">
          {etiqueta ? (
            <span
              className="line-clamp-2 min-w-0 flex-1 text-xs font-medium leading-tight text-zinc-300"
              title={etiqueta}
            >
              {etiqueta}
            </span>
          ) : (
            <span className="flex-1" />
          )}
          <span className="shrink-0 text-sm font-bold tabular-nums text-amber-300">
            {Number.isInteger(valor) ? valor : valor.toFixed(1)}
          </span>
        </div>
        {inner}
        {subtitulo ? (
          <p className="mt-1 text-[9px] uppercase tracking-wide text-zinc-600">
            {subtitulo}
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-2 text-[11px]">
        {etiqueta ? (
          <span
            className="line-clamp-2 min-w-0 flex-1 leading-tight text-zinc-500"
            title={etiqueta}
          >
            {etiqueta}
          </span>
        ) : (
          <span className="min-w-0 flex-1" />
        )}
        <span className="shrink-0 tabular-nums font-semibold text-amber-300/90">
          {Number.isInteger(valor) ? valor : valor.toFixed(1)}
        </span>
      </div>
      {inner}
      {subtitulo ? (
        <p className="text-[9px] uppercase tracking-wide text-zinc-600">
          {subtitulo}
        </p>
      ) : null}
    </div>
  );
}

function ordenarPromediosDesc(fila: FilaProm[]) {
  return [...fila].sort((a, b) => {
    if (a.n === 0 && b.n === 0) return 0;
    if (a.n === 0) return 1;
    if (b.n === 0) return -1;
    return b.promedio - a.promedio;
  });
}

export default function AdminPage() {
  const [filas, setFilas] = useState<FilaVoto[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

  const promedios = useMemo(() => {
    const out = new Map<string, FilaProm[]>();
    if (!filas) return out;
    for (const m of MIEMBROS) {
      const lista = filas.filter((f) => f.target_slug === m.slug);
      const filaProm: FilaProm[] = [];
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

  const asignacionVotantes = useMemo(() => {
    const targetsPorVotante = new Map<string, Set<string>>();
    const meta = Math.max(0, MIEMBROS.length - 1);
    if (!filas?.length) {
      return { listo: [] as typeof MIEMBROS, falta: [...MIEMBROS] };
    }
    for (const f of filas) {
      const s = targetsPorVotante.get(f.voter_slug) ?? new Set();
      s.add(f.target_slug);
      targetsPorVotante.set(f.voter_slug, s);
    }
    const listo = MIEMBROS.filter(
      (m) => (targetsPorVotante.get(m.slug)?.size ?? 0) >= meta,
    );
    const falta = MIEMBROS.filter(
      (m) => (targetsPorVotante.get(m.slug)?.size ?? 0) < meta,
    );
    return { listo, falta };
  }, [filas]);

  const ordenPorRasgo = useMemo(() => {
    const map = new Map<
      string,
      { slug: string; nombre: string; promedio: number; n: number }[]
    >();
    for (const r of RASGOS) {
      const rows = MIEMBROS.map((m) => {
        const fila = promedios.get(m.slug) ?? [];
        const p = fila.find((x) => x.clave === r.clave);
        return {
          slug: m.slug,
          nombre: m.nombre,
          promedio: p?.promedio ?? 0,
          n: p?.n ?? 0,
        };
      }).sort((a, b) => {
        if (a.n === 0 && b.n === 0) return 0;
        if (a.n === 0) return 1;
        if (b.n === 0) return -1;
        return b.promedio - a.promedio;
      });
      map.set(r.clave, rows);
    }
    return map;
  }, [promedios]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 pb-10">
      <div className="mx-auto max-w-5xl px-3 py-6 sm:px-5">
        <header className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 shadow-lg shadow-black/30">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="relative">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
              Resultados
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Solo promedios agregados · sin votos individuales
            </p>
          </div>
        </header>

        {err ? (
          <p className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-200">
            {err}
          </p>
        ) : null}

        {filas === null ? (
          <div className="mt-6 space-y-2">
            <div className="h-6 w-40 animate-pulse rounded bg-zinc-800" />
            <div className="h-20 animate-pulse rounded-lg bg-zinc-800/60" />
          </div>
        ) : (
          <>
            <section className="mt-5 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/20 p-3 ring-1 ring-emerald-900/20">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90">
                  Ya completaron sus votos
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {asignacionVotantes.listo.length === 0 ? (
                    <span className="text-[11px] text-zinc-600">Nadie aún.</span>
                  ) : (
                    asignacionVotantes.listo.map((m) => (
                      <div
                        key={m.slug}
                        className="flex items-center gap-1 rounded-md border border-emerald-900/25 bg-zinc-950/50 py-0.5 pl-0.5 pr-2"
                      >
                        <Image
                          src={avatarUrl(m.slug)}
                          alt=""
                          width={22}
                          height={22}
                          className={`${clasesAvatarRecorte} h-[22px] w-[22px] shrink-0 bg-zinc-800`}
                          unoptimized
                        />
                        <span className="text-[11px] font-medium text-zinc-200">
                          {m.nombre}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-amber-900/30 bg-amber-950/15 p-3 ring-1 ring-amber-900/20">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">
                  Faltan completar
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {asignacionVotantes.falta.length === 0 ? (
                    <span className="text-[11px] text-emerald-400/90">
                      Todos listos.
                    </span>
                  ) : (
                    asignacionVotantes.falta.map((m) => (
                      <div
                        key={m.slug}
                        className="flex items-center gap-1 rounded-md border border-zinc-700/80 bg-zinc-950/50 py-0.5 pl-0.5 pr-2"
                      >
                        <Image
                          src={avatarUrl(m.slug)}
                          alt=""
                          width={22}
                          height={22}
                          className={`${clasesAvatarRecorte} h-[22px] w-[22px] shrink-0 bg-zinc-800`}
                          unoptimized
                        />
                        <span className="text-[11px] font-medium text-zinc-200">
                          {m.nombre}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-200">
                Por cada pregunta (promedio)
              </h2>
              <p className="text-[11px] text-zinc-500">
                Orden: más alto primero. Nadie puede ver quién votó.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                {RASGOS.map((r) => (
                  <article
                    key={r.clave}
                    className="rounded-lg border border-zinc-800/90 bg-zinc-900/30 p-2.5 ring-1 ring-zinc-800/30"
                  >
                    <h3 className="border-b border-zinc-800/70 pb-2 text-xs font-semibold text-amber-200/95">
                      {r.etiqueta}
                    </h3>
                    <ul className="scrollbar-oculto mt-2 max-h-[280px] space-y-1 overflow-y-auto pr-0.5">
                      {(ordenPorRasgo.get(r.clave) ?? []).map((row, idx) => (
                        <li
                          key={row.slug}
                          className="flex items-center gap-2 rounded-md border border-zinc-800/60 bg-zinc-950/40 px-2 py-1"
                        >
                          <span className="w-5 shrink-0 text-center text-[10px] font-semibold text-zinc-600">
                            {row.n > 0 ? idx + 1 : "—"}
                          </span>
                          <Image
                            src={avatarUrl(row.slug)}
                            alt=""
                            width={26}
                            height={26}
                            className={`${clasesAvatarRecorte} h-[26px] w-[26px] shrink-0 bg-zinc-800 ring-1 ring-zinc-700`}
                            unoptimized
                          />
                          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-zinc-200">
                            {row.nombre}
                          </span>
                          <div className="w-[110px] shrink-0 sm:w-[130px]">
                            {row.n > 0 ? (
                              <BarraValor
                                etiqueta=""
                                valor={row.promedio}
                                maximo={100}
                                variante="linea"
                              />
                            ) : (
                              <span className="text-[10px] text-zinc-600">
                                Sin datos
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-sm font-semibold text-zinc-200">
                Promedios por persona evaluada
              </h2>
              <p className="text-[11px] text-zinc-500">
                Mayor → menor por rasgo · solo totales.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {MIEMBROS.map((ev) => {
                  const fila = promedios.get(ev.slug) ?? [];
                  const filaOrd = ordenarPromediosDesc(fila);
                  const etiquetas = new Map(
                    RASGOS.map((rr) => [rr.clave, rr.etiqueta]),
                  );
                  const tieneAlgúnVoto = fila.some((p) => p.n > 0);
                  return (
                    <article
                      key={ev.slug}
                      className="flex flex-col rounded-lg border border-zinc-800/90 bg-zinc-900/30 p-2.5 ring-1 ring-zinc-800/30"
                    >
                      <div className="flex items-center gap-2 border-b border-zinc-800/70 pb-2">
                        <Image
                          src={avatarUrl(ev.slug)}
                          alt=""
                          width={40}
                          height={40}
                          className={`${clasesAvatarRecorte} h-10 w-10 shrink-0 bg-zinc-800 ring-1 ring-zinc-700`}
                          unoptimized
                        />
                        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-50">
                          {ev.nombre}
                        </h3>
                      </div>
                      <div className="scrollbar-oculto mt-2 max-h-[220px] space-y-1 overflow-y-auto pr-0.5">
                        {filaOrd.map((p) => (
                          <BarraValor
                            key={p.clave}
                            etiqueta={etiquetas.get(p.clave) ?? p.clave}
                            valor={p.n > 0 ? p.promedio : 0}
                            maximo={100}
                            variante="bloque"
                          />
                        ))}
                      </div>
                      {!tieneAlgúnVoto ? (
                        <p className="mt-2 text-[11px] text-zinc-600">
                          Sin votos recibidos.
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
