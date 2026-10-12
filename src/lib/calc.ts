import type {
  AlertaGenerada,
  Ciclo,
  DB,
  EstadoCobroVenta,
  Gasto,
  Parcela,
  Severidad,
  Venta,
} from "../types";
import { diasEntre, hoyIso, round2 } from "./format";

/* ---------- conversión a kilogramos ---------- */

export function aKg(cantidad: number, factorKg: number): number {
  return factorKg > 0 ? cantidad * factorKg : 0;
}

/* ---------- catálogos auxiliares ---------- */

export function nombreCultivo(db: DB, variedadId: string): string {
  const v = db.variedades?.find((x) => x.id === variedadId);
  if (!v) return "";
  return db.cultivos?.find((c) => c.id === v.cultivoId)?.nombre ?? "";
}

export function nombreTipoSuelo(db: DB, parcela: Parcela | undefined): string | null {
  if (!parcela?.tipoSueloId) return null;
  return db.tiposSuelo?.find((t) => t.id === parcela.tipoSueloId)?.nombre ?? null;
}

/* ---------- totales por ciclo ---------- */

export function gastosActivos(db: DB, cicloId: string): Gasto[] {
  return db.gastos.filter((g) => g.cicloId === cicloId && g.estado === "ACTIVO");
}

export function costoTotalCiclo(db: DB, cicloId: string): number {
  return round2(gastosActivos(db, cicloId).reduce((s, g) => s + g.totalPagado, 0));
}

export function kgCosechados(db: DB, cicloId: string): number {
  return db.cosechas
    .filter((c) => c.cicloId === cicloId && c.estado === "ACTIVA")
    .reduce((s, c) => {
      const u = db.unidades.find((x) => x.id === c.unidadId);
      return s + aKg(c.cantidad, u?.factorKg ?? 0);
    }, 0);
}

export function kgMerma(db: DB, cicloId: string, soloPoscosecha = false): number {
  return db.mermas
    .filter(
      (m) =>
        m.cicloId === cicloId &&
        m.estado === "ACTIVA" &&
        (!soloPoscosecha || m.etapa !== "CAMPO"),
    )
    .reduce((s, m) => {
      const u = db.unidades.find((x) => x.id === m.unidadId);
      return s + aKg(m.cantidad, u?.factorKg ?? 0);
    }, 0);
}

export function ventasActivas(db: DB, cicloId: string): Venta[] {
  return db.ventas.filter((v) => v.cicloId === cicloId && v.estado === "ACTIVA");
}

export function kgVendidos(db: DB, cicloId: string): number {
  return ventasActivas(db, cicloId).reduce((s, v) => {
    const dets = db.detallesVenta.filter((d) => d.ventaId === v.id);
    return (
      s +
      dets.reduce((sd, d) => {
        const u = db.unidades.find((x) => x.id === d.unidadId);
        return sd + aKg(d.cantidad, u?.factorKg ?? 0);
      }, 0)
    );
  }, 0);
}

export function kgDisponibles(db: DB, cicloId: string): number {
  return kgCosechados(db, cicloId) - kgMerma(db, cicloId, true) - kgVendidos(db, cicloId);
}

export function ingresosCiclo(db: DB, cicloId: string): number {
  return round2(ventasActivas(db, cicloId).reduce((s, v) => s + v.totalFacturado, 0));
}

/* ---------- venta / cobro ---------- */

export function cobrosVigentes(db: DB, ventaId: string): number {
  return round2(
    db.cobros
      .filter((c) => c.ventaId === ventaId && c.estado === "ACTIVO")
      .reduce((s, c) => s + c.monto, 0),
  );
}

export function saldoVenta(db: DB, venta: Venta): number {
  return round2(venta.totalFacturado - cobrosVigentes(db, venta.id));
}

export function estadoCobroVenta(db: DB, venta: Venta): EstadoCobroVenta {
  if (venta.estado === "CANCELADA") return "CANCELADA";
  const saldo = saldoVenta(db, venta);
  if (saldo <= 0) return "PAGADA";
  if (venta.fechaLimitePago && venta.fechaLimitePago < hoyIso()) return "VENCIDA";
  return cobrosVigentes(db, venta.id) > 0 ? "PARCIAL" : "PENDIENTE";
}

