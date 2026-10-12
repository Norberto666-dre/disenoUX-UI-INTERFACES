import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  cobrosVigentes,
  estadoCobroVenta,
  etiquetaEstadoCobro,
  etiquetaMetodo,
  saldoVenta,
} from "../lib/calc";
import { fecha, money } from "../lib/format";
import {
  Boton,
  DialogoConfirmacion,
  EstadoVacio,
  FilaDato,
  InsigniaEstado,
  TituloPantalla,
} from "../components/ui";

export default function DetalleVenta() {
  const { id = "" } = useParams();
  const { db, puede, actualizar, registrar, notificar } = useApp();
  const navegar = useNavigate();
  const venta = db.ventas.find((v) => v.id === id);
  const [cancelar, setCancelar] = useState(false);

  if (!venta) return <EstadoVacio mensaje="Venta no encontrada." accionTexto="Ver ventas" onAccion={() => navegar("/ventas")} />;

  const cliente = db.clientes.find((c) => c.id === venta.clienteId);
  const ciclo = db.ciclos.find((c) => c.id === venta.cicloId);
  const parcela = db.parcelas.find((p) => p.id === ciclo?.parcelaId);
  const renglones = db.detallesVenta.filter((d) => d.ventaId === venta.id);
  const cobros = db.cobros.filter((c) => c.ventaId === venta.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const estado = estadoCobroVenta(db, venta);
  const saldo = saldoVenta(db, venta);

  const confirmarCancelacion = () => {
    actualizar((prev) => ({
      ...prev,
      ventas: prev.ventas.map((v) => (v.id === venta.id ? { ...v, estado: "CANCELADA" as const } : v)),
    }));
    registrar("CANCELAR", "Venta", venta.id, money(venta.totalFacturado), "Cancelada");
    notificar("Venta cancelada. Queda registrada en la bitácora.", "info");
    setCancelar(false);
  };

  return (
    <div className="pb-28">
      <TituloPantalla
        titulo={cliente?.nombre ?? "Venta"}
        subtitulo={`${venta.numeroFactura ?? "Sin factura"} · ${fecha(venta.fecha)}`}
        volver={() => navegar(-1)}
        acciones={<InsigniaEstado texto={etiquetaEstadoCobro(estado)} />}
      />

      <div className="mb-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
        <FilaDato etiqueta="Ciclo" valor={`${parcela?.nombre} ${ciclo?.nombre}`} />
        <FilaDato etiqueta="Fecha límite de pago" valor={fecha(venta.fechaLimitePago ?? "")} />
        <FilaDato etiqueta="Total facturado" valor={money(venta.totalFacturado)} />
        <FilaDato etiqueta="Cobrado" valor={money(cobrosVigentes(db, venta.id))} />
        <FilaDato
          etiqueta="Saldo pendiente"
          valor={<span className={saldo > 0 ? "text-red-600" : "text-campo-700 dark:text-campo-300"}>{money(saldo)}</span>}
        />
      </div>

      <h2 className="mb-2 font-bold text-stone-900 dark:text-stone-100">Renglones</h2>
      <ul className="mb-4 space-y-2">
        {renglones.map((r) => {
          const u = db.unidades.find((x) => x.id === r.unidadId);
          const kgR = (u?.factorKg ?? 0) * r.cantidad;
          return (
            <li key={r.id} className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 shadow-sm">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-stone-900 dark:text-stone-100">{r.calidad}</p>
                  <p className="text-sm text-stone-600 dark:text-stone-300">
                    {r.cantidad.toLocaleString("es-MX")} {u?.abrev} · {money(r.precioUnitario)}/unidad
                    {kgR > 0 && ` · ${kgR.toLocaleString("es-MX")} kg`}
                  </p>
                </div>
                <p className="font-bold text-stone-900 dark:text-stone-100">{money(r.cantidad * r.precioUnitario)}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="mb-2 font-bold text-stone-900 dark:text-stone-100">Cobros</h2>
      {cobros.length === 0 ? (
        <p className="mb-4 rounded-2xl bg-white dark:bg-stone-800 px-4 py-3 text-sm text-stone-500 dark:text-stone-400 shadow-sm">
          Aún no hay cobros registrados.
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {cobros.map((c) => (
            <li
              key={c.id}
              className={`rounded-2xl border bg-white dark:bg-stone-800 px-4 py-3 shadow-sm ${
                c.estado === "ANULADO" ? "border-stone-200 dark:border-stone-700 opacity-60" : "border-stone-200 dark:border-stone-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-semibold text-stone-900 dark:text-stone-100 ${c.estado === "ANULADO" ? "line-through" : ""}`}>
                    {money(c.monto)} · {etiquetaMetodo(c.metodo)}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {fecha(c.fecha)}
                    {c.referencia ? ` · ${c.referencia}` : ""}
                    {c.estado === "ANULADO" && " · ANULADO"}
                  </p>
                </div>
                {c.estado === "ACTIVO" && puede("cobro:crear") && (
                  <button
                    onClick={() => {
                      actualizar((prev) => ({
                        ...prev,
                        cobros: prev.cobros.map((x) => (x.id === c.id ? { ...x, estado: "ANULADO" as const } : x)),
                      }));
                      registrar("ANULAR", "Cobro", c.id, money(c.monto), "Anulado");
                      notificar("Cobro anulado. Ya no cuenta para el saldo.", "info");
                    }}
                    className="text-xs font-semibold text-red-600"
                  >
                    Anular
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {venta.estado === "ACTIVA" && (
        <div className="flex gap-3">
          {puede("cobro:crear") && saldo > 0 && (
            <Boton className="flex-1" onClick={() => navegar(`/cobros/nuevo?ventaId=${venta.id}`)}>
              + Registrar cobro
            </Boton>
          )}
          {puede("venta:cancelar") && (
            <Boton variante="peligro" onClick={() => setCancelar(true)}>
              Cancelar venta
            </Boton>
          )}
        </div>
      )}

      {venta.estado === "CANCELADA" && (
        <p className="rounded-2xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm font-medium text-red-800 dark:text-red-300">
          Esta venta está cancelada. No se eliminó: queda en el historial por trazabilidad.
        </p>
      )}

      <DialogoConfirmacion
        abierto={cancelar}
        titulo="¿Cancelar esta venta?"
        mensaje={`Se cancelará la venta ${venta.numeroFactura ?? ""} por ${money(venta.totalFacturado)}. Los cobros ya registrados permanecen y el estado de cobro pasará a Cancelada. Una venta nunca se elimina.`}
        confirmarTexto="Sí, cancelar"
        peligro
        onConfirmar={confirmarCancelacion}
        onCancelar={() => setCancelar(false)}
      />
    </div>
  );
}
