import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import type { Severidad } from "../types";
import { exportarCSV } from "../lib/csv";
import { EstadoVacio, HojaInferior, TarjetaAlerta, TituloPantalla } from "../components/ui";

const SEVERIDADES: Severidad[] = ["ALTA", "MEDIA", "BAJA", "INFORMATIVA"];

export default function Alertas() {
  const { alertas: todas, marcarAlertasLeidas, puede, notificar } = useApp();
  const navegar = useNavigate();
  const [severidad, setSeveridad] = useState("");
  const [hoja, setHoja] = useState(false);

  // al abrir la pantalla las alertas dejan de contar como pendientes
  useEffect(() => {
    marcarAlertasLeidas();
  }, [marcarAlertasLeidas]);

  const filtradas = severidad ? todas.filter((a) => a.severidad === severidad) : todas;
  const porSeveridad = SEVERIDADES.map((s) => ({ s, n: todas.filter((a) => a.severidad === s).length }));

  const exportar = () => {
    exportarCSV(
      severidad ? `rentabilidad-alertas-${severidad.toLowerCase()}` : "rentabilidad-alertas",
      ["Severidad", "Tipo", "Mensaje"],
      filtradas.map((a) => [a.severidad, a.tipo, a.mensaje]),
    );
    notificar("Alertas exportadas en CSV.");
  };

  return (
    <div>
      <TituloPantalla titulo="Alertas" subtitulo="Señales que requieren tu atención" />

      <div className="mb-4 grid grid-cols-4 gap-2">
        {porSeveridad.map(({ s, n }) => (
          <button
            key={s}
            onClick={() => setSeveridad(severidad === s ? "" : s)}
            className={`rounded-xl border px-2 py-2 text-center transition ${
              severidad === s ? "border-campo-700 dark:border-campo-400 bg-campo-800 text-white" : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200"
            }`}
          >
            <span className="block text-lg font-bold">{n}</span>
            <span className="text-[10px] font-semibold uppercase">{s}</span>
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <EstadoVacio mensaje="No hay alertas. Todo en orden." icono="🌤" />
      ) : (
        <div className="space-y-2">
          {filtradas.map((a) => (
            <TarjetaAlerta
              key={a.id}
              severidad={a.severidad}
              titulo={a.tipo}
              mensaje={a.mensaje}
              onIr={() => navegar(a.enlace)}
            />
          ))}
        </div>
      )}

      <div className="mt-5 flex gap-2">
        {puede("reporte:exportar") && (
          <button
            onClick={exportar}
            className="flex-1 rounded-xl border border-campo-300 dark:border-campo-700 bg-campo-50 dark:bg-campo-900/50 px-4 py-2.5 text-sm font-semibold text-campo-800 dark:text-campo-200 shadow-sm hover:bg-campo-100 dark:hover:bg-campo-900"
          >
            ⬇ Exportar CSV
          </button>
        )}
        <button
          onClick={() => setHoja(true)}
          className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-200 shadow-sm"
        >
          ⓘ Sobre los umbrales
        </button>
      </div>
      <HojaInferior abierto={hoja} onCerrar={() => setHoja(false)} titulo="Umbrales de alertas">
        <p className="text-sm text-stone-700 dark:text-stone-200">
          Los umbrales actuales son valores iniciales del MVP (merma &gt; 10 %, categoría dominante
          &gt; 40 % del costo, costo creciente &gt; 15 %, etc.). En una iteración posterior serán
          configurables por empresa.
        </p>
      </HojaInferior>
    </div>
  );
}
