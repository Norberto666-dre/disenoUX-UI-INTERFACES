import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { SelectorCiclo } from "../components/SelectorCiclo";
import { kgCosechados } from "../lib/calc";
import { hoyIso, uid } from "../lib/format";
import {
  BarraGuardar,
  Boton,
  Campo,
  CampoNumero,
  SelectorBasico,
  SelectorFecha,
  TituloPantalla,
  SelectorSegmentado,
} from "../components/ui";

const CALIDADES = [
  { valor: "EXTRA", texto: "Extra" },
  { valor: "PRIMERA", texto: "Primera" },
  { valor: "SEGUNDA", texto: "Segunda" },
  { valor: "TERCERA", texto: "Tercera" },
  { valor: "INDUSTRIAL", texto: "Industrial" },
];

export default function FormCosecha() {
  const { db, sesion, actualizar, registrar, notificar } = useApp();
  const navegar = useNavigate();
  const [cicloId, setCicloId] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [cantidad, setCantidad] = useState("");
  const [unidadId, setUnidadId] = useState("un2");
  const [calidad, setCalidad] = useState("PRIMERA");
  const [observaciones, setObservaciones] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const ciclo = db.ciclos.find((c) => c.id === cicloId);
  const bloqueado = !ciclo || (ciclo.estado !== "ACTIVO" && ciclo.estado !== "SUSPENDIDO");
  const cantidadN = Number(cantidad.replace(/,/g, "")) || 0;
  const unidad = db.unidades.find((u) => u.id === unidadId);
  const kgNuevos = unidad && unidad.factorKg > 0 ? cantidadN * unidad.factorKg : 0;
  const kgPrevios = cicloId ? kgCosechados(db, cicloId) : 0;

  const guardar = () => {
    const e: Record<string, string> = {};
    if (!cicloId) e.cicloId = "Elige el ciclo.";
    else if (bloqueado) e.cicloId = "El ciclo no admite captura.";
    if (!fecha) e.fecha = "Captura la fecha.";
    else if (ciclo && fecha < ciclo.fechaInicio) e.fecha = "Anterior al inicio del ciclo.";
    if (!cantidadN || cantidadN <= 0) e.cantidad = "Debe ser mayor a 0.";
    if (!unidadId) e.unidadId = "Elige la unidad.";
    setErrores(e);
    if (Object.keys(e).length) return;

    setEnviando(true);
    const id = uid("co");
    actualizar((prev) => ({
      ...prev,
      cosechas: [
        ...prev.cosechas,
        {
          id,
          cicloId,
          fecha,
          cantidad: cantidadN,
          unidadId,
          calidad: calidad as never,
          observaciones: observaciones.trim() || null,
          creadoPorId: sesion?.usuarioId ?? "",
          creadoEn: new Date().toISOString().slice(0, 19),
          estado: "ACTIVA" as const,
        },
      ],
    }));
    registrar("CREAR", "Cosecha", id, null, `${Math.round(kgNuevos)} kg`);
    notificar(`Cosecha registrada. Total del ciclo: ${Math.round(kgPrevios + kgNuevos).toLocaleString("es-MX")} kg.`);
    window.setTimeout(() => navegar(cicloId ? `/ciclos/${cicloId}` : "/"), 500);
  };

  return (
    <div className="pb-56">
      <TituloPantalla titulo="Nueva cosecha" subtitulo="Registro de cortes" volver={() => navegar(-1)} />

      <div className="space-y-4">
        <SelectorCiclo valor={cicloId} onChange={setCicloId} error={errores.cicloId} admitidos={["ACTIVO", "SUSPENDIDO"]} />
        <SelectorFecha etiqueta="Fecha" valor={fecha} onChange={setFecha} obligatorio error={errores.fecha} min={ciclo?.fechaInicio} />

        <div className="grid grid-cols-2 gap-3">
          <CampoNumero etiqueta="Cantidad" valor={cantidad} onChange={setCantidad} obligatorio error={errores.cantidad} />
          <SelectorBasico
            etiqueta="Unidad"
            valor={unidadId}
            onChange={setUnidadId}
            obligatorio
            opciones={db.unidades
              .filter((u) => u.factorKg > 0)
              .map((u) => ({ valor: u.id, texto: u.nombre }))}
          />
        </div>

        {kgNuevos > 0 && (
          <div className="rounded-xl bg-campo-50 dark:bg-campo-900/40 px-3 py-2 text-sm font-semibold text-campo-900 dark:text-campo-200">
            🧺 = {kgNuevos.toLocaleString("es-MX")} kg
            {cicloId && (
              <span className="ml-1 font-normal text-campo-700 dark:text-campo-300">
                · el ciclo llevará {(kgPrevios + kgNuevos).toLocaleString("es-MX")} kg
              </span>
            )}
          </div>
        )}

        <SelectorSegmentado
          etiqueta="Calidad"
          valor={calidad}
          onChange={setCalidad}
          opciones={CALIDADES}
          obligatorio
        />

        <Campo etiqueta="Observaciones" valor={observaciones} onChange={setObservaciones} placeholder="Ej. Primer corte, buen tamaño" />
      </div>

      <BarraGuardar>
        <Boton onClick={guardar} disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar cosecha"}
        </Boton>
      </BarraGuardar>
    </div>
  );
}
