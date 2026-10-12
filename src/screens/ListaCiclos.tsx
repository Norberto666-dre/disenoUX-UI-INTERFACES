import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { etiquetaEstadoCiclo, indicadoresCiclo, kgCosechados, nombreCultivo } from "../lib/calc";
import { fecha, hoyIso, money } from "../lib/format";
import { Boton, EstadoVacio, HojaInferior, InsigniaEstado, TituloPantalla } from "../components/ui";

const ESTADOS = ["ACTIVO", "PLANIFICADO", "SUSPENDIDO", "FINALIZADO", "CANCELADO"];

export default function ListaCiclos() {
  const { db, puede } = useApp();
  const navegar = useNavigate();
  const [estado, setEstado] = useState("");
  const [parcelaId, setParcelaId] = useState("");
  const [filtros, setFiltros] = useState(false);

  const ciclos = useMemo(() => {
    return db.ciclos
      .filter((c) => (!estado || c.estado === estado) && (!parcelaId || c.parcelaId === parcelaId))
      .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));
  }, [db.ciclos, estado, parcelaId]);

  const nombreParcela = (id: string) => db.parcelas.find((p) => p.id === id)?.nombre ?? "—";

  return (
    <div>
      <TituloPantalla
        titulo="Ciclos de producción"
        subtitulo="La temporada de cada parcela"
        acciones={
          puede("ciclo:crear") ? (
            <Boton onClick={() => navegar("/ciclos/nuevo")}>+ Nuevo</Boton>
          ) : undefined
        }
      />

      <button
        onClick={() => setFiltros(true)}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-200 shadow-sm"
      >
        <span>
          🔍 Filtros
          {estado && ` · ${etiquetaEstadoCiclo(estado as never)}`}
          {parcelaId && ` · ${nombreParcela(parcelaId)}`}
        </span>
        <span className="text-stone-400 dark:text-stone-500">▾</span>
      </button>

      <HojaInferior abierto={filtros} onCerrar={() => setFiltros(false)} titulo="Filtrar ciclos">
        <p className="mb-1 text-sm font-semibold text-stone-700 dark:text-stone-200">Estado</p>
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip activo={!estado} onClick={() => setEstado("")} texto="Todos" />
          {ESTADOS.map((e) => (
            <Chip
              key={e}
              activo={estado === e}
              onClick={() => setEstado(estado === e ? "" : e)}
              texto={etiquetaEstadoCiclo(e as never)}
            />
          ))}
        </div>
        <p className="mb-1 text-sm font-semibold text-stone-700 dark:text-stone-200">Parcela</p>
        <div className="flex flex-wrap gap-2">
          <Chip activo={!parcelaId} onClick={() => setParcelaId("")} texto="Todas" />
          {db.parcelas.map((p) => (
            <Chip
              key={p.id}
              activo={parcelaId === p.id}
              onClick={() => setParcelaId(parcelaId === p.id ? "" : p.id)}
              texto={p.nombre}
            />
          ))}
        </div>
        <Boton className="mt-5 w-full" onClick={() => setFiltros(false)}>
          Aplicar
        </Boton>
      </HojaInferior>

      {ciclos.length === 0 ? (
        <EstadoVacio
          mensaje="No hay ciclos con esos filtros."
          accionTexto={puede("ciclo:crear") ? "Crear ciclo" : undefined}
          onAccion={puede("ciclo:crear") ? () => navegar("/ciclos/nuevo") : undefined}
        />
      ) : (
        <ul className="space-y-2">
          {ciclos.map((c) => {
            const v = db.variedades.find((x) => x.id === c.variedadId);
            const ind = indicadoresCiclo(db, c.id);
            const mostrarDinero = c.estado !== "PLANIFICADO";
            return (
              <li key={c.id}>
                <button
                  onClick={() => navegar(`/ciclos/${c.id}`)}
                  className="w-full rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 text-left shadow-sm hover:bg-campo-50 dark:hover:bg-campo-900/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-stone-900 dark:text-stone-100">{c.nombre}</p>
                      <p className="text-sm text-stone-600 dark:text-stone-300">
                        {nombreParcela(c.parcelaId)} · {nombreCultivo(db, c.variedadId)} {v?.nombre}
                      </p>
                    </div>
                    <InsigniaEstado texto={etiquetaEstadoCiclo(c.estado)} />
                  </div>
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                    {fecha(c.fechaInicio)} → {c.fechaFin ? fecha(c.fechaFin) : "sin cerrar"} ·{" "}
                    {c.superficieSembradaHa} ha
                  </p>
                  {mostrarDinero && (
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className={ind.ganancia < 0 ? "font-bold text-red-600" : "font-bold text-campo-800 dark:text-campo-200"}>
                        {money(ind.ganancia)}
                      </span>
                      <span className="text-stone-500 dark:text-stone-400">
                        {Math.round(kgCosechados(db, c.id)).toLocaleString("es-MX")} kg cosechados
                      </span>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-center text-xs text-stone-400 dark:text-stone-500">
        Hoy: {fecha(hoyIso())}
      </p>
    </div>
  );
}

function Chip({ texto, activo, onClick }: { texto: string; activo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
        activo
          ? "border-campo-700 dark:border-campo-400 bg-campo-800 text-white"
          : "border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200"
      }`}
    >
      {texto}
    </button>
  );
}
