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

const ordenRasgo = new Map(RASGOS.map((r, i) => [r.clave, i]));

function rasgoEtiqueta(clave: string) {
  return RASGOS.find((r) => r.clave === clave)?.etiqueta ?? clave;
}

function statNumeroUno(fila: FilaProm[]): {
  valor: number;
  etiqueta: string;
} | null {
  const con = fila.filter((x) => x.n > 0);
  if (!con.length) return null;
  let best = con[0];
  for (const x of con) {
    if (x.promedio > best.promedio) best = x;
    else if (x.promedio === best.promedio) {
      const ox = ordenRasgo.get(x.clave) ?? 999;
      const ob = ordenRasgo.get(best.clave) ?? 999;
      if (ox < ob) best = x;
    }
  }
  return { valor: best.promedio, etiqueta: rasgoEtiqueta(best.clave) };
}

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

  const resumen = useMemo(() => {
    if (!filas?.length) {
      return { envios: 0, evaluadosActivos: 0 };
    }
    const targets = new Set(filas.map((f) => f.target_slug));
    return {
      envios: filas.length,
      evaluadosActivos: targets.size,
    };
  }, [filas]);

  const asignacionVotantes = useMemo(() => {
    const targetsPorVotante = new Map<string, Set<string>>();
    const meta = Math.max(0, MIEMBROS.length - 1);
    if (!filas?.length) {
      return { targetsPorVotante, meta, listo: [] as typeof MIEMBROS, falta: [...MIEMBROS] };
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
    return { targetsPorVotante, meta, listo, falta };
  }, [filas]);

  const ranking = useMemo(() => {
    return MIEMBROS.map((m) => {
      const fila = promedios.get(m.slug) ?? [];
      const top = statNumeroUno(fila);
      const votos = porEvaluado.get(m.slug)?.length ?? 0;
      return { ...m, top, votos };
    }).sort((a, b) => {
      if (!a.top && !b.top) return 0;
      if (!a.top) return 1;
      if (!b.top) return -1;
      return b.top.valor - a.top.valor;
    });
  }, [promedios, porEvaluado]);

  const filaDetalle = useMemo(() => {
    if (!detalle || !filas) return null;
    return filas.find(
      (f) =>
        f.voter_slug === detalle.voter && f.target_slug === detalle.target,
    );
  }, [detalle, filas]);

  const filasDetalleOrdenadas = useMemo(() => {
    if (!filaDetalle) return [];
    return RASGOS.map((r) => {
      const v = filaDetalle.scores[r.clave];
      const valor = typeof v === "number" && !Number.isNaN(v) ? v : 0;
      return { clave: r.clave, etiqueta: r.etiqueta, valor };
    }).sort((a, b) => b.valor - a.valor);
  }, [filaDetalle]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 pb-10">
      <div className="mx-auto max-w-5xl px-3 py-6 sm:px-5">
        <header className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 shadow-lg shadow-black/30">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
                Resultados
              </h1>
              <p className="mt-0.5 text-xs text-zinc-500">
                Sheet vía API · ranking = rasgo con promedio más alto
              </p>
            </div>
            <button
              type="button"
              onClick={() => void cargar()}
              className="shrink-0 rounded-lg border border-zinc-600 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:border-amber-600/40"
            >
              Recargar
            </button>
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
            <div className="grid grid-cols-2 gap-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-800/80" />
              ))}
            </div>
            <div className="h-20 animate-pulse rounded-lg bg-zinc-800/60" />
          </div>
        ) : (
          <>
            <section className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-zinc-800/90 bg-zinc-900/50 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  Votos
                </p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-50">
                  {resumen.envios}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800/90 bg-zinc-900/50 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  Con datos
                </p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-50">
                  {resumen.evaluadosActivos}
                  <span className="text-sm font-normal text-zinc-600">
                    /{MIEMBROS.length}
                  </span>
                </p>
              </div>
            </section>
            <section className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/20 p-3 ring-1 ring-emerald-900/20">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90">
                  Ya completaron sus votos
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-zinc-500">
                  {asignacionVotantes.listo.length}/{MIEMBROS.length} · a todos los
                  demás
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
                <p className="mt-0.5 text-xs text-zinc-500">
                  Falta calificar a alguien ({asignacionVotantes.meta} por
                  persona)
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {asignacionVotantes.falta.length === 0 ? (
                    <span className="text-[11px] text-emerald-400/90">
                      Todos listos.
                    </span>
                  ) : (
                    asignacionVotantes.falta.map((m) => {
                      const hechos =
                        asignacionVotantes.targetsPorVotante.get(m.slug)?.size ??
                        0;
                      return (
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
                          <span className="text-[10px] tabular-nums text-zinc-500">
                            {hechos}/{asignacionVotantes.meta}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6">
              <h2 className="text-sm font-semibold text-zinc-200">Ranking</h2>
              <p className="text-[11px] text-zinc-500">
                Orden por el promedio más alto en un solo rasgo (#1).
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {ranking.map((row) => (
                  <li
                    key={row.slug}
                    className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/35 px-2 py-1.5"
                  >
                    <Image
                      src={avatarUrl(row.slug)}
                      alt=""
                      width={32}
                      height={32}
                      className={`${clasesAvatarRecorte} h-8 w-8 shrink-0 bg-zinc-800 ring-1 ring-zinc-700`}
                      unoptimized
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {row.nombre}
                      </p>
                    </div>
                    {row.top ? (
                      <div className="flex min-w-0 max-w-[55%] flex-col items-end gap-0.5 text-right sm:max-w-[50%]">
                        <p className="text-xs font-semibold leading-tight text-amber-200">
                          <span className="tabular-nums text-amber-300">
                            {Number.isInteger(row.top.valor)
                              ? row.top.valor
                              : row.top.valor.toFixed(1)}
                          </span>
                          <span className="font-normal text-zinc-500"> · </span>
                          <span className="font-normal text-zinc-400">
                            {row.top.etiqueta}
                          </span>
                        </p>
                        <div className="h-1 w-full max-w-[140px] overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-700 to-amber-400"
                            style={{
                              width: `${Math.min(100, Math.max(0, row.top.valor))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-600">Sin datos</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-6">
              <h2 className="text-sm font-semibold text-zinc-200">
                Promedios por persona
              </h2>
              <p className="text-[11px] text-zinc-500">
                Mayor → menor. Un voto total abajo por tarjeta.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {MIEMBROS.map((ev) => {
                  const lista = porEvaluado.get(ev.slug) ?? [];
                  const fila = promedios.get(ev.slug) ?? [];
                  const filaOrd = ordenarPromediosDesc(fila);
                  const etiquetas = new Map(
                    RASGOS.map((r) => [r.clave, r.etiqueta]),
                  );
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
                      {lista.length > 0 ? (
                        <div className="mt-2 border-t border-zinc-800/70 pt-2">
                          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                            {lista.length} voto{lista.length === 1 ? "" : "s"} ·
                            Votaron
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {lista.map((f) => (
                              <button
                                key={f.voter_slug}
                                type="button"
                                onClick={() =>
                                  setDetalle({
                                    voter: f.voter_slug,
                                    target: f.target_slug,
                                  })
                                }
                                className="flex items-center gap-1 rounded-md border border-zinc-700/80 bg-zinc-950/80 py-0.5 pl-0.5 pr-2 text-[11px] font-medium text-zinc-300 hover:border-amber-600/50"
                              >
                                <Image
                                  src={avatarUrl(f.voter_slug)}
                                  alt=""
                                  width={22}
                                  height={22}
                                  className={`${clasesAvatarRecorte} h-[22px] w-[22px] shrink-0 bg-zinc-800`}
                                  unoptimized
                                />
                                {nombre(f.voter_slug)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] text-zinc-600">
                          Sin votos.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>

      {detalle && filaDetalle ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center"
          role="presentation"
          onClick={() => setDetalle(null)}
        >
          <div
            role="dialog"
            className="scrollbar-oculto max-h-[88vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-700/90 bg-zinc-950 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-1.5">
                <Image
                  src={avatarUrl(detalle.voter)}
                  alt=""
                  width={40}
                  height={40}
                  className={`${clasesAvatarRecorte} h-10 w-10 bg-zinc-800 ring-1 ring-amber-700/35`}
                  unoptimized
                />
                <span className="text-zinc-600">→</span>
                <Image
                  src={avatarUrl(detalle.target)}
                  alt=""
                  width={40}
                  height={40}
                  className={`${clasesAvatarRecorte} h-10 w-10 bg-zinc-800 ring-1 ring-zinc-600`}
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  Voto · mayor → menor
                </p>
                <h3 className="text-sm font-semibold text-zinc-50">
                  {nombre(detalle.voter)} → {nombre(detalle.target)}
                </h3>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {filasDetalleOrdenadas.map((row) => (
                <BarraValor
                  key={row.clave}
                  etiqueta={row.etiqueta}
                  valor={row.valor}
                  maximo={100}
                  variante="bloque"
                />
              ))}
            </div>
            <button
              type="button"
              className="mt-5 w-full rounded-lg bg-zinc-800 py-2 text-xs font-medium text-zinc-100 ring-1 ring-zinc-600 hover:bg-zinc-700"
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
