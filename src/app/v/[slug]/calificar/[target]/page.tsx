import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { avatarUrl, miembroPorCodigo } from "@/grupo/miembros";
import { CalificarCliente } from "./CalificarCliente";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; target: string }>;
}): Promise<Metadata> {
  const { slug: codigoVotante, target: codigoEvaluado } = await params;
  const yo = miembroPorCodigo(codigoVotante);
  const otro = miembroPorCodigo(codigoEvaluado);
  if (!yo || !otro || yo.slug === otro.slug) return { title: "Calificar" };
  const img = avatarUrl(otro.slug);
  return {
    title: `Calificar a ${otro.nombre} · ${yo.nombre}`,
    description: `Barras 0–100 para ${otro.nombre}`,
    openGraph: {
      title: `Calificar a ${otro.nombre}`,
      images: [{ url: img }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Calificar a ${otro.nombre}`,
      images: [img],
    },
  };
}

export default async function CalificarPage({
  params,
}: {
  params: Promise<{ slug: string; target: string }>;
}) {
  const { slug: codigoVotante, target: codigoEvaluado } = await params;
  const yo = miembroPorCodigo(codigoVotante);
  const otro = miembroPorCodigo(codigoEvaluado);
  if (!yo || !otro || yo.slug === otro.slug) notFound();
  return (
    <CalificarCliente
      voterCodigo={yo.codigo}
      voterSlug={yo.slug}
      targetSlug={otro.slug}
      otroNombre={otro.nombre}
    />
  );
}
