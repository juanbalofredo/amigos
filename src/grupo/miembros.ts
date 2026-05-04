export type Miembro = {
  slug: string;
  nombre: string;
  codigo: string;
  fotoUrl?: string;
};

export const MIEMBROS: Miembro[] = [
  {
    slug: "juan",
    nombre: "Juan",
    codigo: "mK4xQ92nLw",
    fotoUrl: "/miembros/juan.png",
  },
  {
    slug: "pablo",
    nombre: "Pablo",
    codigo: "tR7vB81pYz",
    fotoUrl: "/miembros/pablo.png",
  },
  {
    slug: "cristian",
    nombre: "Cristian",
    codigo: "wN3cH65jGx",
    fotoUrl: "/miembros/cristian.png",
  },
  {
    slug: "matias",
    nombre: "Matías",
    codigo: "qF9dM38kRv",
    fotoUrl: "/miembros/matias.png",
  },
  {
    slug: "tobi",
    nombre: "Tobi",
    codigo: "zL2sP47nHy",
    fotoUrl: "/miembros/tobi.png",
  },
  {
    slug: "franquisia",
    nombre: "Franquisia",
    codigo: "bX8wK29tQj",
    fotoUrl: "/miembros/franquisia.png",
  },
  {
    slug: "maximil",
    nombre: "Maximil",
    codigo: "hC5nJ76vDm",
    fotoUrl: "/miembros/maximil.png",
  },
  {
    slug: "tepeto",
    nombre: "Tepeto",
    codigo: "nV8wQ41kRt",
    fotoUrl: "/miembros/tepeto.png",
  },
];

const porCodigo = new Map(MIEMBROS.map((m) => [m.codigo, m]));

export function miembroPorCodigo(codigo: string) {
  return porCodigo.get(codigo);
}

function dicebear(slug: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(slug)}`;
}

export function avatarUrl(slug: string) {
  const m = MIEMBROS.find((x) => x.slug === slug);
  if (m?.fotoUrl) return m.fotoUrl;
  return dicebear(slug);
}

export const clasesAvatarRecorte = "object-cover object-center";

export function rutaVotoPorCodigo(codigo: string) {
  return `/v/${codigo}`;
}
