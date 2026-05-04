import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MIEMBROS, avatarUrl } from "@/grupo/miembros";
import { CalificarCliente } from "./CalificarCliente";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; target: string }>;
}): Promise<Metadata> {
  const { slug, target } = await params;
  const yo = MIEMBROS.find((m) => m.slug === slug);
  const otro = MIEMBROS.find((m) => m.slug === target);
  if (!yo || !otro || slug === target) return { title: "Calificar" };
  const img = avatarUrl(target);
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
  const { slug, target } = await params;
  const yo = MIEMBROS.find((m) => m.slug === slug);
  const otro = MIEMBROS.find((m) => m.slug === target);
  if (!yo || !otro || slug === target) notFound();
  return (
    <CalificarCliente
      voterSlug={slug}
      targetSlug={target}
      otroNombre={otro.nombre}
    />
  );
}
