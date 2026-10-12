import { useApp } from "../context/AppContext";
import { nombreCultivo } from "../lib/calc";
import type { EstadoCiclo } from "../types";
import { SelectorCatalogo } from "./ui";

export function SelectorCiclo({
  valor,
  onChange,
  error,
  admitidos = ["ACTIVO", "SUSPENDIDO", "PLANIFICADO"],
  etiqueta = "Ciclo",
  soloActivos = false,
}: {
  valor: string;
  onChange: (v: string) => void;
  error?: string;
  admitidos?: EstadoCiclo[];
  etiqueta?: string;
  soloActivos?: boolean;
}) {
  const { db, empresaVencida } = useApp();
  const opciones = db.ciclos
    .filter((c) => admitidos.includes(c.estado) && !empresaVencida)
    .map((c) => {
      const p = db.parcelas.find((x) => x.id === c.parcelaId);
      const v = db.variedades.find((x) => x.id === c.variedadId);
      return {
        id: c.id,
        etiquetaCompleta: `${p?.nombre ?? ""} / ${c.nombre} (${nombreCultivo(db, c.variedadId)} ${v?.nombre ?? ""}) — ${c.estado.toLowerCase()}`,
      };
    });

  return (
    <SelectorCatalogo
      etiqueta={etiqueta}
      valor={valor}
      onChange={onChange}
      opciones={opciones}
      obligatorio
      error={error}
      placeholder={soloActivos ? "Elige un ciclo activo" : "Elige el ciclo"}
    />
  );
}
