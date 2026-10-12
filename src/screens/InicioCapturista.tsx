import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { nombreCultivo } from "../lib/calc";
import { diasEntre, hoyIso } from "../lib/format";
import { TituloPantalla } from "../components/ui";

const CAPTURAS = [
  { to: "/capturas/actividad", icono: "🧩", texto: "Actividad", color: "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900 text-sky-900 dark:text-sky-200" },
  { to: "/capturas/gasto", icono: "🧾", texto: "Gasto", color: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200" },
  { to: "/capturas/cosecha", icono: "🧺", texto: "Cosecha", color: "bg-campo-50 dark:bg-campo-900/40 border-campo-200 dark:border-campo-800 text-campo-900 dark:text-campo-200" },
  { to: "/capturas/merma", icono: "📉", texto: "Merma", color: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200" },
];

export default function InicioCapturista() {
  const { db, usuario } = useApp();
  const navegar = useNavigate();
  const activos = db.ciclos.filter((c) => c.estado === "ACTIVO" || c.estado === "SUSPENDIDO");

  return (
    <div>
      <TituloPantalla titulo={`Hola, ${usuario?.nombre}`} subtitulo="¿Qué pasó en el campo hoy?" />

      <section className="mb-5">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Ciclos activos
        </h2>
        {activos.length === 0 ? (
          <p className="rounded-2xl bg-white dark:bg-stone-800 px-4 py-3 text-sm text-stone-500 dark:text-stone-400 shadow-sm">
            No hay ciclos activos. Tu administrador debe iniciar un ciclo.
          </p>
        ) : (
          <ul className="space-y-2">
            {activos.map((c) => {
              const p = db.parcelas.find((x) => x.id === c.parcelaId);
              const v = db.variedades.find((x) => x.id === c.variedadId);
              const dias = diasEntre(c.fechaInicio, hoyIso());
              const cerrado = c.estado !== "ACTIVO" && c.estado !== "SUSPENDIDO";
              return (
                <li key={c.id}>
                  <button
                    onClick={() => navegar(`/ciclos/${c.id}`)}
                    className="flex w-full items-center justify-between rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 text-left shadow-sm hover:bg-campo-50 dark:hover:bg-campo-900/50"
                  >
                    <span>
                      <span className="block font-bold text-stone-900 dark:text-stone-100">{p?.nombre}</span>
                      <span className="block text-sm text-stone-600 dark:text-stone-300">
                        {nombreCultivo(db, c.variedadId)} {v?.nombre} · día {Math.max(dias, 0)}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-campo-800 dark:text-campo-200">
                      {cerrado ? "Cerrado" : "Ver →"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Registrar
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {CAPTURAS.map((c) => {
            const cicloAbierto = activos.some((x) => x.estado === "ACTIVO" || x.estado === "SUSPENDIDO");
            return (
              <button
                key={c.to}
                disabled={!cicloAbierto}
                onClick={() => navegar(c.to)}
                className={`flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${c.color}`}
              >
                <span className="text-3xl">{c.icono}</span>
                <span className="text-sm font-bold">+ {c.texto}</span>
              </button>
            );
          })}
        </div>
        {activos.length === 0 && (
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
            Necesitas un ciclo activo para registrar en campo.
          </p>
        )}
      </section>

      <button
        onClick={() => navegar("/registros")}
        className="mt-5 w-full rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 text-sm font-semibold text-stone-800 dark:text-stone-100 shadow-sm hover:bg-campo-50 dark:hover:bg-campo-900/50"
      >
        🗒 Mis registros
      </button>
    </div>
  );
}
