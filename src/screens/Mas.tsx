import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { TemaInterruptor, TituloPantalla } from "../components/ui";

interface Item {
  to: string;
  icono: string;
  texto: string;
  sub: string;
  solo?: ("ADMIN" | "CONTADOR" | "CAPTURISTA")[];
  soloPermiso?: Parameters<ReturnType<typeof useApp>["puede"]>[0];
}

const ITEMS: Item[] = [
  { to: "/ciclos", icono: "🌾", texto: "Ciclos", sub: "Crea y sigue cada ciclo de cultivo" },
  { to: "/gastos", icono: "🧾", texto: "Gastos", sub: "Todo lo capturado, con filtros" },
  { to: "/ventas", icono: "🛒", texto: "Ventas", sub: "Facturación y cobro", solo: ["ADMIN", "CONTADOR"] },
  { to: "/finanzas", icono: "💰", texto: "Finanzas", sub: "Cuentas por cobrar", solo: ["ADMIN", "CONTADOR"] },
  { to: "/predios", icono: "🗺", texto: "Predios y parcelas", sub: "Estructura del campo" },
  { to: "/clientes", icono: "🤝", texto: "Clientes", sub: "A quién le vendes", solo: ["ADMIN", "CONTADOR"] },
  { to: "/proveedores", icono: "🚚", texto: "Proveedores", sub: "A quién le compras" },
  { to: "/mas/empresa", icono: "🏢", texto: "Empresa", sub: "Datos del negocio y plan", soloPermiso: "empresa:administrar" },
  { to: "/perfil", icono: "👤", texto: "Mi perfil", sub: "Cuenta, permisos y datos demo" },
];

export default function Mas() {
  const { sesion, puede } = useApp();
  const navegar = useNavigate();

  const visibles = ITEMS.filter((i) => {
    if (i.solo && sesion && !i.solo.includes(sesion.rol)) return false;
    if (i.soloPermiso && !puede(i.soloPermiso)) return false;
    return true;
  });

  return (
    <div>
      <TituloPantalla titulo="Más" subtitulo="Toda la aplicación" />
      <div className="mb-3">
        <TemaInterruptor />
      </div>
      <ul className="space-y-2">
        <li>
          <button
            onClick={() => navegar("/mas/planes")}
            className="flex w-full items-center gap-3 rounded-2xl border border-campo-300 dark:border-campo-700 bg-campo-50 dark:bg-campo-900/50 px-4 py-3 text-left shadow-sm hover:bg-campo-100 dark:hover:bg-campo-900"
          >
            <span className="text-xl">💳</span>
            <span className="min-w-0">
              <span className="block font-semibold text-campo-900 dark:text-campo-100">Planes</span>
              <span className="block truncate text-sm text-campo-700 dark:text-campo-300">
                Funciones, límites y cambio de plan
              </span>
            </span>
            <span className="ml-auto text-campo-500 dark:text-campo-400">›</span>
          </button>
        </li>
        <li>
          <button
            onClick={() => navegar("/mas/ayuda")}
            className="flex w-full items-center gap-3 rounded-2xl border border-campo-300 dark:border-campo-700 bg-campo-50 dark:bg-campo-900/50 px-4 py-3 text-left shadow-sm hover:bg-campo-100 dark:hover:bg-campo-900"
          >
            <span className="text-xl">ℹ️</span>
            <span className="min-w-0">
              <span className="block font-semibold text-campo-900 dark:text-campo-100">Ayuda y leyendas</span>
              <span className="block truncate text-sm text-campo-700 dark:text-campo-300">
                Guía de cada función y qué significan los colores
              </span>
            </span>
            <span className="ml-auto text-campo-500 dark:text-campo-400">›</span>
          </button>
        </li>
        {visibles.map((i) => (
          <li key={i.to}>
            <button
              onClick={() => navegar(i.to)}
              className="flex w-full items-center gap-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 text-left shadow-sm hover:bg-campo-50 dark:hover:bg-campo-900/50"
            >
              <span className="text-xl">{i.icono}</span>
              <span className="min-w-0">
                <span className="block font-semibold text-stone-900 dark:text-stone-100">{i.texto}</span>
                <span className="block truncate text-sm text-stone-600 dark:text-stone-300">{i.sub}</span>
              </span>
              <span className="ml-auto text-stone-400 dark:text-stone-500">›</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
