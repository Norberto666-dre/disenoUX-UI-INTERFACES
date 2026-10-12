import { useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { HojaInferior } from "../components/ui";
import type { Rol } from "../types";

interface Tab {
  to: string;
  icono: string;
  texto: string;
}

const TABS: Record<Rol, Tab[]> = {
  ADMIN: [
    { to: "/tablero", icono: "📊", texto: "Inicio" },
    { to: "/ciclos", icono: "🌱", texto: "Ciclos" },
    { to: "/finanzas", icono: "💰", texto: "Finanzas" },
    { to: "/alertas", icono: "🔔", texto: "Alertas" },
    { to: "/mas", icono: "☰", texto: "Más" },
  ],
  CAPTURISTA: [
    { to: "/inicio", icono: "🏠", texto: "Inicio" },
    { to: "/registros", icono: "🗒", texto: "Registros" },
    { to: "/ciclos", icono: "🌱", texto: "Ciclos" },
    { to: "/perfil", icono: "👤", texto: "Perfil" },
  ],
  CONTADOR: [
    { to: "/tablero", icono: "📊", texto: "Inicio" },
    { to: "/gastos", icono: "🧾", texto: "Gastos" },
    { to: "/ventas", icono: "🛒", texto: "Ventas" },
    { to: "/alertas", icono: "🔔", texto: "Alertas" },
    { to: "/mas", icono: "☰", texto: "Más" },
  ],
};

const ACCIONES: Record<Rol, { to: string; icono: string; texto: string }[]> = {
  ADMIN: [
    { to: "/capturas/actividad", icono: "🧩", texto: "Actividad" },
    { to: "/capturas/gasto", icono: "🧾", texto: "Gasto" },
    { to: "/capturas/cosecha", icono: "🧺", texto: "Cosecha" },
    { to: "/capturas/merma", icono: "📉", texto: "Merma" },
    { to: "/ventas/nueva", icono: "🛒", texto: "Venta" },
    { to: "/cobros/nuevo", icono: "💵", texto: "Cobro" },
  ],
  CAPTURISTA: [],
  CONTADOR: [
    { to: "/capturas/gasto", icono: "🧾", texto: "Gasto" },
    { to: "/ventas/nueva", icono: "🛒", texto: "Venta" },
    { to: "/cobros/nuevo", icono: "💵", texto: "Cobro" },
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const { sesion, empresaVencida, toast } = useApp();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [hojaAcciones, setHojaAcciones] = useState(false);
  if (!sesion) return null;

  const tabs = TABS[sesion.rol];
  const acciones = ACCIONES[sesion.rol];
  const enFormulario =
    pathname.startsWith("/capturas/") ||
    pathname.endsWith("/nuevo") ||
    pathname.endsWith("/nueva") ||
    pathname.endsWith("/cerrar") ||
    pathname.endsWith("/ayuda") ||
    pathname.endsWith("/empresa");
  const mostrarFab = acciones.length > 0 && !enFormulario;

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-stone-100 dark:bg-stone-900 shadow-2xl">
      {empresaVencida && <AvisoBanda />}
      <main className="flex-1 px-4 pb-32 pt-[calc(env(safe-area-inset-top)+1rem)]">{children}</main>

      {mostrarFab && (
        <>
          <button
            onClick={() => setHojaAcciones(true)}
            aria-label="Nueva captura"
            className="fixed bottom-24 left-1/2 z-40 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-campo-800 text-3xl text-white shadow-lg transition hover:bg-campo-900 active:scale-95 md:absolute"
          >
            +
          </button>
          <HojaInferior
            abierto={hojaAcciones}
            onCerrar={() => setHojaAcciones(false)}
            titulo="Nueva captura"
          >
            <ul className="grid grid-cols-2 gap-3 pb-2">
              {acciones.map((a) => (
                <li key={a.to}>
                  <button
                    onClick={() => {
                      setHojaAcciones(false);
                      navegar(a.to);
                    }}
                    className="flex w-full flex-col items-center gap-2 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm hover:bg-campo-50 dark:hover:bg-campo-900/50"
                  >
                    <span className="text-2xl">{a.icono}</span>
                    <span className="text-sm font-semibold text-stone-800 dark:text-stone-100">{a.texto}</span>
                  </button>
                </li>
              ))}
            </ul>
          </HojaInferior>
        </>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 safe-bottom">
        <ul className="flex items-stretch">
          {tabs.map((t) => (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${
                    isActive ? "text-campo-800 dark:text-campo-200" : "text-stone-500 dark:text-stone-400 hover:text-stone-700"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`text-lg ${isActive ? "" : "opacity-70"}`}>{t.icono}</span>
                    <span>{t.texto}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {toast && (
        <div
          role="status"
          className={`fixed left-1/2 z-[60] w-[90%] max-w-md -translate-x-1/2 animate-fade-in rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg top-[calc(env(safe-area-inset-top)+1rem)] ${
            toast.tipo === "error"
              ? "bg-red-600"
              : toast.tipo === "info"
                ? "bg-stone-800"
                : "bg-campo-800"
          }`}
        >
          {toast.mensaje}
        </div>
      )}
    </div>
  );
}

function AvisoBanda() {
  return (
    <div className="sticky top-0 z-40 bg-amber-500 px-4 py-2 text-center text-sm font-bold text-amber-950 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
      🔒 Suscripción vencida: la app está en solo lectura
    </div>
  );
}
