import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { SelectorCiclo } from "../components/SelectorCiclo";
import { hoyIso, uid } from "../lib/format";
import {
  BarraGuardar,
  Boton,
  Campo,
  CampoNumero,
  CapturaComprobante,
  SelectorBasico,
  SelectorFecha,
  TituloPantalla,
} from "../components/ui";

export default function FormActividad() {
  const { actualizar, registrar, notificar, db, sesion } = useApp();
  const navegar = useNavigate();
  const [cicloId, setCicloId] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [descripcion, setDescripcion] = useState("");
  const [horas, setHoras] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [adjunto, setAdjunto] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const ciclo = db.ciclos.find((c) => c.id === cicloId);
  const bloqueado = !ciclo || (ciclo.estado !== "ACTIVO" && ciclo.estado !== "SUSPENDIDO");

  const guardar = () => {
    const e: Record<string, string> = {};
    if (!cicloId) e.cicloId = "Elige el ciclo.";
    else if (bloqueado) e.cicloId = "Este ciclo no admite captura.";
    if (!tipoId) e.tipoId = "Elige el tipo de actividad.";
    if (!fecha) e.fecha = "Captura la fecha.";
    setErrores(e);
    if (Object.keys(e).length) return;

    setEnviando(true);
    const id = uid("ac");
    actualizar((prev) => ({
      ...prev,
      actividades: [
        ...prev.actividades,
        {
          id,
          cicloId,
          tipoActividadId: tipoId,
          fecha,
          descripcion: descripcion.trim() || null,
          horas: horas ? Number(horas) : null,
          responsableId: responsableId || null,
          creadoPorId: sesion?.usuarioId ?? "",
          creadoEn: new Date().toISOString().slice(0, 19),
          estado: "ACTIVA" as const,
        },
      ],
    }));
    registrar("CREAR", "Actividad", id, null, db.tiposActividad.find((t) => t.id === tipoId)?.nombre);
    notificar("Actividad registrada.");
    window.setTimeout(() => navegar(cicloId ? `/ciclos/${cicloId}` : "/"), 400);
  };

  return (
    <div className="pb-56">
      <TituloPantalla titulo="Nueva actividad" subtitulo="Labores del campo" volver={() => navegar(-1)} />

      <div className="space-y-4">
        <SelectorCiclo valor={cicloId} onChange={setCicloId} error={errores.cicloId} />

        <div>
          <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-200">
            Tipo de actividad<span className="ml-0.5 text-red-600">*</span>
          </span>
          <div className="grid grid-cols-2 gap-2">
            {db.tiposActividad.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTipoId(t.id)}
                className={`flex min-h-14 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                  tipoId === t.id
                    ? "border-campo-700 dark:border-campo-400 bg-campo-800 text-white"
                    : "border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-campo-50 dark:hover:bg-campo-900/50"
                }`}
              >
                <span className="text-xl">{t.icono}</span>
                {t.nombre}
              </button>
            ))}
          </div>
          {errores.tipoId && <span className="mt-1 block text-sm text-red-600">{errores.tipoId}</span>}
        </div>

        <SelectorFecha etiqueta="Fecha" valor={fecha} onChange={setFecha} obligatorio error={errores.fecha} min={ciclo?.fechaInicio} />
        <Campo etiqueta="Descripción" valor={descripcion} onChange={setDescripcion} placeholder="Ej. Aplicación de Triple 17, 4 surcos" />
        <CampoNumero etiqueta="Horas trabajadas" valor={horas} onChange={setHoras} sufijo="h" />
        <SelectorBasico
          etiqueta="Responsable"
          valor={responsableId}
          onChange={setResponsableId}
          opciones={db.usuarios
            .filter((u) => u.activo)
            .map((u) => ({ valor: u.id, texto: `${u.nombre} ${u.apellido}` }))}
          placeholder="Elige un usuario"
        />
        <CapturaComprobante valor={adjunto} onChange={setAdjunto} />

        <div className="rounded-xl bg-stone-100 dark:bg-stone-800 px-3 py-2 text-xs text-stone-600 dark:text-stone-300">
          Esta actividad no tiene costo propio; su costo es la suma de los gastos que le vincules.
        </div>
      </div>

      <BarraGuardar>
        <Boton onClick={guardar} disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar actividad"}
        </Boton>
      </BarraGuardar>
    </div>
  );
}
