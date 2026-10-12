/* Verifica que la BD provisional (db.json) esté sincronizada con el modelo
   entidad-relación y con las reglas de negocio del MVP.
   Uso: npm run verificar  (o: node scripts/verificar-db.mjs) */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const db = JSON.parse(readFileSync(join(raiz, "src/data/db.json"), "utf8"));

const errores = [];
const avisos = [];
const err = (m) => errores.push(m);
const aviso = (m) => avisos.push(m);
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const ids = (arr) => new Set(arr.map((x) => x.id));
const existe = (set, id, contexto) => {
  if (id == null) return false;
  if (!set.has(id)) {
    err(`FK rota: ${contexto} referencia "${id}" que no existe`);
    return false;
  }
  return true;
};
const enSet = (val, permitidos, contexto) => {
  if (val != null && !permitidos.includes(val)) err(`Enum inválido en ${contexto}: "${val}"`);
};

/* ---------- 1. IDs únicos por colección ---------- */
const colecciones = Object.entries(db).filter(([, v]) => Array.isArray(v));
for (const [nombre, arr] of colecciones) {
  const vistos = new Set();
  for (const item of arr) {
    if (vistos.has(item.id)) err(`ID duplicado en ${nombre}: ${item.id}`);
    vistos.add(item.id);
  }
}

/* ---------- 2. Entidades del ERD presentes ---------- */
const requeridas = [
  "planes", "usuarios", "predios", "parcelas", "tiposSuelo", "cultivos", "variedades",
  "ciclos", "tiposActividad", "actividades", "categoriasGasto", "unidades", "gastos",
  "cosechas", "mermas", "motivosMerma", "clientes", "proveedores", "ventas",
  "detallesVenta", "cobros", "adjuntos", "bitacora",
];
for (const r of requeridas) if (!db[r]) err(`Falta la entidad "${r}" en db.json`);
if (!db.empresa) err("Falta la entidad empresa");

/* ---------- 3. Claves foráneas ---------- */
const S = {
  plan: ids(db.planes ?? []),
  usuario: ids(db.usuarios ?? []),
  predio: ids(db.predios ?? []),
  parcela: ids(db.parcelas ?? []),
  tipoSuelo: ids(db.tiposSuelo ?? []),
  cultivo: ids(db.cultivos ?? []),
  variedad: ids(db.variedades ?? []),
  ciclo: ids(db.ciclos ?? []),
  tipoActividad: ids(db.tiposActividad ?? []),
  actividad: ids(db.actividades ?? []),
  categoria: ids(db.categoriasGasto ?? []),
  unidad: ids(db.unidades ?? []),
  motivo: ids(db.motivosMerma ?? []),
  cliente: ids(db.clientes ?? []),
  proveedor: ids(db.proveedores ?? []),
  venta: ids(db.ventas ?? []),
  detalleVenta: ids(db.detallesVenta ?? []),
  cosecha: ids(db.cosechas ?? []),
};

