import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { diasEntre, fecha, hoyIso } from "../lib/format";
import { FilaDato, TituloPantalla } from "../components/ui";
import type { Plan } from "../types";

type Marca = "si" | "no";

interface FilaPlan {
  grupo: string;
  etiqueta: string;
  valores: [Marca | string, Marca | string, Marca | string];
}

const FILAS: FilaPlan[] = [
  { grupo: "Trabajo de campo", etiqueta: "Ciclos de cultivo (crear y cerrar)", valores: ["si", "si", "si"] },
  { grupo: "Trabajo de campo", etiqueta: "Capturas: actividad, gasto, cosecha y merma", valores: ["si", "si", "si"] },
  { grupo: "Trabajo de campo", etiqueta: "Predios, parcelas y catálogos", valores: ["si", "si", "si"] },
  { grupo: "Trabajo de campo", etiqueta: "Proveedores", valores: ["si", "si", "si"] },
  { grupo: "Trabajo de campo", etiqueta: "Reabrir ciclos cerrados", valores: ["no", "si", "si"] },
  { grupo: "Ventas y finanzas", etiqueta: "Ventas, cobros y clientes", valores: ["si", "si", "si"] },
  { grupo: "Ventas y finanzas", etiqueta: "Cancelar ventas", valores: ["si", "si", "si"] },
  { grupo: "Ventas y finanzas", etiqueta: "Cuentas por cobrar (Finanzas)", valores: ["si", "si", "si"] },
  { grupo: "Ventas y finanzas", etiqueta: "Editar gastos de otros usuarios", valores: ["no", "si", "si"] },
  { grupo: "Reportes y alertas", etiqueta: "Tablero con indicadores", valores: ["si", "si", "si"] },
  { grupo: "Reportes y alertas", etiqueta: "Alertas de la operación", valores: ["no", "si", "si"] },
  { grupo: "Reportes y alertas", etiqueta: "Exportar reportes (CSV)", valores: ["no", "no", "si"] },
  { grupo: "Gestión", etiqueta: "Alta de cuentas administradoras", valores: ["si", "si", "si"] },
  { grupo: "Gestión", etiqueta: "Datos de la empresa y cambio de plan", valores: ["si", "si", "si"] },
  { grupo: "Límites", etiqueta: "Parcelas activas", valores: ["3", "10", "30"] },
  { grupo: "Límites", etiqueta: "Usuarios", valores: ["2", "5", "15"] },
  { grupo: "Límites", etiqueta: "Precio por mes", valores: ["$299", "$599", "$999"] },
];

function Celda({ v }: { v: Marca | string }) {
  if (v === "si") return <span className="font-bold text-campo-700 dark:text-campo-300">✓</span>;
  if (v === "no") return <span className="font-bold text-stone-300 dark:text-stone-600">✗</span>;
  return <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-200">{v}</span>;
}

export default function Planes() {
  const { db, sesion } = useApp();
  const navegar = useNavigate();
  const empresa = db.empresa;
  const planActual = db.planes.find((p) => p.id === empresa.planId);
  const parcelas = db.parcelas.filter((p) => p.activo).length;
  const usuarios = db.usuarios.length;
  const diasRestantes =
    empresa.suscripcionVence !== null ? diasEntre(hoyIso(), empresa.suscripcionVence) : null;
  const esAdmin = sesion?.rol === "ADMIN";

  const agrupadas: { grupo: string; filas: FilaPlan[] }[] = [];
  for (const f of FILAS) {
    const ultima = agrupadas[agrupadas.length - 1];
    if (ultima && ultima.grupo === f.grupo) ultima.filas.push(f);
    else agrupadas.push({ grupo: f.grupo, filas: [f] });
  }

  return (
    <div className="pb-28">
      <TituloPantalla
        titulo="Planes"
        subtitulo="Funciones y límites de cada plan"
        volver={() => navegar(-1)}
      />

      <div className="mb-4 rounded-2xl border border-campo-300 dark:border-campo-700 bg-campo-50 dark:bg-campo-900/50 p-4 shadow-sm">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-campo-800 dark:text-campo-200">
            Tu plan actual
          </h2>
          <span className="rounded-full bg-campo-800 px-3 py-0.5 text-xs font-bold text-white">
            {planActual?.nombre ?? "—"}
          </span>
        </div>
        <FilaDato etiqueta="Precio" valor={`$${planActual?.precioMensual ?? 0} / mes`} />
        <FilaDato etiqueta="Parcelas" valor={`${parcelas} de ${planActual?.maxParcelas ?? 0} en uso`} />
        <FilaDato etiqueta="Usuarios" valor={`${usuarios} de ${planActual?.maxUsuarios ?? 0} en uso`} />
        <FilaDato
          etiqueta="Suscripción"
          valor={
            empresa.suscripcionVence === null
              ? "Sin fecha"
              : `${fecha(empresa.suscripcionVence)}${
                  diasRestantes !== null ? ` · ${diasRestantes} día(s) restante(s)` : ""
                }`
          }
        />
      </div>

      <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
        Las funciones disponibles combinan tu <strong>rol</strong> con tu <strong>plan</strong>: aquí
        se muestran las que tu plan habilita para cualquier rol.
      </p>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-800">
        <div className="grid grid-cols-[1fr_2.6rem_2.6rem_2.6rem] items-end gap-x-1 border-b border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700 dark:bg-stone-900/60">
          <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Función
          </span>
          {["Bás.", "Prod.", "Prof."].map((c, i) => (
            <span
              key={c}
              className={`text-center text-[11px] font-bold uppercase ${
                i === 1 ? "text-campo-800 dark:text-campo-200" : "text-stone-500 dark:text-stone-400"
              }`}
            >
              {c}
            </span>
          ))}
        </div>
        {agrupadas.map((g) => (
          <div key={g.grupo}>
            <div className="border-b border-stone-100 bg-stone-50/70 px-3 py-1.5 dark:border-stone-800 dark:bg-stone-900/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {g.grupo}
              </span>
            </div>
            {g.filas.map((f) => (
              <div
                key={f.etiqueta}
                className="grid grid-cols-[1fr_2.6rem_2.6rem_2.6rem] items-center gap-x-1 border-b border-stone-100 px-3 py-2 last:border-b-0 dark:border-stone-800"
              >
                <span className="pr-1 text-xs text-stone-700 dark:text-stone-200">{f.etiqueta}</span>
                {f.valores.map((v, i) => (
                  <span key={i} className="text-center">
                    <Celda v={v} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {db.planes.map((p: Plan) => {
          const esActual = p.id === empresa.planId;
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-4 shadow-sm ${
                esActual
                  ? "border-campo-400 bg-campo-50 dark:border-campo-700 dark:bg-campo-900/50"
                  : "border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800"
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="font-bold text-stone-900 dark:text-stone-100">{p.nombre}</h3>
                {esActual ? (
                  <span className="rounded-full bg-campo-800 px-3 py-0.5 text-xs font-bold text-white">
                    Tu plan
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                <strong className="text-lg text-stone-900 dark:text-stone-100">${p.precioMensual}</strong> / mes
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Hasta {p.maxParcelas} parcelas · {p.maxUsuarios} usuarios ·{" "}
                {p.incluyeReportes ? "reportes y alertas incluidos" : "sin reportes ni alertas"}
              </p>
            </div>
          );
        })}
      </div>

      {!esAdmin && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          Solo el administrador puede comprar o cambiar el plan. Pídele el cambio a tu administrador.
        </p>
      )}
    </div>
  );
}