export function totalPorCobrar(db: DB): number {
  return round2(
    db.ventas
      .filter((v) => v.estado === "ACTIVA")
      .reduce((s, v) => s + Math.max(0, saldoVenta(db, v)), 0),
  );
}

export function cobrosVencidos(db: DB): Venta[] {
  return db.ventas.filter(
    (v) => estadoCobroVenta(db, v) === "VENCIDA" && saldoVenta(db, v) > 0,
  );
}

/* ---------- indicadores del ciclo (RN-034, RN-066) ---------- */

export interface Indicadores {
  costoTotal: number;
  ingresos: number;
  ganancia: number;
  margenPct: number | null;
  roiPct: number | null;
  kgCosechados: number;
  kgMermaPoscosecha: number;
  mermaPct: number | null;
  kgDisponibles: number;
  kgVendidos: number;
  costoPorKg: number | null;
  precioPromedioKg: number | null;
  porCobrar: number;
}

export function indicadoresCiclo(db: DB, cicloId: string): Indicadores {
  const costoTotal = costoTotalCiclo(db, cicloId);
  const ingresos = ingresosCiclo(db, cicloId);
  const ganancia = round2(ingresos - costoTotal);
  const kgC = kgCosechados(db, cicloId);
  const kgM = kgMerma(db, cicloId, true);
  const kgV = kgVendidos(db, cicloId);
  const ventas = ventasActivas(db, cicloId);
  const porCobrar = round2(
    ventas.reduce((s, v) => s + Math.max(0, saldoVenta(db, v)), 0),
  );
  return {
    costoTotal,
    ingresos,
    ganancia,
    margenPct: ingresos > 0 ? round2((ganancia / ingresos) * 100) : null,
    roiPct: costoTotal > 0 ? round2((ganancia / costoTotal) * 100) : null,
    kgCosechados: kgC,
    kgMermaPoscosecha: kgM,
    mermaPct: kgC > 0 ? round2((kgM / kgC) * 100) : null,
    kgDisponibles: kgC - kgM - kgV,
    kgVendidos: kgV,
    costoPorKg: kgC > 0 ? round2(costoTotal / kgC) : null,
    precioPromedioKg: kgV > 0 ? round2(ingresos / kgV) : null,
    porCobrar,
  };
}

/* ---------- costo por categoría (gráfica) ---------- */

export function costoPorCategoria(db: DB, cicloId: string) {
  const gastos = gastosActivos(db, cicloId);
  const total = gastos.reduce((s, g) => s + g.totalPagado, 0);
  const mapa = new Map<string, { nombre: string; monto: number }>();
  for (const g of gastos) {
    const cat = db.categoriasGasto.find((c) => c.id === g.categoriaId);
    const nombre = cat?.parentId
      ? (db.categoriasGasto.find((c) => c.id === cat.parentId)?.nombre ?? cat?.nombre ?? "Otra")
      : (cat?.nombre ?? "Otra");
    const prev = mapa.get(nombre) ?? { nombre, monto: 0 };
    prev.monto += g.totalPagado;
    mapa.set(nombre, prev);
  }
  return [...mapa.values()]
    .map((x) => ({
      nombre: x.nombre,
      monto: round2(x.monto),
      porcentaje: total > 0 ? round2((x.monto / total) * 100) : 0,
    }))
    .sort((a, b) => b.monto - a.monto);
}

/* ---------- comparativo por parcela ---------- */

export function ciclosDeParcela(db: DB, parcelaId: string): Ciclo[] {
  return db.ciclos
    .filter((c) => c.parcelaId === parcelaId)
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
}

export function comparativoParcela(db: DB, parcelaId: string) {
  return ciclosDeParcela(db, parcelaId)
    .filter((c) => c.estado !== "CANCELADO" && c.estado !== "PLANIFICADO")
    .map((c) => {
      const ind = indicadoresCiclo(db, c.id);
      return {
        ciclo: c,
        ganancia: ind.ganancia,
        costoPorKg: ind.costoPorKg ?? 0,
      };
    });
}

/* ---------- curva de producción ---------- */

