import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../context/AppContext";
import {
  curvaProduccion,
  etiquetaEstadoCobro,
  etiquetaEstadoCiclo,
  estadoCobroVenta,
  indicadoresCiclo,
  nombreCultivo,
  saldoVenta,
} from "../lib/calc";
import { fecha, hoyIso, money, num, pct } from "../lib/format";
import {
  Boton,
  DialogoConfirmacion,
  EstadoVacio,
  FilaDato,
  InsigniaEstado,
  TituloPantalla,
} from "../components/ui";

type Pestana = "resumen" | "actividades" | "gastos" | "cosechas" | "mermas" | "ventas";

export default function DetalleCiclo() {
  const { id = "" } = useParams();
  const { db, sesion, puede, actualizar, registrar, notificar, empresaVencida } = useApp();
  const navegar = useNavigate();
  const ciclo = db.ciclos.find((c) => c.id === id);
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [dialogo, setDialogo] = useState<null | "iniciar" | "suspender" | "reanudar" | "finalizar" | "cancelar" | "reabrir">(null);

  const parcela = db.parcelas.find((p) => p.id === ciclo?.parcelaId);
  const variedad = db.variedades.find((v) => v.id === ciclo?.variedadId);
  const ind = ciclo ? indicadoresCiclo(db, ciclo.id) : null;

  const pestanas: { id: Pestana; texto: string }[] = useMemo(() => {
    const base: { id: Pestana; texto: string }[] = [
      { id: "resumen", texto: "Resumen" },
      { id: "actividades", texto: "Actividades" },
      { id: "gastos", texto: "Gastos" },
      { id: "cosechas", texto: "Cosechas" },
      { id: "mermas", texto: "Mermas" },
    ];
    if (sesion?.rol !== "CAPTURISTA") base.push({ id: "ventas", texto: "Ventas" });
    return base;
  }, [sesion]);

  if (!ciclo || !ind) {
    return <EstadoVacio mensaje="No se encontró el ciclo." accionTexto="Volver a ciclos" onAccion={() => navegar("/ciclos")} />;
  }

  const acciones: { clave: typeof dialogo; texto: string; variante: "primario" | "secundario" | "peligro" }[] = [];
  if (puede("ciclo:cerrar")) {
    if (ciclo.estado === "PLANIFICADO") {
      acciones.push({ clave: "iniciar", texto: "Iniciar ciclo", variante: "primario" });
      acciones.push({ clave: "cancelar", texto: "Cancelar", variante: "peligro" });
    }
    if (ciclo.estado === "ACTIVO") {
      acciones.push({ clave: "suspender", texto: "Suspender", variante: "secundario" });
      acciones.push({ clave: "finalizar", texto: "Finalizar", variante: "primario" });
      acciones.push({ clave: "cancelar", texto: "Cancelar", variante: "peligro" });
    }
    if (ciclo.estado === "SUSPENDIDO") {
      acciones.push({ clave: "reanudar", texto: "Reanudar", variante: "primario" });
      acciones.push({ clave: "finalizar", texto: "Finalizar", variante: "secundario" });
      acciones.push({ clave: "cancelar", texto: "Cancelar", variante: "peligro" });
    }
    if (ciclo.estado === "FINALIZADO" || ciclo.estado === "CANCELADO") {
      acciones.push({ clave: "reabrir", texto: "Reabrir ciclo", variante: "secundario" });
    }
  }

  const aplicarAccion = () => {
    if (!dialogo) return;
    const mapa = {
      iniciar: { estado: "ACTIVO" as const, accion: "INICIAR_CICLO" },
      suspender: { estado: "SUSPENDIDO" as const, accion: "SUSPENDER_CICLO" },
      reanudar: { estado: "ACTIVO" as const, accion: "REANUDAR_CICLO" },
      finalizar: { estado: "FINALIZADO" as const, accion: "CERRAR_CICLO" },
      cancelar: { estado: "CANCELADO" as const, accion: "CANCELAR_CICLO" },
      reabrir: { estado: "ACTIVO" as const, accion: "REABRIR_CICLO" },
    }[dialogo];

    actualizar((prev) => ({
      ...prev,
      ciclos: prev.ciclos.map((c) =>
        c.id === ciclo.id
          ? {
              ...c,
              estado: mapa.estado,
              fechaFin: mapa.estado === "FINALIZADO" || mapa.estado === "CANCELADO" ? hoyIso() : c.fechaFin,
              cerradoEn: mapa.estado === "FINALIZADO" ? hoyIso() : null,
              cerradoPorId: mapa.estado === "FINALIZADO" ? (sesion?.usuarioId ?? null) : null,
            }
          : c,
      ),
      parcelas: prev.parcelas.map((p) =>
        p.id === ciclo.parcelaId
          ? {
              ...p,
              estado:
                mapa.estado === "ACTIVO"
                  ? ("EN_USO" as const)
                  : mapa.estado === "FINALIZADO" || mapa.estado === "CANCELADO"
                    ? ("DISPONIBLE" as const)
                    : p.estado,
            }
          : p,
      ),
    }));
    registrar(mapa.accion, "Ciclo", ciclo.id, etiquetaEstadoCiclo(ciclo.estado), etiquetaEstadoCiclo(mapa.estado));
    notificar(`Ciclo ${mapa.estado === "ACTIVO" ? "actualizado" : etiquetaEstadoCiclo(mapa.estado).toLowerCase()}.`);
    setDialogo(null);
  };

  const avanceMeta = ciclo.metaKg ? Math.min((ind.kgCosechados / ciclo.metaKg) * 100, 100) : null;
  const capturasAbiertas = ["ACTIVO", "SUSPENDIDO"].includes(ciclo.estado) && !empresaVencida;

  const actividades = db.actividades.filter((a) => a.cicloId === ciclo.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const gastos = db.gastos.filter((g) => g.cicloId === ciclo.id && g.estado === "ACTIVO").sort((a, b) => b.fecha.localeCompare(a.fecha));
  const cosechas = db.cosechas.filter((c) => c.cicloId === ciclo.id && c.estado === "ACTIVA").sort((a, b) => b.fecha.localeCompare(a.fecha));
  const mermas = db.mermas.filter((m) => m.cicloId === ciclo.id && m.estado === "ACTIVA").sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ventas = db.ventas.filter((v) => v.cicloId === ciclo.id).sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="pb-6">
      <TituloPantalla
        titulo={ciclo.nombre}
        volver={() => navegar("/ciclos")}
        subtitulo={`${parcela?.nombre} · ${nombreCultivo(db, ciclo.variedadId)} ${variedad?.nombre}`}
        acciones={<InsigniaEstado texto={etiquetaEstadoCiclo(ciclo.estado)} />}
      />

      <div className="mb-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 text-sm shadow-sm">
        <FilaDato etiqueta="Superficie sembrada" valor={`${ciclo.superficieSembradaHa} ha`} />
        <FilaDato etiqueta="Fecha de inicio" valor={fecha(ciclo.fechaInicio)} />
        <FilaDato etiqueta="Meta de producción" valor={ciclo.metaKg ? `${ciclo.metaKg.toLocaleString("es-MX")} kg` : "—"} />
        {avanceMeta != null && (
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Avance de cosecha</span>
              <span className="font-semibold text-stone-800 dark:text-stone-100">{num(avanceMeta, 1)} %</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <div className="h-full rounded-full bg-campo-600" style={{ width: `${avanceMeta}%` }} />
            </div>
          </div>
        )}
      </div>

      {acciones.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {acciones.map((a) => (
            <Boton key={a.clave} variante={a.variante} onClick={() => setDialogo(a.clave)}>
              {a.texto}
            </Boton>
          ))}
        </div>
      )}

      {/* Pestañas internas */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-stone-200/70 dark:bg-stone-700/70 p-1">
        {pestanas.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestana(p.id)}
            className={`min-h-10 shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              pestana === p.id ? "bg-white dark:bg-stone-800 text-campo-900 dark:text-campo-200 shadow-sm" : "text-stone-600 dark:text-stone-300"
            }`}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {pestana === "resumen" && (
        <div className="space-y-4">
          {sesion?.rol !== "CAPTURISTA" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <KPI texto="Ganancia" valor={money(ind.ganancia)} rojo={ind.ganancia < 0} />
                <KPI texto="Costo total" valor={money(ind.costoTotal)} />
                <KPI texto="Ingresos" valor={money(ind.ingresos)} />
                <KPI texto="Costo por kg" valor={ind.costoPorKg == null ? "—" : money(ind.costoPorKg)} />
                <KPI texto="Precio prom. kg" valor={ind.precioPromedioKg == null ? "—" : money(ind.precioPromedioKg)} />
                <KPI texto="Merma %" valor={ind.mermaPct == null ? "—" : pct(ind.mermaPct)} />
              </div>
              <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
                <h3 className="mb-2 text-sm font-bold text-stone-900 dark:text-stone-100">Curva de producción</h3>
                {cosechas.length === 0 ? (
                  <p className="text-sm text-stone-500 dark:text-stone-400">Sin cosechas registradas.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={curvaProduccion(db, ciclo.id)}>
                      <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => `${Number(v ?? 0).toLocaleString("es-MX")} kg`} />
                      <Line type="monotone" dataKey="kg" stroke="#26763a" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          ) : (
            <p className="rounded-2xl bg-white dark:bg-stone-800 px-4 py-4 text-sm text-stone-600 dark:text-stone-300 shadow-sm">
              Aquí solo ves el avance del ciclo. Los indicadores financieros los consulta tu
              administrador.
            </p>
          )}
        </div>
      )}

      {pestana === "actividades" && (
        <ListaSimple
          vacio="Sin actividades en este ciclo."
          accion={capturasAbiertas && puede("actividad:crear") ? () => navegar("/capturas/actividad") : undefined}
          items={actividades.map((a) => {
            const t = db.tiposActividad.find((x) => x.id === a.tipoActividadId);
            return {
              id: a.id,
              titulo: `${t?.icono ?? ""} ${t?.nombre ?? ""}`,
              subtitulo: `${fecha(a.fecha)}${a.horas ? ` · ${a.horas} h` : ""}`,
              detalle: a.descripcion ?? "",
            };
          })}
        />
      )}

      {pestana === "gastos" && (
        <ListaSimple
          vacio="Sin gastos en este ciclo."
          accion={capturasAbiertas && puede("gasto:crear") ? () => navegar("/capturas/gasto") : undefined}
          items={gastos.map((g) => {
            const cat = db.categoriasGasto.find((c) => c.id === g.categoriaId);
            return {
              id: g.id,
              titulo: cat?.nombre ?? "Gasto",
              subtitulo: `${fecha(g.fecha)} · ${g.descripcion}`,
              derecha: money(g.totalPagado),
            };
          })}
        />
      )}

      {pestana === "cosechas" && (
        <ListaSimple
          vacio="Sin cosechas registradas."
          accion={capturasAbiertas && puede("cosecha:crear") ? () => navegar("/capturas/cosecha") : undefined}
          items={cosechas.map((c) => {
            const u = db.unidades.find((x) => x.id === c.unidadId);
            const kgTot = (u?.factorKg ?? 0) * c.cantidad;
            return {
              id: c.id,
              titulo: `${c.cantidad.toLocaleString("es-MX")} ${u?.abrev ?? ""} · ${c.calidad}`,
              subtitulo: `${fecha(c.fecha)} · ${Math.round(kgTot).toLocaleString("es-MX")} kg`,
              detalle: c.observaciones ?? "",
            };
          })}
        />
      )}

      {pestana === "mermas" && (
        <ListaSimple
          vacio="Sin mermas registradas."
          accion={capturasAbiertas && puede("merma:crear") ? () => navegar("/capturas/merma") : undefined}
          items={mermas.map((m) => {
            const u = db.unidades.find((x) => x.id === m.unidadId);
            const motivo = db.motivosMerma.find((x) => x.id === m.motivoId);
            return {
              id: m.id,
              titulo: `${motivo?.nombre ?? ""} · ${m.etapa}`,
              subtitulo: `${fecha(m.fecha)} · ${m.cantidad} ${u?.abrev ?? ""}`,
              detalle: m.etapa === "CAMPO" ? "No resta de lo cosechado" : (m.observaciones ?? ""),
            };
          })}
        />
      )}

      {pestana === "ventas" && (
        <ListaSimple
          vacio="Sin ventas en este ciclo."
          accion={capturasAbiertas && puede("venta:crear") ? () => navegar("/ventas/nueva") : undefined}
          items={ventas.map((v) => {
            const cliente = db.clientes.find((c) => c.id === v.clienteId);
            return {
              id: v.id,
              titulo: cliente?.nombre ?? "Cliente",
              subtitulo: `${fecha(v.fecha)} · ${v.numeroFactura ?? "sin factura"}`,
              derecha: money(v.totalFacturado),
              insignia: v.estado === "CANCELADA" ? "Cancelada" : etiquetaEstadoCobro(estadoCobroVenta(db, v)),
              onClick: () => navegar(`/ventas/${v.id}`),
              extra: v.estado === "ACTIVA" && saldoVenta(db, v) > 0 ? `Saldo ${money(saldoVenta(db, v))}` : undefined,
            };
          })}
        />
      )}

      <DialogoConfirmacion
        abierto={dialogo !== null}
        titulo={
          dialogo === "finalizar"
            ? "¿Finalizar ciclo?"
            : dialogo === "cancelar"
              ? "¿Cancelar ciclo?"
              : dialogo === "reabrir"
                ? "¿Reabrir ciclo?"
                : dialogo === "suspender"
                  ? "¿Suspender ciclo?"
                  : dialogo === "reanudar"
                    ? "¿Reanudar ciclo?"
                    : "¿Iniciar ciclo?"
        }
        mensaje={
          dialogo === "finalizar"
            ? "Finalizar bloquea la captura de gastos, actividades, cosechas y ventas. Solo se podrán registrar cobros. Libera la parcela."
            : dialogo === "cancelar"
              ? "Un ciclo cancelado no admite captura. Podrás reabrirlo después desde esta pantalla."
              : dialogo === "reabrir"
                ? "Reabrir permite capturar de nuevo y queda registrado en la bitácora."
                : "Se guardará el cambio en la bitácora con tu usuario y la fecha de hoy."
        }
        peligro={dialogo === "cancelar" || dialogo === "finalizar"}
        confirmarTexto={dialogo === "finalizar" ? "Finalizar" : "Confirmar"}
        onConfirmar={aplicarAccion}
        onCancelar={() => setDialogo(null)}
      />
    </div>
  );
}

