import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { cicloAdmiteCaptura, nombreCultivo } from "../lib/calc";
import { hoyIso, uid } from "../lib/format";
import {
  BarraGuardar,
  Boton,
  Campo,
  CampoNumero,
  EstadoVacio,
  SelectorCatalogo,
  SelectorFecha,
  TituloPantalla,
} from "../components/ui";

export default function FormCiclo() {
  const { db, sesion, actualizar, registrar, notificar } = useApp();
  const navegar = useNavigate();

  const [parcelaId, setParcelaId] = useState("");
  const [variedadId, setVariedadId] = useState("");
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState(hoyIso());
  const [superficie, setSuperficie] = useState("");
  const [metaKg, setMetaKg] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const parcelasDisponibles = useMemo(
    () =>
      db.parcelas
        .filter((p) => p.activo && p.estado !== "INACTIVA")
        .map((p) => {
          const predio = db.predios.find((x) => x.id === p.predioId);
          const cicloActivo = db.ciclos.find((c) => c.parcelaId === p.id && c.estado === "ACTIVO");
          return {
            id: p.id,
            etiquetaCompleta: `${predio?.nombre ?? ""} / ${p.nombre}${cicloActivo ? ` (ocupada por ${cicloActivo.nombre})` : ""}`,
            ocupada: !!cicloActivo,
          };
        }),
    [db.ciclos, db.parcelas, db.predios],
  );

  const variedades = db.variedades.map((v) => ({
    id: v.id,
    etiquetaCompleta: `${nombreCultivo(db, v.id)} / ${v.nombre}`,
  }));

  const plan = db.planes.find((p) => p.id === db.empresa.planId);
  const parcelasActivas = db.parcelas.filter((p) => p.activo).length;
  const enLimite = plan ? parcelasActivas >= plan.maxParcelas : false;

  const superficieParcela = db.parcelas.find((p) => p.id === parcelaId)?.superficieHa ?? null;

  const validar = () => {
    const e: Record<string, string> = {};
    if (!parcelaId) e.parcelaId = "Elige una parcela.";
    if (!variedadId) e.variedadId = "Elige la variedad.";
    if (!fechaInicio) e.fechaInicio = "Captura la fecha de inicio.";
    const sup = Number(superficie);
    if (!superficie || Number.isNaN(sup) || sup <= 0) e.superficie = "Debe ser mayor a 0.";
    else if (superficieParcela && sup > superficieParcela)
      e.superficie = `No puede exceder la superficie de la parcela (${superficieParcela} ha).`;
    const elegida = parcelasDisponibles.find((p) => p.id === parcelaId);
    if (elegida?.ocupada) e.parcelaId = "La parcela ya tiene un ciclo activo.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = () => {
    if (enLimite) {
      notificar(`Tu plan ${plan?.nombre} ya alcanzó el máximo de parcelas.`, "error");
      return;
    }
    if (!validar()) return;
    setEnviando(true);
    const id = uid("c");
    actualizar((prev) => ({
      ...prev,
      ciclos: [
        ...prev.ciclos,
        {
          id,
          empresaId: db.empresa.id,
          parcelaId,
          variedadId,
          nombre: nombre.trim() || `${nombreCultivo(db, variedadId)} ${fechaInicio.slice(0, 4)}`,
          fechaInicio,
          fechaFin: null,
          superficieSembradaHa: Number(superficie),
          metaKg: metaKg ? Number(metaKg) : null,
          observaciones: observaciones.trim() || null,
          estado: "PLANIFICADO",
          cerradoEn: null,
          cerradoPorId: null,
          creadoEn: new Date().toISOString().slice(0, 19),
        },
      ],
      parcelas: prev.parcelas.map((p) => (p.id === parcelaId ? { ...p, estado: "EN_USO" as const } : p)),
    }));
    registrar("CREAR", "Ciclo", id, null, nombre || "Nuevo ciclo");
    notificar("Cilo creado como planificado.");
    window.setTimeout(() => navegar(`/ciclos/${id}`), 400);
  };

  return (
    <div className="pb-56">
      <TituloPantalla titulo="Nuevo ciclo" subtitulo="Temporada de una parcela" volver={() => navegar(-1)} />

      {enLimite && (
        <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm font-medium text-amber-900 dark:text-amber-200">
          ⚠ Límite del plan alcanzado: {parcelasActivas}/{plan?.maxParcelas} parcelas en uso. Cambia de
          plan para crear más.
        </div>
      )}

      <div className="space-y-4">
        <SelectorCatalogo
          etiqueta="Parcela"
          valor={parcelaId}
          onChange={setParcelaId}
          opciones={parcelasDisponibles}
          obligatorio
          error={errores.parcelaId}
        />
        <SelectorCatalogo
          etiqueta="Variedad (cultivo y variedad)"
          valor={variedadId}
          onChange={setVariedadId}
          opciones={variedades}
          obligatorio
          error={errores.variedadId}
        />
        <Campo etiqueta="Nombre del ciclo" valor={nombre} onChange={setNombre} placeholder="Ej. Primavera 2027" />
        <SelectorFecha
          etiqueta="Fecha de inicio"
          valor={fechaInicio}
          onChange={setFechaInicio}
          obligatorio
          error={errores.fechaInicio}
        />
        <CampoNumero
          etiqueta="Superficie sembrada"
          valor={superficie}
          onChange={setSuperficie}
          sufijo="ha"
          obligatorio
          error={errores.superficie}
        />
        {superficieParcela != null && (
          <p className="text-xs text-stone-500 dark:text-stone-400">La parcela mide {superficieParcela} ha.</p>
        )}
        <CampoNumero etiqueta="Meta de producción" valor={metaKg} onChange={setMetaKg} sufijo="kg" />
        <Campo etiqueta="Observaciones" valor={observaciones} onChange={setObservaciones} />
        <p className="rounded-xl bg-campo-50 dark:bg-campo-900/40 px-3 py-2 text-xs text-campo-900 dark:text-campo-200">
          El ciclo se crea como <b>Planificado</b>. Actívalo desde su detalle para poder capturar
          gastos, actividades y cosechas.
        </p>
      </div>

      <BarraGuardar>
        <Boton onClick={guardar} disabled={enviando || enLimite}>
          {enviando ? "Guardando…" : "Crear ciclo"}
        </Boton>
      </BarraGuardar>

      {!sesion && <EstadoVacio mensaje="Sesión requerida." />}
    </div>
  );
}

/* re-export helpers used by other screens */
export { cicloAdmiteCaptura };
