import { NextResponse } from "next/server";
import { MIEMBROS } from "@/grupo/miembros";
import { CLAVES_RASGOS } from "@/grupo/rasgos";
import { guardarVoto, listarVotos } from "@/lib/votos-store";

const slugs = new Set(MIEMBROS.map((m) => m.slug));

export async function GET() {
  try {
    const filas = await listarVotos();
    return NextResponse.json(filas);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      voter_slug?: string;
      target_slug?: string;
      scores?: Record<string, number>;
    };
    const voter = body.voter_slug;
    const target = body.target_slug;
    const scores = body.scores;
    if (!voter || !target || !scores || typeof scores !== "object") {
      return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
    }
    if (!slugs.has(voter) || !slugs.has(target)) {
      return NextResponse.json({ error: "Persona inválida" }, { status: 400 });
    }
    if (voter === target) {
      return NextResponse.json({ error: "No podés votarte" }, { status: 400 });
    }
    for (const clave of CLAVES_RASGOS) {
      const v = scores[clave];
      if (typeof v !== "number" || Number.isNaN(v) || v < 0 || v > 100) {
        return NextResponse.json(
          { error: `Valor inválido: ${clave}` },
          { status: 400 },
        );
      }
    }
    await guardarVoto({ voter_slug: voter, target_slug: target, scores });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
