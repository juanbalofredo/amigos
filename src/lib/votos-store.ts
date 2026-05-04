import { promises as fs } from "fs";
import path from "path";

export type FilaVoto = {
  voter_slug: string;
  target_slug: string;
  scores: Record<string, number>;
  updated_at?: string;
};

const archivoVotos = path.join(process.cwd(), "data", "votes.json");

const ALMACEN_VOTOS_URL_POR_DEFECTO =
  "https://script.google.com/macros/s/AKfycbxV-0EjVMNU515JkOJCBVNgoEqW0r-VZy_eafvXuzXuKg7HTjnY8GOzFZt_ntCKsjR3YQ/exec";

function urlAlmacen() {
  let base = process.env.VOTACION_STORAGE_URL?.trim();
  if (!base && process.env.VERCEL === "1") {
    base = ALMACEN_VOTOS_URL_POR_DEFECTO;
  }
  if (!base) return "";
  const normalized = base.replace(/\/$/, "");
  const t = process.env.VOTACION_STORAGE_TOKEN?.trim();
  if (!t) return normalized;
  const url = new URL(normalized);
  url.searchParams.set("token", t);
  return url.toString();
}

function headersAlmacen(): Record<string, string> {
  return { Accept: "application/json" };
}

async function leerArchivo(): Promise<FilaVoto[]> {
  try {
    const raw = await fs.readFile(archivoVotos, "utf-8");
    const p = JSON.parse(raw) as FilaVoto[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

async function escribirArchivo(filas: FilaVoto[]) {
  await fs.mkdir(path.dirname(archivoVotos), { recursive: true });
  await fs.writeFile(archivoVotos, JSON.stringify(filas, null, 2), "utf-8");
}

async function leerHttp(): Promise<FilaVoto[]> {
  const base = urlAlmacen();
  const res = await fetch(base, {
    cache: "no-store",
    headers: headersAlmacen(),
  });
  if (!res.ok) throw new Error(`Almacén GET: ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    const err =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Respuesta inválida del almacén";
    throw new Error(err);
  }
  return data as FilaVoto[];
}

async function guardarHttp(fila: FilaVoto): Promise<void> {
  const base = urlAlmacen();
  const ts = new Date().toISOString();
  const body = JSON.stringify({
    ...fila,
    scores: { ...fila.scores },
    updated_at: ts,
  });
  const res = await fetch(base, {
    method: "POST",
    cache: "no-store",
    headers: {
      ...headersAlmacen(),
      "Content-Type": "application/json",
    },
    body,
  });
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok || j.error) {
    throw new Error(j.error || `Almacén POST: ${res.status}`);
  }
  if (!j.ok) throw new Error("Almacén POST: respuesta inesperada");
}

export async function listarVotos(): Promise<FilaVoto[]> {
  if (urlAlmacen()) return leerHttp();
  if (process.env.VERCEL === "1") {
    throw new Error(
      "Falta almacén: definí VOTACION_STORAGE_URL o desplegá con la URL por defecto en código.",
    );
  }
  return leerArchivo();
}

export async function listarObjetivosDeVotante(
  voter_slug: string,
): Promise<string[]> {
  const todas = await listarVotos();
  return todas.filter((f) => f.voter_slug === voter_slug).map((f) => f.target_slug);
}

export async function guardarVoto(fila: FilaVoto): Promise<void> {
  const ts = new Date().toISOString();
  if (urlAlmacen()) {
    await guardarHttp({ ...fila, scores: { ...fila.scores }, updated_at: ts });
    return;
  }
  if (process.env.VERCEL === "1") {
    throw new Error(
      "Falta almacén: definí VOTACION_STORAGE_URL o desplegá con la URL por defecto en código.",
    );
  }
  const filas = await leerArchivo();
  const i = filas.findIndex(
    (f) =>
      f.voter_slug === fila.voter_slug && f.target_slug === fila.target_slug,
  );
  const nueva: FilaVoto = {
    ...fila,
    scores: { ...fila.scores },
    updated_at: ts,
  };
  if (i >= 0) filas[i] = nueva;
  else filas.push(nueva);
  await escribirArchivo(filas);
}
