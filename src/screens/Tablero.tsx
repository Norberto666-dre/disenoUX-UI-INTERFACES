import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../context/AppContext";
import {
  costoPorCategoria,
  etiquetaEstadoCiclo,
  generarAlertas,
  indicadoresCiclo,
  nombreCultivo,
  saldoVenta,
  estadoCobroVenta,
} from "../lib/calc";
import { fecha, money, pct } from "../lib/format";
import {
  EstadoVacio,
  HojaInferior,
  InsigniaEstado,
  TarjetaAlerta,
  TarjetaKPI,
  TituloPantalla,
} from "../components/ui";

export default function Tablero() {
  const { db, usuario } = useApp();
  const navegar = useNavigate();
  const ciclosVisibles = useMemo(
    () =>
      db.ciclos
        .filter((c) => c.estado !== "CANCELADO")
        .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio)),
    [db.ciclos],
  );
  const [selId, setSelId] = useState<string>(() => {
    const activo = ciclosVisibles.find((c) => c.estado === "ACTIVO");
    return (activo ?? ciclosVisibles[0])?.id ?? "";
  });
  const [selector, setSelector] = useState(false);

  const ciclo = db.ciclos.find((c) => c.id === selId);
  const parcela = db.parcelas.find((p) => p.id === ciclo?.parcelaId);
  const variedad = db.variedades.find((v) => v.id === ciclo?.variedadId);
  const ind = ciclo ? indicadoresCiclo(db, ciclo.id) : null;
  const cats = ciclo ? costoPorCategoria(db, ciclo.id) : [];
  const alertas = generarAlertas(db).slice(0, 3);

  const comparativo = useMemo(() => {
    if (!ciclo) return [];
    return db.ciclos
      .filter((c) => c.parcelaId === ciclo.parcelaId && c.estado !== "CANCELADO" && c.estado !== "PLANIFICADO")
      .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
      .map((c) => {
        const i = indicadoresCiclo(db, c.id);
        return {
          nombre: c.nombre.length > 10 ? c.nombre.slice(0, 10) + "…" : c.nombre,
          ganancia: i.ganancia,
          actual: c.id === ciclo.id,
        };
      });
  }, [ciclo, db]);

  const porCobrar = db.ventas
    .filter((v) => v.estado === "ACTIVA" && saldoVenta(db, v) > 0)
    .sort((a, b) => (a.fechaLimitePago ?? "").localeCompare(b.fechaLimitePago ?? ""));
  const vencidos = porCobrar.filter((v) => estadoCobroVenta(db, v) === "VENCIDA");

  if (!ciclo || !ind) {
    return (
      <EstadoVacio
        mensaje="No hay ciclos para mostrar. Crea un ciclo de producción desde la pestaña Ciclos."
        accionTexto="Ir a Ciclos"
        onAccion={() => navegar("/ciclos")}
      />
    );
  }

  const totalCosto = cats.reduce((s, c) => s + c.monto, 0) || 1;

  return (
    <div className="pb-4">
      <TituloPantalla
        titulo={db.empresa.nombre}
        subtitulo={`${usuario?.nombre} · ${db.empresa.estado === "PRUEBA" ? "Cuenta de prueba" : "Suscripción activa"}`}
      />

      {/* 1. Selector de ciclo */}
      <button
        onClick={() => setSelector(true)}
        className="mb-4 flex w-full items-center justify-between rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 text-left shadow-sm hover:bg-campo-50 dark:hover:bg-campo-900/50"
      >
        <span>
          <span className="block text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
            Ciclo seleccionado
          </span>
          <span className="font-bold text-stone-900 dark:text-stone-100">{ciclo.nombre}</span>
          <span className="block text-sm text-stone-600 dark:text-stone-300">
            {parcela?.nombre} · {nombreCultivo(db, ciclo.variedadId)} {variedad?.nombre}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <InsigniaEstado texto={etiquetaEstadoCiclo(ciclo.estado)} />
          <span className="text-stone-400 dark:text-stone-500">▾</span>
        </span>
      </button>

      <HojaInferior abierto={selector} onCerrar={() => setSelector(false)} titulo="Elige un ciclo">
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {ciclosVisibles.map((c) => {
            const p = db.parcelas.find((x) => x.id === c.parcelaId);
            return (
              <li key={c.id}>
                <button
                  onClick={() => {
                    setSelId(c.id);
                    setSelector(false);
                  }}
                  className="flex w-full items-center justify-between py-3 text-left"
                >
                  <span>
                    <span className="block font-semibold text-stone-900 dark:text-stone-100">{c.nombre}</span>
                    <span className="block text-sm text-stone-500 dark:text-stone-400">
                      {p?.nombre} · {nombreCultivo(db, c.variedadId)}
                    </span>
                  </span>
                  {c.id === selId && <span className="text-campo-700 dark:text-campo-300">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </HojaInferior>

      {/* 2. Indicadores */}
      <div className="grid grid-cols-2 gap-3">
        <TarjetaKPI
          etiqueta="Ganancia"
          valor={money(ind.ganancia)}
          tono={ind.ganancia < 0 ? "negativo" : "positivo"}
        />
        <TarjetaKPI
          etiqueta="Margen"
          valor={ind.margenPct == null ? "—" : pct(ind.margenPct)}
          tono={ind.margenPct == null ? "neutro" : ind.margenPct < 0 ? "negativo" : "positivo"}
        />
        <TarjetaKPI etiqueta="Costo por kg" valor={ind.costoPorKg == null ? "—" : money(ind.costoPorKg)} />
        <TarjetaKPI
          etiqueta="Merma"
          valor={ind.mermaPct == null ? "—" : pct(ind.mermaPct)}
          variacion={`${Math.round(ind.kgMermaPoscosecha).toLocaleString("es-MX")} kg poscosecha`}
        />
        <TarjetaKPI etiqueta="Por cobrar" valor={money(ind.porCobrar)} tono={ind.porCobrar > 0 ? "negativo" : "neutro"} />
        <TarjetaKPI etiqueta="ROI" valor={ind.roiPct == null ? "—" : pct(ind.roiPct)} tono={ind.roiPct != null && ind.roiPct < 0 ? "negativo" : "positivo"} />
      </div>

      {/* 3. Alertas */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold text-stone-900 dark:text-stone-100">Alertas</h2>
          <button onClick={() => navegar("/alertas")} className="text-sm font-semibold text-campo-800 dark:text-campo-200">
            Ver todas →
          </button>
        </div>
        {alertas.length === 0 ? (
          <p className="rounded-2xl bg-campo-50 dark:bg-campo-900/40 px-4 py-3 text-sm text-campo-900 dark:text-campo-200">
            ✓ Sin alertas importantes en este momento.
          </p>
        ) : (
          <div className="space-y-2">
            {alertas.map((a) => (
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
      </section>

      {/* 4. Costo por categoría */}
      <section className="mt-6">
        <h2 className="mb-2 font-bold text-stone-900 dark:text-stone-100">Costo por categoría</h2>
        {cats.length === 0 ? (
          <p className="rounded-2xl bg-white dark:bg-stone-800 px-4 py-3 text-sm text-stone-500 dark:text-stone-400 shadow-sm">
            Este ciclo aún no tiene gastos.
          </p>
        ) : (
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
            <div className="flex h-4 w-full overflow-hidden rounded-full">
              {cats.map((c, i) => (
                <div
                  key={c.nombre}
                  className={["bg-campo-800", "bg-campo-500", "bg-campo-300", "bg-amber-400", "bg-stone-400", "bg-sky-400"][i % 6]}
                  style={{ width: `${(c.monto / totalCosto) * 100}%` }}
                  title={`${c.nombre}: ${money(c.monto)}`}
                />
              ))}
            </div>
            <ul className="mt-3 space-y-1.5">
              {cats.map((c, i) => (
                <li key={c.nombre} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-stone-700 dark:text-stone-200">
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${["bg-campo-800", "bg-campo-500", "bg-campo-300", "bg-amber-400", "bg-stone-400", "bg-sky-400"][i % 6]}`}
                    />
                    {c.nombre}
                  </span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {money(c.monto)} · {pct(c.porcentaje)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 5. Comparación contra ciclo anterior */}
      <section className="mt-6">
        <h2 className="mb-2 font-bold text-stone-900 dark:text-stone-100">Comparativo por parcela</h2>
        <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
          {comparativo.length < 2 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Aún no hay ciclos anteriores en {parcela?.nombre} para comparar.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={comparativo} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => money(Number(v ?? 0))} />
                <Bar dataKey="ganancia" radius={[6, 6, 0, 0]}>
                  {comparativo.map((c) => (
                    <Cell key={c.nombre} fill={c.ganancia < 0 ? "#dc2626" : c.actual ? "#166534" : "#57ae69"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* 6. Cuentas por cobrar */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold text-stone-900 dark:text-stone-100">Cuentas por cobrar</h2>
          <span className="text-sm font-semibold text-stone-600 dark:text-stone-300">{money(ind.porCobrar)}</span>
        </div>
        {porCobrar.length === 0 ? (
          <p className="rounded-2xl bg-white dark:bg-stone-800 px-4 py-3 text-sm text-stone-500 dark:text-stone-400 shadow-sm">
            No hay saldos pendientes. 🎉
          </p>
        ) : (
          <ul className="space-y-2">
            {porCobrar.slice(0, 4).map((v) => {
              const cliente = db.clientes.find((c) => c.id === v.clienteId);
              return (
                <li key={v.id}>
                  <button
                    onClick={() => navegar(`/ventas/${v.id}`)}
                    className="flex w-full items-center justify-between rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 text-left shadow-sm hover:bg-campo-50 dark:hover:bg-campo-900/50"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {cliente?.nombre}
                      </span>
                      <span className="block text-xs text-stone-500 dark:text-stone-400">
                        {v.numeroFactura} · límite {fecha(v.fechaLimitePago ?? "")}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-bold text-stone-900 dark:text-stone-100">
                        {money(saldoVenta(db, v))}
                      </span>
                      <InsigniaEstado texto={estadoCobroVenta(db, v)} />
                    </span>
                  </button>
                </li>
              );
            })}
            {vencidos.length > 0 && (
              <li className="rounded-xl bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300">
                ⚠ {vencidos.length} cobro{vencidos.length > 1 ? "s" : ""} vencido
                {vencidos.length > 1 ? "s" : ""}
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
