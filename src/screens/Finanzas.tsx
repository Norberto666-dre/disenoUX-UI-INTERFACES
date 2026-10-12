import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  cobrosVencidos,
  estadoCobroVenta,
  etiquetaEstadoCobro,
  saldoVenta,
  totalPorCobrar,
} from "../lib/calc";
import { fecha, money } from "../lib/format";
import { EstadoVacio, InsigniaEstado, TarjetaKPI, TituloPantalla } from "../components/ui";

type Vista = "ventas" | "cobrar";

export default function Finanzas() {
  const { db } = useApp();
  const navegar = useNavigate();
  const [vista, setVista] = useState<Vista>("ventas");

  const ventas = [...db.ventas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const conSaldo = db.ventas
    .filter((v) => v.estado === "ACTIVA" && saldoVenta(db, v) > 0)
    .sort((a, b) => (a.fechaLimitePago ?? "").localeCompare(b.fechaLimitePago ?? ""));
  const vencidas = cobrosVencidos(db);
  const total = totalPorCobrar(db);

  return (
    <div>
      <TituloPantalla titulo="Finanzas" subtitulo="Ventas y cuentas por cobrar" />

      <div className="mb-4 flex gap-1 rounded-xl bg-stone-200/70 dark:bg-stone-700/70 p-1">
        {(["ventas", "cobrar"] as Vista[]).map((v) => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className={`min-h-10 flex-1 rounded-lg text-sm font-semibold transition ${
              vista === v ? "bg-white dark:bg-stone-800 text-campo-900 dark:text-campo-200 shadow-sm" : "text-stone-600 dark:text-stone-300"
            }`}
          >
            {v === "ventas" ? "Ventas" : `Por cobrar (${conSaldo.length})`}
          </button>
        ))}
      </div>

      {vista === "ventas" &&
        (ventas.length === 0 ? (
          <EstadoVacio mensaje="Sin ventas registradas." accionTexto="Registrar venta" onAccion={() => navegar("/ventas/nueva")} icono="🛒" />
        ) : (
          <ul className="space-y-2">
            {ventas.map((v) => {
              const cliente = db.clientes.find((c) => c.id === v.clienteId);
              return (
                <li key={v.id}>
                  <button
                    onClick={() => navegar(`/ventas/${v.id}`)}
                    className="flex w-full items-center justify-between rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 text-left shadow-sm hover:bg-campo-50 dark:hover:bg-campo-900/50"
                  >
                    <span>
                      <span className="block font-semibold text-stone-900 dark:text-stone-100">{cliente?.nombre}</span>
                      <span className="block text-xs text-stone-500 dark:text-stone-400">
                        {v.numeroFactura} · {fecha(v.fecha)}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-bold text-stone-900 dark:text-stone-100">{money(v.totalFacturado)}</span>
                      <InsigniaEstado texto={etiquetaEstadoCobro(estadoCobroVenta(db, v))} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ))}

      {vista === "cobrar" && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <TarjetaKPI etiqueta="Total por cobrar" valor={money(total)} tono={total > 0 ? "negativo" : "neutro"} />
            <TarjetaKPI etiqueta="Vencidos" valor={String(vencidas.length)} tono={vencidas.length > 0 ? "negativo" : "positivo"} />
          </div>
          {conSaldo.length === 0 ? (
            <EstadoVacio mensaje="No hay saldos pendientes. 🎉" icono="💰" />
          ) : (
            <ul className="space-y-2">
              {conSaldo.map((v) => {
                const cliente = db.clientes.find((c) => c.id === v.clienteId);
                return (
                  <li key={v.id}>
                    <button
                      onClick={() => navegar(`/ventas/${v.id}`)}
                      className="flex w-full items-center justify-between rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 text-left shadow-sm hover:bg-campo-50 dark:hover:bg-campo-900/50"
                    >
                      <span>
                        <span className="block font-semibold text-stone-900 dark:text-stone-100">{cliente?.nombre}</span>
                        <span className="block text-xs text-stone-500 dark:text-stone-400">
                          {v.numeroFactura} · límite {fecha(v.fechaLimitePago ?? "")}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-bold text-red-600">{money(saldoVenta(db, v))}</span>
                        <InsigniaEstado texto={etiquetaEstadoCobro(estadoCobroVenta(db, v))} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            onClick={() => navegar("/cobros/nuevo")}
            className="mt-4 w-full rounded-2xl bg-campo-800 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-campo-900"
          >
            + Registrar cobro
          </button>
        </>
      )}
    </div>
  );
}
