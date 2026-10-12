import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  estadoCobroVenta,
  etiquetaEstadoCobro,
  saldoVenta,
} from "../lib/calc";
import { money } from "../lib/format";
import {
  Boton,
  EstadoVacio,
  HojaInferior,
  InsigniaEstado,
  SelectorCatalogo,
  TituloPantalla,
} from "../components/ui";

export default function ListaVentas() {
  const { db, puede } = useApp();
  const navegar = useNavigate();
  const [cicloId, setCicloId] = useState("");
  const [estadoSel, setEstadoSel] = useState("");
  const [filtros, setFiltros] = useState(false);

  const ventas = db.ventas
    .filter((v) => (!cicloId || v.cicloId === cicloId))
    .filter((v) => (!estadoSel || estadoCobroVenta(db, v) === estadoSel))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div>
      <TituloPantalla
        titulo="Ventas"
        subtitulo="Facturación y cobro"
        acciones={
          puede("venta:crear") ? (
            <Boton onClick={() => navegar("/ventas/nueva")}>+ Nueva</Boton>
          ) : undefined
        }
      />

      <button
        onClick={() => setFiltros(true)}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-200 shadow-sm"
      >
        <span>🔍 Filtros {cicloId || estadoSel ? "· activos" : ""}</span>
        <span className="text-stone-400 dark:text-stone-500">▾</span>
      </button>

      <HojaInferior abierto={filtros} onCerrar={() => setFiltros(false)} titulo="Filtrar ventas">
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
          <div>
            <span className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-200">Estado de cobro</span>
            <div className="flex flex-wrap gap-2">
              {["PENDIENTE", "PARCIAL", "PAGADA", "VENCIDA", "CANCELADA"].map((e) => (
                <button
                  key={e}
                  onClick={() => setEstadoSel(estadoSel === e ? "" : e)}
                  className={`min-h-10 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                    estadoSel === e
                      ? "border-campo-700 dark:border-campo-400 bg-campo-800 text-white"
                      : "border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200"
                  }`}
                >
                  {etiquetaEstadoCobro(e as never)}
                </button>
              ))}
            </div>
          </div>
          <Boton className="w-full" onClick={() => setFiltros(false)}>
            Aplicar
          </Boton>
        </div>
      </HojaInferior>

      {ventas.length === 0 ? (
        <EstadoVacio
          mensaje="No hay ventas registradas."
          accionTexto={puede("venta:crear") ? "Registrar venta" : undefined}
          onAccion={puede("venta:crear") ? () => navegar("/ventas/nueva") : undefined}
          icono="🛒"
        />
      ) : (
        <ul className="space-y-2">
          {ventas.map((v) => {
            const cliente = db.clientes.find((c) => c.id === v.clienteId);
            const ciclo = db.ciclos.find((c) => c.id === v.cicloId);
            const parcela = db.parcelas.find((p) => p.id === ciclo?.parcelaId);
            const estado = estadoCobroVenta(db, v);
            const saldo = saldoVenta(db, v);
            return (
              <li key={v.id}>
                <button
                  onClick={() => navegar(`/ventas/${v.id}`)}
                  className="w-full rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 text-left shadow-sm hover:bg-campo-50 dark:hover:bg-campo-900/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900 dark:text-stone-100">{cliente?.nombre}</p>
                      <p className="text-sm text-stone-600 dark:text-stone-300">
                        {v.numeroFactura ?? "Sin factura"} · {v.fecha}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {parcela?.nombre} {ciclo?.nombre}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-stone-900 dark:text-stone-100">{money(v.totalFacturado)}</p>
                      <InsigniaEstado texto={etiquetaEstadoCobro(estado)} />
                      {saldo > 0 && v.estado === "ACTIVA" && (
                        <p className="mt-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          Saldo {money(saldo)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
