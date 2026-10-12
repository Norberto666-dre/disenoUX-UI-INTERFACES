import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { saldoVenta } from "../lib/calc";
import { hoyIso, money, uid } from "../lib/format";
import {
  BarraGuardar,
  Boton,
  Campo,
  CampoImporte,
  SelectorBasico,
  SelectorCatalogo,
  SelectorFecha,
  TituloPantalla,
} from "../components/ui";

const METODOS = [
  { valor: "EFECTIVO", texto: "Efectivo" },
  { valor: "TRANSFERENCIA", texto: "Transferencia" },
  { valor: "CHEQUE", texto: "Cheque" },
  { valor: "TARJETA", texto: "Tarjeta" },
  { valor: "OTRO", texto: "Otro" },
];

export default function FormCobro() {
  const { db, sesion, actualizar, registrar, notificar } = useApp();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const [ventaId, setVentaId] = useState(params.get("ventaId") ?? "");
  const [fecha, setFecha] = useState(hoyIso());
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("TRANSFERENCIA");
  const [referencia, setReferencia] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const ventaSel = db.ventas.find((v) => v.id === ventaId);
  const saldo = ventaSel ? saldoVenta(db, ventaSel) : 0;
  const montoN = Number(monto.replace(/,/g, "")) || 0;

  const ventasConSaldo = db.ventas
    .filter((v) => v.estado === "ACTIVA" && saldoVenta(db, v) > 0)
    .map((v) => {
      const cliente = db.clientes.find((c) => c.id === v.clienteId);
      return {
        id: v.id,
        etiquetaCompleta: `${v.numeroFactura ?? "sin factura"} — ${cliente?.nombre} · saldo ${money(saldoVenta(db, v))}`,
      };
    });

  const guardar = () => {
    const e: Record<string, string> = {};
    if (!ventaId) e.ventaId = "Elige la venta.";
    if (!fecha) e.fecha = "Captura la fecha.";
    if (!montoN || montoN <= 0) e.monto = "El monto debe ser mayor a 0.";
    else if (montoN > saldo) e.monto = `No puede superar el saldo (${money(saldo)}) (RN-054).`;
    if (!metodo) e.metodo = "Elige el método.";
    setErrores(e);
    if (Object.keys(e).length) return;

    setEnviando(true);
    const id = uid("cb");
    const nuevoSaldo = saldo - montoN;
    actualizar((prev) => ({
      ...prev,
      cobros: [
        ...prev.cobros,
        {
          id,
          ventaId,
          fecha,
          monto: montoN,
          metodo: metodo as never,
          referencia: referencia.trim() || null,
          creadoPorId: sesion?.usuarioId ?? "",
          creadoEn: new Date().toISOString().slice(0, 19),
          estado: "ACTIVO" as const,
        },
      ],
    }));
    registrar("CREAR", "Cobro", id, null, money(montoN));
    notificar(
      nuevoSaldo <= 0
        ? "Cobro registrado. La venta quedó como Pagada."
        : `Cobro registrado. Quedan ${money(nuevoSaldo)} por cobrar.`,
    );
    window.setTimeout(() => navegar(`/ventas/${ventaId}`), 500);
  };

  return (
    <div className="pb-56">
      <TituloPantalla titulo="Nuevo cobro" subtitulo="Registro de dinero recibido" volver={() => navegar(-1)} />

      <div className="space-y-4">
        <div>
          <SelectorCatalogo
            etiqueta="Venta"
            valor={ventaId}
            onChange={setVentaId}
            opciones={ventasConSaldo}
            obligatorio
            error={errores.ventaId}
            placeholder="Elige la venta con saldo"
          />
          {ventaSel && (
            <div className="mt-2 rounded-xl bg-campo-50 dark:bg-campo-900/40 px-3 py-2 text-sm text-campo-900 dark:text-campo-200">
              Saldo disponible: <b>{money(saldo)}</b>
            </div>
          )}
        </div>

        <SelectorFecha etiqueta="Fecha" valor={fecha} onChange={setFecha} obligatorio error={errores.fecha} />
        <CampoImporte etiqueta="Monto" valor={monto} onChange={setMonto} obligatorio error={errores.monto} />
        <SelectorBasico
          etiqueta="Método"
          valor={metodo}
          onChange={setMetodo}
          opciones={METODOS}
          obligatorio
          error={errores.metodo}
        />
        <Campo etiqueta="Referencia (opcional)" valor={referencia} onChange={setReferencia} placeholder="Ej. SPEI 4471" />
        <p className="rounded-xl bg-stone-100 dark:bg-stone-800 px-3 py-2 text-xs text-stone-600 dark:text-stone-300">
          El estado de la venta (Pendiente, Parcial, Pagada, Vencida) se calcula solo: nadie lo cambia
          a mano (RN-056).
        </p>
      </div>

      <BarraGuardar>
        <Boton onClick={guardar} disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar cobro"}
        </Boton>
      </BarraGuardar>
    </div>
  );
}
