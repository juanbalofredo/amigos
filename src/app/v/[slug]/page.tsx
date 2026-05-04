import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MIEMBROS,
  avatarUrl,
  clasesAvatarRecorte,
  miembroPorCodigo,
  rutaVotoPorCodigo,
} from "@/grupo/miembros";
import { listarObjetivosDeVotante } from "@/lib/votos-store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: codigo } = await params;
  const yo = miembroPorCodigo(codigo);
  if (!yo) return { title: "Votación" };
  const img = avatarUrl(yo.slug);
  return {
    title: `${yo.nombre} · Votación`,
    description: `Calificaciones entre amigos · ${yo.nombre}`,
    openGraph: {
      title: `${yo.nombre} · Votación`,
      description: `Entrá a votar como ${yo.nombre}`,
      images: [{ url: img }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${yo.nombre} · Votación`,
      images: [img],
    },
  };
}

export default async function MesaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: codigo } = await params;
  const yo = miembroPorCodigo(codigo);
  if (!yo) notFound();
  const slug = yo.slug;
  let hechos: string[] = [];
  let aviso: string | null = null;
  try {
    hechos = await listarObjetivosDeVotante(slug);
  } catch (e) {
    aviso =
      e instanceof Error
        ? e.message
        : "No se pudieron cargar los votos guardados.";
  }
  const ya = new Set(hechos);
  const otros = MIEMBROS.filter((m) => m.slug !== slug);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <Image
          src={avatarUrl(slug)}
          alt=""
          width={96}
          height={96}
          className={`${clasesAvatarRecorte} h-24 w-24 shrink-0 rounded-full bg-zinc-800 ring-2 ring-zinc-700`}
          unoptimized
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-400">Entraste como</p>
          <h1 className="text-2xl font-semibold">{yo.nombre}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Tocá a alguien para calificarlo del 0 al 100 en cada rasgo. Los que
            ya guardaste quedan bloqueados.
          </p>
        </div>
      </div>
      {aviso ? (
        <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {aviso}
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {otros.map((m) => {
          const listo = ya.has(m.slug);
          const href = `${rutaVotoPorCodigo(yo.codigo)}/calificar/${m.codigo}`;
          if (listo) {
            return (
              <li
                key={m.slug}
                className="flex cursor-not-allowed items-center gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-4 opacity-50"
              >
                <Image
                  src={avatarUrl(m.slug)}
                  alt=""
                  width={64}
                  height={64}
                  className={`${clasesAvatarRecorte} h-16 w-16 shrink-0 rounded-full bg-zinc-800`}
                  unoptimized
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{m.nombre}</span>
                  <span className="text-xs text-zinc-500">Ya guardado</span>
                </div>
              </li>
            );
          }
          return (
            <li key={m.slug}>
              <Link
                href={href}
                className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4 transition hover:border-zinc-600"
              >
                <Image
                  src={avatarUrl(m.slug)}
                  alt=""
                  width={64}
                  height={64}
                  className={`${clasesAvatarRecorte} h-16 w-16 shrink-0 rounded-full bg-zinc-800`}
                  unoptimized
                />
                <span className="font-medium">{m.nombre}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