export function curvaProduccion(db: DB, cicloId: string) {
  return db.cosechas
    .filter((c) => c.cicloId === cicloId && c.estado === "ACTIVA")
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((c) => {
      const u = db.unidades.find((x) => x.id === c.unidadId);
      return { fecha: c.fecha, kg: aKg(c.cantidad, u?.factorKg ?? 0), calidad: c.calidad };
    });
}

/* ---------- alertas del dominio (sección 2.14 / 5.15) ---------- */

export function generarAlertas(db: DB): AlertaGenerada[] {
  const alertas: AlertaGenerada[] = [];
  const hoy = hoyIso();
  const plan = db.planes.find((p) => p.id === db.empresa.planId);

  for (const c of db.ciclos) {
    if (c.estado !== "ACTIVO" && c.estado !== "SUSPENDIDO" && c.estado !== "FINALIZADO") continue;
    const ind = indicadoresCiclo(db, c.id);
    const etiqueta = c.nombre;

    if (ind.ganancia < 0 && ind.ingresos > 0) {
      alertas.push({
        id: `al-perdida-${c.id}`,
        tipo: "Ciclo en pérdida",
        severidad: "ALTA",
        mensaje: `${etiqueta}: la ganancia es ${ind.ganancia.toLocaleString("es-MX", { style: "currency", currency: "MXN" })} con ventas registradas.`,
        cicloId: c.id,
        enlace: `/ciclos/${c.id}`,
      });
    }

    if (
      ind.costoPorKg != null &&
      ind.precioPromedioKg != null &&
      ind.costoPorKg > ind.precioPromedioKg
    ) {
      alertas.push({
        id: `al-costopk-${c.id}`,
        tipo: "Costo por kg sobre el precio promedio",
        severidad: "ALTA",
        mensaje: `${etiqueta}: el costo por kg ($${ind.costoPorKg.toFixed(2)}) supera el precio promedio de venta ($${ind.precioPromedioKg.toFixed(2)}).`,
        cicloId: c.id,
        enlace: `/ciclos/${c.id}`,
      });
    }

    if (ind.mermaPct != null && ind.mermaPct > 10) {
      alertas.push({
        id: `al-merma-${c.id}`,
        tipo: "Merma elevada",
        severidad: "MEDIA",
        mensaje: `${etiqueta}: la merma poscosecha es ${ind.mermaPct.toFixed(2)} % de lo cosechado.`,
        cicloId: c.id,
        enlace: `/ciclos/${c.id}`,
      });
    }

    const cats = costoPorCategoria(db, c.id);
    const dom = cats[0];
    if (dom && dom.porcentaje > 40) {
      alertas.push({
        id: `al-cat-${c.id}`,
        tipo: "Categoría dominante",
        severidad: "MEDIA",
        mensaje: `${etiqueta}: ${dom.nombre} concentra ${dom.porcentaje.toFixed(2)} % del costo del ciclo.`,
        cicloId: c.id,
        enlace: `/ciclos/${c.id}`,
      });
    }

    const anteriores = ciclosDeParcela(db, c.parcelaId).filter(
      (x) => x.fechaInicio < c.fechaInicio && x.estado === "FINALIZADO",
    );
    const prev = anteriores[anteriores.length - 1];
    if (prev && ind.costoPorKg != null) {
      const prevPk = indicadoresCiclo(db, prev.id).costoPorKg;
      if (prevPk != null && prevPk > 0 && ind.costoPorKg > prevPk * 1.15) {
        alertas.push({
          id: `al-creciente-${c.id}`,
          tipo: "Costo creciente",
          severidad: "MEDIA",
          mensaje: `${etiqueta}: el costo por kg subió más de 15 % frente al ciclo anterior (${prev.nombre}).`,
          cicloId: c.id,
          enlace: `/ciclos/${c.id}`,
        });
      }
    }

    if (c.estado === "FINALIZADO" && c.metaKg && ind.kgCosechados < c.metaKg * 0.8) {
      alertas.push({
        id: `al-rend-${c.id}`,
        tipo: "Rendimiento bajo",
        severidad: "MEDIA",
        mensaje: `${etiqueta}: se cosecharon ${Math.round(ind.kgCosechados).toLocaleString("es-MX")} kg, menos del 80 % de la meta.`,
        cicloId: c.id,
        enlace: `/ciclos/${c.id}`,
      });
    }

    if (c.estado === "ACTIVO") {
      const ultima =
        db.actividades
          .filter((a) => a.cicloId === c.id)
          .sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.fecha ??
        gastosActivos(db, c.id).sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.fecha;
      if (!ultima || diasEntre(ultima, hoy) > 15) {
        alertas.push({
          id: `al-sincap-${c.id}`,
          tipo: "Ciclo sin captura",
          severidad: "BAJA",
          mensaje: `${etiqueta}: no tiene capturas recientes en 15 días.`,
          cicloId: c.id,
          enlace: `/ciclos/${c.id}`,
        });
      }
    }
  }

  for (const v of db.ventas) {
    if (estadoCobroVenta(db, v) === "VENCIDA") {
      const cliente = db.clientes.find((c) => c.id === v.clienteId)?.nombre ?? "Cliente";
      alertas.push({
        id: `al-venc-${v.id}`,
        tipo: "Cobro vencido",
        severidad: "ALTA",
        mensaje: `${cliente} (${v.numeroFactura ?? "sin factura"}): quedan ${saldoVenta(db, v).toLocaleString("es-MX", { style: "currency", currency: "MXN" })} por cobrar con fecha límite vencida.`,
        cicloId: v.cicloId,
        enlace: `/ventas/${v.id}`,
      });
    }
  }

  if (plan) {
    const parcelasUsadas = db.parcelas.filter((p) => p.activo).length;
    const usuarios = db.usuarios.filter((u) => u.activo).length;
    const usoPct = Math.max(
      (parcelasUsadas / plan.maxParcelas) * 100,
      (usuarios / plan.maxUsuarios) * 100,
    );
    if (usoPct >= 90) {
      alertas.push({
        id: "al-plan",
        tipo: "Cercanía al límite del plan",
        severidad: "INFORMATIVA",
        mensaje: `Plan ${plan.nombre}: ${parcelasUsadas}/${plan.maxParcelas} parcelas y ${usuarios}/${plan.maxUsuarios} usuarios en uso.`,
        cicloId: null,
        enlace: "/mas/empresa",
      });
    }
  }

  const orden: Record<Severidad, number> = { ALTA: 0, MEDIA: 1, BAJA: 2, INFORMATIVA: 3 };
  return alertas.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
}