function KPI({ texto, valor, rojo }: { texto: string; valor: string; rojo?: boolean }) {
  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">{texto}</p>
      <p className={`mt-1 text-lg font-bold ${rojo ? "text-red-600" : "text-stone-900 dark:text-stone-100"}`}>{valor}</p>
    </div>
  );
}

function ListaSimple({
  items,
  vacio,
  accion,
}: {
  items: {
    id: string;
    titulo: string;
    subtitulo: string;
    detalle?: string;
    derecha?: string;
    insignia?: string;
    extra?: string;
    onClick?: () => void;
  }[];
  vacio: string;
  accion?: () => void;
}) {
  if (items.length === 0) {
    return <EstadoVacio mensaje={vacio} accionTexto={accion ? "Registrar" : undefined} onAccion={accion} />;
  }
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.id}>
          <button
            onClick={i.onClick}
            className={`w-full rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 text-left shadow-sm ${i.onClick ? "hover:bg-campo-50 dark:hover:bg-campo-900/50" : "cursor-default"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-stone-900 dark:text-stone-100">{i.titulo}</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">{i.subtitulo}</p>
                {i.detalle && <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{i.detalle}</p>}
                {i.extra && <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">{i.extra}</p>}
              </div>
              <div className="shrink-0 text-right">
                {i.derecha && <p className="font-bold text-stone-900 dark:text-stone-100">{i.derecha}</p>}
                {i.insignia && (
                  <span className="mt-1 inline-block">
                    <InsigniaEstado texto={i.insignia} />
                  </span>
                )}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
