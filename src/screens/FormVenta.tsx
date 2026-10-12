import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { SelectorCiclo } from "../components/SelectorCiclo";
import { kgDisponibles } from "../lib/calc";
import { hoyIso, money, round2, uid } from "../lib/format";
import type { Calidad } from "../types";
import {
  BarraGuardar,
  Boton,
  Campo,
  CampoImporte,
  CampoNumero,
  ResumenCalculo,
  SelectorBasico,
  SelectorCatalogo,
  SelectorFecha,
  SelectorSegmentado,
  TituloPantalla,
} from "../components/ui";

interface Renglon {
  key: string;
  calidad: Calidad;
  cantidad: string;
  unidadId: string;
  precioUnitario: string;
}

const CALIDADES = [
  { valor: "EXTRA", texto: "Extra" },
  { valor: "PRIMERA", texto: "Primera" },
  { valor: "SEGUNDA", texto: "Segunda" },
  { valor: "TERCERA", texto: "Tercera" },
  { valor: "INDUSTRIAL", texto: "Industrial" },
];

export default function FormVenta() {
  const { db, sesion, actualizar, registrar, notificar } = useApp();
  const navegar = useNavigate();

  const [cicloId, setCicloId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [numeroFactura, setNumeroFactura] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [descuento, setDescuento] = useState("0");
  const [impuesto, setImpuesto] = useState("0");
  const [totalFacturado, setTotalFacturado] = useState("");
  const [renglones, setRenglones] = useState<Renglon[]>([
    { key: "r1", calidad: "PRIMERA", cantidad: "", unidadId: "un1", precioUnitario: "" },
  ]);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const ciclo = db.ciclos.find((c) => c.id === cicloId);
  const bloqueado = !ciclo || (ciclo.estado !== "ACTIVO" && ciclo.estado !== "SUSPENDIDO");
  const disponibles = cicloId ? kgDisponibles(db, cicloId) : 0;

  const unidades = db.unidades
    .filter((u) => u.factorKg > 0)
    .map((u) => ({ valor: u.id, texto: u.nombre }));
  const clientes = db.clientes.filter((c) => c.activo).map((c) => ({ id: c.id, etiquetaCompleta: c.nombre }));

  const n = (s: string) => Number(s.replace(/,/g, "")) || 0;

  const sumaRenglones = round2(
    renglones.reduce((s, r) => s + n(r.cantidad) * n(r.precioUnitario), 0),
  );
  const kgTotales = renglones.reduce((s, r) => {
    const u = db.unidades.find((x) => x.id === r.unidadId);
    return s + n(r.cantidad) * (u?.factorKg ?? 0);
  }, 0);
  const calculado = round2(sumaRenglones - n(descuento) + n(impuesto));
  const totalN = n(totalFacturado);
  const excedeDisponibles = kgTotales > disponibles && disponibles >= 0 && cicloId !== "";

  const actualizarRenglon = (key: string, campo: keyof Renglon, valor: string) => {
    setRenglones((prev) => prev.map((r) => (r.key === key ? { ...r, [campo]: valor } : r)));
  };

  const validar = () => {
    const e: Record<string, string> = {};
    if (!cicloId) e.cicloId = "Elige el ciclo.";
    else if (bloqueado) e.cicloId = "El ciclo no admite ventas (RN-015).";
    if (!clienteId) e.clienteId = "Elige el cliente.";
    if (!fecha) e.fecha = "Captura la fecha.";
    const validos = renglones.filter((r) => n(r.cantidad) > 0 && n(r.precioUnitario) > 0);
    if (validos.length === 0) e.renglones = "Agrega al menos un renglón con cantidad y precio.";
    if (totalN <= 0) e.totalFacturado = "Captura el total facturado.";
    else if (Math.abs(totalN - calculado) > 0.05)
      e.totalFacturado = `No coincide con Σ(cantidad × precio) − descuento + impuesto (${money(calculado)}) (RN-052).`;
    if (excedeDisponibles)
      e.renglones = `Solo quedan ${Math.round(disponibles).toLocaleString("es-MX")} kg disponibles para vender (RN-027).`;
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = () => {
    if (!validar()) return;
    setEnviando(true);
    const ventaId = uid("v");
    const validos = renglones.filter((r) => n(r.cantidad) > 0 && n(r.precioUnitario) > 0);
    actualizar((prev) => ({
      ...prev,
      ventas: [
        ...prev.ventas,
        {
          id: ventaId,
          cicloId,
          clienteId,
          fecha,
          numeroFactura: numeroFactura.trim() || null,
          fechaLimitePago: fechaLimite || null,
          descuento: n(descuento),
          impuesto: n(impuesto),
          totalFacturado: totalN,
          notas: null,
          creadoPorId: sesion?.usuarioId ?? "",
          creadoEn: new Date().toISOString().slice(0, 19),
          estado: "ACTIVA" as const,
        },
      ],
      detallesVenta: [
        ...prev.detallesVenta,
        ...validos.map((r) => ({
          id: uid("dv"),
          ventaId,
          calidad: r.calidad,
          cantidad: n(r.cantidad),
          unidadId: r.unidadId,
          precioUnitario: n(r.precioUnitario),
          cosechaOrigenId: null,
        })),
      ],
    }));
    registrar("CREAR", "Venta", ventaId, null, money(totalN));
    notificar("Venta registrada.");
    window.setTimeout(() => navegar(`/ventas/${ventaId}`), 400);
  };

  return (
    <div className="pb-56">
      <TituloPantalla titulo="Nueva venta" subtitulo="Facturación por renglones" volver={() => navegar(-1)} />

      <div className="space-y-5">
        {/* Cabecera */}
        <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Cabecera</h2>
          <SelectorCiclo valor={cicloId} onChange={setCicloId} error={errores.cicloId} admitidos={["ACTIVO", "SUSPENDIDO"]} />
          <div className="mt-4">
            <SelectorCatalogo
              etiqueta="Cliente"
              valor={clienteId}
              onChange={setClienteId}
              opciones={clientes}
              obligatorio
              error={errores.clienteId}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
            <SelectorFecha etiqueta="Fecha" valor={fecha} onChange={setFecha} obligatorio error={errores.fecha} />
            <SelectorFecha etiqueta="Fecha límite de pago" valor={fechaLimite} onChange={setFechaLimite} />
          </div>
          <div className="mt-4">
            <Campo etiqueta="Número de factura" valor={numeroFactura} onChange={setNumeroFactura} placeholder="Ej. F-0095" />
          </div>
          {cicloId && (
            <div className={`mt-4 rounded-xl px-3 py-2 text-sm font-medium ${excedeDisponibles ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300" : "bg-campo-50 dark:bg-campo-900/40 text-campo-900 dark:text-campo-200"}`}>
              📦 {Math.round(disponibles).toLocaleString("es-MX")} kg disponibles en el ciclo
              {kgTotales > 0 && ` · esta venta usa ${Math.round(kgTotales).toLocaleString("es-MX")} kg`}
            </div>
          )}
        </section>

        {/* Renglones */}
        <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Renglones</h2>
          {errores.renglones && <p className="mb-2 text-sm text-red-600">{errores.renglones}</p>}
          <div className="space-y-4">
            {renglones.map((r, i) => {
              const u = db.unidades.find((x) => x.id === r.unidadId);
              const subtotal = n(r.cantidad) * n(r.precioUnitario);
              return (
                <div key={r.key} className="rounded-xl border border-stone-200 dark:border-stone-700 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500">Renglón {i + 1}</span>
                    {renglones.length > 1 && (
                      <button
                        onClick={() => setRenglones((prev) => prev.filter((x) => x.key !== r.key))}
                        className="text-xs font-semibold text-red-600"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <SelectorSegmentado
                    etiqueta="Calidad"
                    valor={r.calidad}
                    onChange={(v) => actualizarRenglon(r.key, "calidad", v)}
                    opciones={CALIDADES}
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2 min-[360px]:grid-cols-3">
                    <CampoNumero etiqueta="Cantidad" valor={r.cantidad} onChange={(v) => actualizarRenglon(r.key, "cantidad", v)} />
                    <SelectorBasico
                      etiqueta="Unidad"
                      valor={r.unidadId}
                      onChange={(v) => actualizarRenglon(r.key, "unidadId", v)}
                      opciones={unidades}
                    />
                    <CampoImporte etiqueta="$ / unidad" valor={r.precioUnitario} onChange={(v) => actualizarRenglon(r.key, "precioUnitario", v)} />
                  </div>
                  <p className="mt-2 text-right text-sm font-semibold text-stone-700 dark:text-stone-200">
                    Subtotal: {money(subtotal)}
                    {u && u.factorKg > 0 && n(r.cantidad) > 0 && (
                      <span className="ml-2 text-xs font-normal text-stone-500 dark:text-stone-400">
                        ({(n(r.cantidad) * u.factorKg).toLocaleString("es-MX")} kg)
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
          <Boton
            variante="secundario"
            className="mt-3 w-full"
            onClick={() =>
              setRenglones((prev) => [
                ...prev,
                { key: uid("r"), calidad: "PRIMERA", cantidad: "", unidadId: "un1", precioUnitario: "" },
              ])
            }
          >
            + Renglón
          </Boton>
        </section>

        {/* Totales */}
        <section className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Totales</h2>
          <p className="mb-3 text-sm text-stone-600 dark:text-stone-300">Σ renglones: <b>{money(sumaRenglones)}</b></p>
          <div className="grid grid-cols-2 gap-3">
            <CampoImporte etiqueta="Descuento" valor={descuento} onChange={setDescuento} />
            <CampoImporte etiqueta="Impuesto" valor={impuesto} onChange={setImpuesto} />
          </div>
          <div className="mt-4">
            <CampoImporte
              etiqueta="Total facturado"
              valor={totalFacturado}
              onChange={setTotalFacturado}
              obligatorio
              error={errores.totalFacturado}
            />
          </div>
          {totalN > 0 && (
            <div className="mt-3">
              <ResumenCalculo capturado={totalN} calculado={calculado} etiquetaCalculo="por renglones" />
            </div>
          )}
        </section>
      </div>

      <BarraGuardar resumen={totalN > 0 ? <ResumenCalculo capturado={totalN} calculado={calculado} etiquetaCalculo="por renglones" /> : undefined}>
        <Boton onClick={guardar} disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar venta"}
        </Boton>
      </BarraGuardar>
    </div>
  );
}
