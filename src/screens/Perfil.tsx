import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { FilaDato, TituloPantalla, Boton, TemaInterruptor } from "../components/ui";
import { PERMISOS_POR_ROL } from "../types";

const ETIQUETAS: Record<string, string> = {
  "tablero:ver": "Ver el tablero",
  "estructura:administrar": "Administrar predios, parcelas y catálogos",
  "estructura:ver": "Ver la estructura",
  "ciclo:crear": "Crear ciclos",
  "ciclo:cerrar": "Cerrar ciclos",
  "ciclo:reabrir": "Reabrir ciclos",
  "actividad:crear": "Registrar actividades",
  "gasto:crear": "Registrar gastos",
  "gasto:editar_todos": "Editar gastos de todos",
  "cosecha:crear": "Registrar cosechas",
  "merma:crear": "Registrar mermas",
  "venta:crear": "Registrar ventas",
  "venta:cancelar": "Cancelar ventas",
  "cobro:crear": "Registrar cobros",
  "tercero:administrar": "Administrar clientes y proveedores",
  "reporte:ver": "Ver reportes y alertas",
  "reporte:exportar": "Exportar reportes",
  "usuario:administrar": "Administrar usuarios",
  "empresa:administrar": "Administrar la empresa",
};

export default function Perfil() {
  const { db, sesion, usuario, cerrarSesion, reiniciarDatos } = useApp();
  const navegar = useNavigate();
  if (!sesion || !usuario) return null;
  const empresa = db.empresa;
  const permisos = PERMISOS_POR_ROL[sesion.rol];

  return (
    <div className="pb-28">
      <TituloPantalla titulo="Mi perfil" subtitulo={sesion.rol} />

      <div className="mb-4 flex items-center gap-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-campo-800 text-xl font-bold text-white">
          {usuario.nombre.slice(0, 1)}
        </div>
        <div>
          <p className="font-bold text-stone-900 dark:text-stone-100">
            {usuario.nombre} {usuario.apellido}
          </p>
          <p className="text-sm text-stone-600 dark:text-stone-300">{usuario.correo}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-campo-700 dark:text-campo-300">{sesion.rol}</p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Empresa</h2>
        <FilaDato etiqueta="Nombre" valor={empresa.nombre} />
        <FilaDato etiqueta="Plan" valor={db.planes.find((p) => p.id === empresa.planId)?.nombre ?? "—"} />
      </div>

      <div className="mb-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Mis permisos</h2>
        <ul className="space-y-1.5">
          {permisos.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
              <span className="text-campo-700 dark:text-campo-300">✓</span> {ETIQUETAS[p] ?? p}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Apariencia</h2>
        <TemaInterruptor />
      </div>

      <div className="mb-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Base de datos</h2>
        <p className="mb-3 text-sm text-stone-600 dark:text-stone-300">
          Los datos viven en <code className="rounded bg-stone-100 dark:bg-stone-800 px-1">db.json</code> y se guardan en
          el navegador (localStorage). Reiniciar restaura la semilla original.
        </p>
        <Boton
          variante="secundario"
          className="w-full"
          onClick={() => {
            if (window.confirm("¿Reiniciar los datos de demostración a la semilla original?")) {
              reiniciarDatos();
            }
          }}
        >
          Reiniciar datos de demostración
        </Boton>
      </div>

      <Boton variante="peligro" className="w-full" onClick={cerrarSesion}>
        Cerrar sesión
      </Boton>
      <button
        onClick={() => navegar("/registros")}
        className="mt-3 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-700 dark:text-stone-200 shadow-sm"
      >
        Ver mis registros
      </button>
    </div>
  );
}
