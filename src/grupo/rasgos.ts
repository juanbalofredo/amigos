export type Rasgo = {
  clave: string;
  etiqueta: string;
};

export const RASGOS: Rasgo[] = [
  { clave: "gracia", etiqueta: "Gracia" },
  { clave: "fisico", etiqueta: "Físico" },
  { clave: "confiabilidad", etiqueta: "Confiabilidad (si dice que va y va)" },
  { clave: "enojo", etiqueta: "Enojo" },
  { clave: "iq", etiqueta: "IQ" },
  { clave: "ingenio", etiqueta: "Ingenio" },
  { clave: "malhumor", etiqueta: "Malhumor" },
  { clave: "carisma", etiqueta: "Carisma" },
  { clave: "pregunta", etiqueta: "Pregunta" },
  { clave: "lealtad", etiqueta: "Lealtad" },
  { clave: "familiero", etiqueta: "Familiero" },
  { clave: "vestimenta", etiqueta: "Vestimenta" },
  { clave: "estilo", etiqueta: "Estilo" },
  { clave: "gay", etiqueta: "Gay" },
  { clave: "borracho", etiqueta: "Borracho" },
  { clave: "chambeador", etiqueta: "Chambeador" },
  { clave: "steam", etiqueta: "Cuenta de Steam" },
  { clave: "aim_juegos", etiqueta: "Aim en juegos" },
  { clave: "iq_juegos", etiqueta: "IQ en juegos" },
  {
    clave: "pinta_traba",
    etiqueta: "El que más tiene pinta que se coje un traba",
  },
  { clave: "aura", etiqueta: "Aura" },
  { clave: "bandido", etiqueta: "Bandido" },
  { clave: "roba_mujer", etiqueta: "Te roba a tu mujer" },
  { clave: "termina_preso", etiqueta: "Termina preso" },
];

export const CLAVES_RASGOS = RASGOS.map((r) => r.clave);