existe(S.plan, db.empresa?.planId, "empresa.planId");
for (const u of db.usuarios ?? []) enSet(u.rol, ["ADMIN", "CAPTURISTA", "CONTADOR"], `usuario ${u.id} rol`);
for (const p of db.parcelas ?? []) {
  existe(S.predio, p.predioId, `parcela ${p.id}.predioId`);
  if (p.tipoSueloId) existe(S.tipoSuelo, p.tipoSueloId, `parcela ${p.id}.tipoSueloId`);
}
for (const v of db.variedades ?? []) existe(S.cultivo, v.cultivoId, `variedad ${v.id}.cultivoId`);
for (const c of db.ciclos ?? []) {
  existe(S.parcela, c.parcelaId, `ciclo ${c.id}.parcelaId`);
  existe(S.variedad, c.variedadId, `ciclo ${c.id}.variedadId`);
  if (c.empresaId !== db.empresa?.id) err(`ciclo ${c.id}.empresaId no coincide con la empresa`);
}
for (const a of db.actividades ?? []) {
  existe(S.ciclo, a.cicloId, `actividad ${a.id}.cicloId`);
  existe(S.tipoActividad, a.tipoActividadId, `actividad ${a.id}.tipoActividadId`);
  existe(S.usuario, a.creadoPorId, `actividad ${a.id}.creadoPorId`);
}
for (const g of db.gastos ?? []) {
  existe(S.ciclo, g.cicloId, `gasto ${g.id}.cicloId`);
  existe(S.categoria, g.categoriaId, `gasto ${g.id}.categoriaId`);
  existe(S.unidad, g.unidadId, `gasto ${g.id}.unidadId`);
  existe(S.usuario, g.creadoPorId, `gasto ${g.id}.creadoPorId`);
  if (g.proveedorId) existe(S.proveedor, g.proveedorId, `gasto ${g.id}.proveedorId`);
  if (g.actividadId) existe(S.actividad, g.actividadId, `gasto ${g.id}.actividadId`);
}
for (const c of db.cosechas ?? []) {
  existe(S.ciclo, c.cicloId, `cosecha ${c.id}.cicloId`);
  existe(S.unidad, c.unidadId, `cosecha ${c.id}.unidadId`);
  existe(S.usuario, c.creadoPorId, `cosecha ${c.id}.creadoPorId`);
}
for (const m of db.mermas ?? []) {
  existe(S.ciclo, m.cicloId, `merma ${m.id}.cicloId`);
  existe(S.motivo, m.motivoId, `merma ${m.id}.motivoId`);
  existe(S.unidad, m.unidadId, `merma ${m.id}.unidadId`);
  existe(S.usuario, m.creadoPorId, `merma ${m.id}.creadoPorId`);
  if (m.cosechaOrigenId) existe(S.cosecha, m.cosechaOrigenId, `merma ${m.id}.cosechaOrigenId`);
}
for (const v of db.ventas ?? []) {
  existe(S.ciclo, v.cicloId, `venta ${v.id}.cicloId`);
  existe(S.cliente, v.clienteId, `venta ${v.id}.clienteId`);
  existe(S.usuario, v.creadoPorId, `venta ${v.id}.creadoPorId`);
}
for (const d of db.detallesVenta ?? []) {
  existe(S.venta, d.ventaId, `detalle ${d.id}.ventaId`);
  existe(S.unidad, d.unidadId, `detalle ${d.id}.unidadId`);
}
for (const c of db.cobros ?? []) {
  existe(S.venta, c.ventaId, `cobro ${c.id}.ventaId`);
  existe(S.usuario, c.creadoPorId, `cobro ${c.id}.creadoPorId`);
}
for (const b of db.bitacora ?? []) {
  existe(S.usuario, b.usuarioId, `bitacora ${b.id}.usuarioId`);
  if (b.empresaId !== db.empresa?.id) err(`bitacora ${b.id}.empresaId no coincide`);
}
for (const c of db.categoriasGasto ?? []) {
  if (c.parentId && !S.categoria.has(c.parentId)) err(`categoria ${c.id}.parentId rota`);
}

/* ---------- 4. Enums del ERD ---------- */
for (const c of db.ciclos ?? [])
  enSet(c.estado, ["PLANIFICADO", "ACTIVO", "SUSPENDIDO", "FINALIZADO", "CANCELADO"], `ciclo ${c.id} estado`);
for (const v of db.ventas ?? []) enSet(v.estado, ["ACTIVA", "CANCELADA"], `venta ${v.id} estado`);
for (const c of db.cobros ?? []) enSet(c.metodo, ["EFECTIVO", "TRANSFERENCIA", "CHEQUE", "TARJETA", "OTRO"], `cobro ${c.id} metodo`);
for (const c of db.cosechas ?? []) enSet(c.calidad, ["EXTRA", "PRIMERA", "SEGUNDA", "TERCERA", "INDUSTRIAL"], `cosecha ${c.id} calidad`);
for (const m of db.mermas ?? []) enSet(m.etapa, ["CAMPO", "POSCOSECHA", "TRANSPORTE", "ALMACEN"], `merma ${m.id} etapa`);
for (const u of db.unidades ?? []) enSet(u.tipo, ["PESO", "VOLUMEN", "UNIDAD", "SUPERFICIE", "OTRO"], `unidad ${u.id} tipo`);
for (const cl of db.clientes ?? []) enSet(cl.tipo, ["MERCADO_MAYOREO", "DISTRIBUIDOR", "SUPERMERCADO", "RESTAURANTE", "EXPORTADOR", "MENUDEO", "OTRO"], `cliente ${cl.id} tipo`);

