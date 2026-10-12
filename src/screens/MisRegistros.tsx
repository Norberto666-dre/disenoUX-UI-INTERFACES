import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { money } from "../lib/format";
import { EstadoVacio, InsigniaEstado, TituloPantalla } from "../components/ui";

interface Registro {
  id: string;
  tipo: string;
  etiqueta: string;
  detalle: string;
  fecha: string;
  monto: number | null;
  enlace: string;
}

export default function MisRegistros() {
  const { db, sesion, usuario } = useApp();
  const navegar = useNavigate();

  if (!sesion || !usuario) return null;

  const mios: Registro[] = [
    ...db.gastos
      .filter((g) => g.creadoPorId === sesion.usuarioId)
      .map((g) => {
        const cat = db.categoriasGasto.find((c) => c.id === g.categoriaId);
        const padre = cat?.parentId ? db.categoriasGasto.find((c) => c.id === cat.parentId) : null;
        return {
          id: g.id,
          tipo: "Gasto",
          etiqueta: padre ? `${padre.nombre} → ${cat?.nombre}` : (cat?.nombre ?? "Gasto"),
          detalle: g.descripcion,
          fecha: g.fecha,
          monto: g.totalPagado,
          enlace: `/gastos`,
        };
      }),
    ...db.cosechas
      .filter((c) => c.creadoPorId === sesion.usuarioId)
      .map((c) => {
        const u = db.unidades.find((x) => x.id === c.unidadId);
        return {
          id: c.id,
          tipo: "Cosecha",
          etiqueta: `${c.cantidad.toLocaleString("es-MX")} ${u?.abrev ?? ""}`,
          detalle: c.observaciones ?? `Calidad ${c.calidad}`,
          fecha: c.fecha,
          monto: null,
          enlace: `/ciclos/${c.cicloId}`,
        };
      }),
    ...db.mermas
      .filter((m) => m.creadoPorId === sesion.usuarioId)
      .map((m) => {
        const u = db.unidades.find((x) => x.id === m.unidadId);
        const motivo = db.motivosMerma.find((x) => x.id === m.motivoId);
        return {
          id: m.id,
          tipo: "Merma",
          etiqueta: `${m.cantidad.toLocaleString("es-MX")} ${u?.abrev ?? ""}`,
          detalle: `${motivo?.nombre ?? m.motivoId} · ${m.etapa}`,
          fecha: m.fecha,
          monto: null,
          enlace: `/ciclos/${m.cicloId}`,
        };
      }),
    ...db.ventas
      .filter((v) => v.creadoPorId === sesion.usuarioId)
      .map((v) => {
        const cliente = db.clientes.find((c) => c.id === v.clienteId);
        return {
          id: v.id,
          tipo: "Venta",
          etiqueta: v.numeroFactura ?? "Sin factura",
          detalle: cliente?.nombre ?? "Cliente",
          fecha: v.fecha,
          monto: v.totalFacturado,
          enlace: `/ventas/${v.id}`,
        };
      }),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div>
      <TituloPantalla titulo="Mis registros" subtitulo={`${usuario.nombre} ${usuario.apellido} · ${sesion.rol}`} />
      {mios.length === 0 ? (
        <EstadoVacio mensaje="Todavía no has registrado nada." icono="📝" />
      ) : (
        <ul className="space-y-2">
          {mios.map((r) => (
            <li key={`${r.tipo}-${r.id}`}>
              <button
                onClick={() => navegar(r.enlace)}
                className="flex w-full items-center justify-between rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 text-left shadow-sm hover:bg-campo-50 dark:hover:bg-campo-900/50"
              >
                <div className="min-w-0">
                  <InsigniaEstado texto={r.tipo} />
                  <p className="mt-1 truncate font-semibold text-stone-900 dark:text-stone-100">{r.etiqueta}</p>
                  <p className="truncate text-sm text-stone-600 dark:text-stone-300">{r.detalle}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{r.fecha}</p>
                </div>
                {r.monto !== null && <p className="shrink-0 font-bold text-stone-900 dark:text-stone-100">{money(r.monto)}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