/* ---------- utilidades de ciclos ---------- */

export function cicloAdmiteCaptura(c: Ciclo): boolean {
  return c.estado === "ACTIVO" || c.estado === "SUSPENDIDO" || c.estado === "PLANIFICADO";
}

export function etiquetaEstadoCiclo(estado: Ciclo["estado"]): string {
  return {
    PLANIFICADO: "Planificado",
    ACTIVO: "Activo",
    SUSPENDIDO: "Suspendido",
    FINALIZADO: "Finalizado",
    CANCELADO: "Cancelado",
  }[estado];
}

export function etiquetaEstadoCobro(e: EstadoCobroVenta): string {
  return {
    PENDIENTE: "Pendiente",
    PARCIAL: "Parcial",
    PAGADA: "Pagada",
    VENCIDA: "Vencida",
    CANCELADA: "Cancelada",
  }[e];
}

export function parcelaDeCiclo(db: DB, ciclo: Ciclo): Parcela | undefined {
  return db.parcelas.find((p) => p.id === ciclo.parcelaId);
}

export function etiquetaTipoCliente(t: string): string {
  return {
    MERCADO_MAYOREO: "Mercado de mayoreo",
    DISTRIBUIDOR: "Distribuidor",
    SUPERMERCADO: "Supermercado",
    RESTAURANTE: "Restaurante",
    EXPORTADOR: "Exportador",
    MENUDEO: "Menudeo",
    OTRO: "Otro",
  }[t] ?? t;
}

export function etiquetaMetodo(m: string): string {
  return {
    EFECTIVO: "Efectivo",
    TRANSFERENCIA: "Transferencia",
    CHEQUE: "Cheque",
    TARJETA: "Tarjeta",
    OTRO: "Otro",
  }[m] ?? m;
}