/* ---------- 5. RN-045 gasto: total ≈ cantidad × costo + impuesto (±$0.05) ---------- */
for (const g of db.gastos ?? []) {
  if (g.estado !== "ACTIVO") continue;
  const calc = round2(g.cantidad * g.costoUnitario + g.impuesto);
  if (Math.abs(g.totalPagado - calc) > 0.05)
    err(`RN-045 gasto ${g.id}: total ${g.totalPagado} ≠ calculado ${calc}`);
}

/* ---------- 6. RN-052 venta: total ≈ Σ renglones − descuento + impuesto ---------- */
for (const v of db.ventas ?? []) {
  if (v.estado !== "ACTIVA") continue;
  const renglones = (db.detallesVenta ?? []).filter((d) => d.ventaId === v.id);
  if (renglones.length === 0) { aviso(`venta ${v.id} sin renglones`); continue; }
  const suma = renglones.reduce((s, d) => s + d.cantidad * d.precioUnitario, 0);
  const calc = round2(suma - v.descuento + v.impuesto);
  if (Math.abs(v.totalFacturado - calc) > 0.05)
    err(`RN-052 venta ${v.id}: total ${v.totalFacturado} ≠ calculado ${calc}`);
}

/* ---------- 7. RN-054: cobros vigentes ≤ total facturado ---------- */
for (const v of db.ventas ?? []) {
  const cobrado = (db.cobros ?? [])
    .filter((c) => c.ventaId === v.id && c.estado === "ACTIVO")
    .reduce((s, c) => s + c.monto, 0);
  if (cobrado > v.totalFacturado + 0.05)
    err(`RN-054 venta ${v.id}: cobrado ${cobrado} > total ${v.totalFacturado}`);
}

/* ---------- 8. RN-032: merma poscosecha ≤ cosecha de origen ---------- */
const kgDe = (cantidad, unidadId) => {
  const u = (db.unidades ?? []).find((x) => x.id === unidadId);
  return u && u.factorKg > 0 ? cantidad * u.factorKg : 0;
};
for (const m of db.mermas ?? []) {
  if (!m.cosechaOrigenId || m.estado !== "ACTIVA") continue;
  const c = (db.cosechas ?? []).find((x) => x.id === m.cosechaOrigenId);
  if (!c) continue;
  if (kgDe(m.cantidad, m.unidadId) > kgDe(c.cantidad, c.unidadId) + 0.001)
    err(`RN-032 merma ${m.id}: kg de merma superan la cosecha ${c.id}`);
}

/* ---------- 9. UQ claveCicloActivo: un solo ciclo ACTIVO por parcela ---------- */
const activosPorParcela = new Map();
for (const c of db.ciclos ?? []) {
  if (c.estado !== "ACTIVO") continue;
  activosPorParcela.set(c.parcelaId, (activosPorParcela.get(c.parcelaId) ?? 0) + 1);
}
for (const [parcelaId, n] of activosPorParcela) {
  if (n > 1) err(`UQ claveCicloActivo: la parcela ${parcelaId} tiene ${n} ciclos ACTIVO`);
}

/* ---------- 10. Fechas coherentes ---------- */
for (const c of db.ciclos ?? []) {
  if (c.fechaFin && c.fechaFin < c.fechaInicio) err(`ciclo ${c.id}: fechaFin < fechaInicio`);
}
for (const g of db.gastos ?? []) {
  const ciclo = (db.ciclos ?? []).find((x) => x.id === g.cicloId);
  if (ciclo && g.fecha < ciclo.fechaInicio) aviso(`gasto ${g.id} es anterior al inicio de su ciclo`);
}

/* ---------- reporte ---------- */
console.log("── Verificación BD provisional ──");
console.log(`Colecciones: ${colecciones.length} · Reglas aplicadas: 10 grupos`);
for (const a of avisos) console.log(`  AVISO  ${a}`);
if (errores.length === 0) {
  console.log(`✓ Sin errores. ${avisos.length} aviso(s).`);
  process.exit(0);
} else {
  for (const e of errores) console.log(`  ERROR  ${e}`);
  console.log(`✗ ${errores.length} error(es), ${avisos.length} aviso(s).`);
  process.exit(1);
}
