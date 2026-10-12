import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { hoyIso, money } from "../lib/format";
import {
  Boton,
  EstadoVacio,
  HojaInferior,
  SelectorCatalogo,
  TituloPantalla,
} from "../components/ui";

export default function ListaGastos() {
  const { db, sesion } = useApp();
  const [cicloId, setCicloId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [filtros, setFiltros] = useState(false);

  const gastos = useMemo(() => {
    let lista = [...db.gastos].sort((a, b) => b.fecha.localeCompare(a.fecha));
    if (sesion?.rol === "CAPTURISTA") lista = lista.filter((g) => g.creadoPorId === sesion.usuarioId);
    if (cicloId) lista = lista.filter((g) => g.cicloId === cicloId);
    if (categoriaId) lista = lista.filter((g) => g.categoriaId === categoriaId);
    if (proveedorId) lista = lista.filter((g) => g.proveedorId === proveedorId);
    return lista;
  }, [db.gastos, cicloId, categoriaId, proveedorId, sesion]);

  const total = gastos.filter((g) => g.estado === "ACTIVO").reduce((s, g) => s + g.totalPagado, 0);
  const filtrosActivos = cicloId || categoriaId || proveedorId;

  return (
    <div>
      <TituloPantalla
        titulo="Gastos"
        subtitulo={sesion?.rol === "CAPTURISTA" ? "Solo tus registros" : "Todos los ciclos"}
        acciones={<span className="pt-2 text-sm font-bold text-stone-700 dark:text-stone-200">{money(total)}</span>}
      />

      <button
        onClick={() => setFiltros(true)}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-200 shadow-sm"
      >
        <span>🔍 Filtros {filtrosActivos ? "· activos" : ""}</span>
        <span className="text-stone-400 dark:text-stone-500">▾</span>
      </button>

      <HojaInferior abierto={filtros} onCerrar={() => setFiltros(false)} titulo="Filtrar gastos">
        <div className="space-y-4">
          <SelectorCatalogo
            etiqueta="Ciclo"
            valor={cicloId}
            onChange={setCicloId}
            opciones={db.ciclos.map((c) => {
              const p = db.parcelas.find((x) => x.id === c.parcelaId);
              return { id: c.id, etiquetaCompleta: `${p?.nombre} / ${c.nombre}` };
            })}
            placeholder="Todos"
          />
          <SelectorCatalogo
            etiqueta="Categoría"
            valor={categoriaId}
            onChange={setCategoriaId}
            opciones={db.categoriasGasto
              .filter((c) => c.parentId)
              .map((c) => ({
                id: c.id,
                etiquetaCompleta: `${db.categoriasGasto.find((p) => p.id === c.parentId)?.nombre} → ${c.nombre}`,
              }))}
            placeholder="Todas"
          />
          <SelectorCatalogo
            etiqueta="Proveedor"
            valor={proveedorId}
            onChange={setProveedorId}
            opciones={db.proveedores.map((p) => ({ id: p.id, etiquetaCompleta: p.nombre }))}
            placeholder="Todos"
          />
          <div className="flex gap-3">
            <Boton
              variante="secundario"
              className="flex-1"
              onClick={() => {
                setCicloId("");
                setCategoriaId("");
                setProveedorId("");
              }}
            >
              Limpiar
            </Boton>
            <Boton className="flex-1" onClick={() => setFiltros(false)}>
              Aplicar
            </Boton>
          </div>
        </div>
      </HojaInferior>

      {gastos.length === 0 ? (
        <EstadoVacio mensaje="No hay gastos con esos filtros." icono="🧾" />
      ) : (
        <ul className="space-y-2">
          {gastos.map((g) => {
            const cat = db.categoriasGasto.find((c) => c.id === g.categoriaId);
            const padre = cat?.parentId ? db.categoriasGasto.find((c) => c.id === cat.parentId) : null;
            const ciclo = db.ciclos.find((c) => c.id === g.cicloId);
            const parcela = db.parcelas.find((p) => p.id === ciclo?.parcelaId);
            return (
              <li
                key={g.id}
                className={`rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 shadow-sm ${g.estado === "ANULADO" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 dark:text-stone-100">
                      {padre ? `${padre.nombre} → ${cat?.nombre}` : cat?.nombre}
                    </p>
                    <p className="truncate text-sm text-stone-600 dark:text-stone-300">{g.descripcion}</p>
                    <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                      {g.fecha} · {parcela?.nombre} {ciclo?.nombre}
                      {g.comprobante ? ` · #${g.comprobante}` : ""}
                    </p>
                    {g.adjunto && <p className="mt-0.5 text-xs text-campo-700 dark:text-campo-300">🧾 Comprobante adjunto</p>}
                  </div>
                  <p className={`shrink-0 font-bold ${g.estado === "ANULADO" ? "text-stone-400 dark:text-stone-500 line-through" : "text-stone-900 dark:text-stone-100"}`}>
                    {money(g.totalPagado)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-center text-xs text-stone-400 dark:text-stone-500">
        Mostrando {gastos.length} de {db.gastos.length} · {hoyIso()}
      </p>
    </div>
  );
}
