export type Miembro = {
  slug: string;
  nombre: string;
  fotoUrl?: string;
};

export const MIEMBROS: Miembro[] = [
  { slug: "juan", nombre: "Juan" },
  { slug: "pablo", nombre: "Pablo" },
  { slug: "cristian", nombre: "Cristian" },
  { slug: "matias", nombre: "Matías" },
  { slug: "tobi", nombre: "Tobi" },
  { slug: "franquisia", nombre: "Franquisia" },
  { slug: "maximil", nombre: "Maximil" },
];

function dicebear(slug: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(slug)}`;
}

export function avatarUrl(slug: string) {
  const m = MIEMBROS.find((x) => x.slug === slug);
  if (m?.fotoUrl) return m.fotoUrl;
  return dicebear(slug);
}

export function rutaVoto(slug: string) {
  return `/v/${slug}`;
}
