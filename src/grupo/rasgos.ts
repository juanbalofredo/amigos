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
];

export const CLAVES_RASGOS = RASGOS.map((r) => r.clave);
