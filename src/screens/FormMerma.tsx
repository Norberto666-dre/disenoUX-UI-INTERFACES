import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { SelectorCiclo } from "../components/SelectorCiclo";
import { kgCosechados, kgMerma } from "../lib/calc";
import { hoyIso, uid } from "../lib/format";
import {
  BarraGuardar,
  Boton,
  Campo,
  CampoNumero,
  SelectorBasico,
  SelectorCatalogo,
  SelectorFecha,
  SelectorSegmentado,
  TituloPantalla,
} from "../components/ui";

const ETAPAS = [
  { valor: "CAMPO", texto: "Campo" },
  { valor: "POSCOSECHA", texto: "Poscosecha" },
  { valor: "TRANSPORTE", texto: "Transporte" },
  { valor: "ALMACEN", texto: "Almacén" },
];

const NOTAS: Record<string, string> = {
  CAMPO: "Pérdida antes del corte. Se reporta aparte y no resta de lo cosechado.",
  POSCOSECHA: "Resta de los kg disponibles para vender.",
  TRANSPORTE: "Resta de los kg disponibles para vender.",
  ALMACEN: "Resta de los kg disponibles para vender.",
};

export default function FormMerma() {
  const { db, sesion, actualizar, registrar, notificar } = useApp();
  const navegar = useNavigate();
  const [cicloId, setCicloId] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [motivoId, setMotivoId] = useState("");
  const [etapa, setEtapa] = useState("POSCOSECHA");
  const [cantidad, setCantidad] = useState("");
  const [unidadId, setUnidadId] = useState("un1");
  const [cosechaOrigenId, setCosechaOrigenId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const ciclo = db.ciclos.find((c) => c.id === cicloId);
  const bloqueado = !ciclo || (ciclo.estado !== "ACTIVO" && ciclo.estado !== "SUSPENDIDO");
  const cantidadN = Number(cantidad.replace(/,/g, "")) || 0;
  const unidad = db.unidades.find((u) => u.id === unidadId);
  const kgNuevos = unidad && unidad.factorKg > 0 ? cantidadN * unidad.factorKg : 0;

  const cosechas = db.cosechas
    .filter((c) => c.cicloId === cicloId && c.estado === "ACTIVA")
    .map((c) => {
      const u = db.unidades.find((x) => x.id === c.unidadId);
      return {
        id: c.id,
        etiquetaCompleta: `Corte ${c.fecha} — ${c.cantidad} ${u?.abrev ?? ""} (${c.calidad})`,
      };
    });

  const kgCosechadosCiclo = cicloId ? kgCosechados(db, cicloId) : 0;
  const kgMermaPosActual = cicloId ? kgMerma(db, cicloId, true) : 0;
  const excedeRn032 =
    etapa !== "CAMPO" && kgMermaPosActual + kgNuevos > kgCosechadosCiclo && kgCosechadosCiclo > 0;

  const guardar = () => {
    const e: Record<string, string> = {};
    if (!cicloId) e.cicloId = "Elige el ciclo.";
    else if (bloqueado) e.cicloId = "El ciclo no admite captura.";
    if (!fecha) e.fecha = "Captura la fecha.";
    if (!motivoId) e.motivoId = "Elige el motivo.";
    if (!etapa) e.etapa = "Elige la etapa.";
    if (!cantidadN || cantidadN <= 0) e.cantidad = "Debe ser mayor a 0.";
    if (excedeRn032) e.cantidad = "La suma de merma poscosecha excede lo cosechado (RN-032).";
    setErrores(e);
    if (Object.keys(e).length) return;

    setEnviando(true);
    const id = uid("me");
    actualizar((prev) => ({
      ...prev,
      mermas: [
        ...prev.mermas,
        {
          id,
          cicloId,
          fecha,
          motivoId,
          etapa: etapa as never,
          cantidad: cantidadN,
          unidadId,
          cosechaOrigenId: cosechaOrigenId || null,
          observaciones: observaciones.trim() || null,
          creadoPorId: sesion?.usuarioId ?? "",
          creadoEn: new Date().toISOString().slice(0, 19),
          estado: "ACTIVA" as const,
        },
      ],
    }));
    registrar("CREAR", "Merma", id, null, `${Math.round(kgNuevos)} kg`);
    notificar("Merma registrada.");
    window.setTimeout(() => navegar(cicloId ? `/ciclos/${cicloId}` : "/"), 400);
  };

  return (
    <div className="pb-56">
      <TituloPantalla titulo="Nueva merma" subtitulo="Pérdidas del ciclo" volver={() => navegar(-1)} />

      <div className="space-y-4">
        <SelectorCiclo valor={cicloId} onChange={setCicloId} error={errores.cicloId} admitidos={["ACTIVO", "SUSPENDIDO"]} />
        <SelectorFecha etiqueta="Fecha" valor={fecha} onChange={setFecha} obligatorio error={errores.fecha} min={ciclo?.fechaInicio} />

        <SelectorCatalogo
          etiqueta="Motivo"
          valor={motivoId}
          onChange={setMotivoId}
          opciones={db.motivosMerma.map((m) => ({ id: m.id, nombre: m.nombre }))}
          obligatorio
          error={errores.motivoId}
        />

        <div>
          <SelectorSegmentado etiqueta="Etapa" valor={etapa} onChange={setEtapa} opciones={ETAPAS} obligatorio />
          <p
            className={`mt-2 rounded-xl px-3 py-2 text-xs font-medium ${
              etapa === "CAMPO" ? "bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200" : "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
            }`}
          >
            {NOTAS[etapa]}
          </p>
        </div>

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
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            = {kgNuevos.toLocaleString("es-MX")} kg{" "}
            {etapa !== "CAMPO" && (
              <span className="font-normal text-stone-500 dark:text-stone-400">
                · disponibles: {Math.max(kgCosechadosCiclo - kgMermaPosActual - kgNuevos, 0).toLocaleString("es-MX")} kg
              </span>
            )}
          </p>
        )}

        {cosechas.length > 0 && (
          <SelectorCatalogo
            etiqueta="Cosecha de origen (opcional)"
            valor={cosechaOrigenId}
            onChange={setCosechaOrigenId}
            opciones={cosechas}
            placeholder="Sin origen específico"
          />
        )}

        <Campo etiqueta="Observaciones" valor={observaciones} onChange={setObservaciones} />
      </div>

      <BarraGuardar>
        <Boton onClick={guardar} disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar merma"}
        </Boton>
      </BarraGuardar>
    </div>
  );
}
