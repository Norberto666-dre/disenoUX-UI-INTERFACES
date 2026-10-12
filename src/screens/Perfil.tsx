import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Campo, FilaDato, TituloPantalla, Boton, TemaInterruptor, HojaInferior } from "../components/ui";
import { PERMISOS_POR_ROL } from "../types";
import { uid } from "../lib/format";

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
  const { db, sesion, usuario, cerrarSesion, reiniciarDatos, actualizar, registrar, notificar } = useApp();
  const navegar = useNavigate();
  const [hojaAdmin, setHojaAdmin] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", apellido: "", correo: "", telefono: "", password: "", confirmar: "" });
  const [erroresAdmin, setErroresAdmin] = useState<Record<string, string>>({});
  if (!sesion || !usuario) return null;
  const empresa = db.empresa;
  const permisos = PERMISOS_POR_ROL[sesion.rol];
  const plan = db.planes.find((p) => p.id === empresa.planId);
  const espacio = plan ? db.usuarios.length >= plan.maxUsuarios : false;
  const esAdmin = sesion.rol === "ADMIN";

  const validarAdmin = () => {
    const e: Record<string, string> = {};
    if (!nuevo.nombre.trim()) e.nombre = "Captura el nombre.";
    if (!nuevo.apellido.trim()) e.apellido = "Captura el apellido.";
    if (!nuevo.correo.trim()) e.correo = "Captura el correo.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevo.correo.trim())) e.correo = "El correo no es válido.";
    else if (db.usuarios.some((u) => u.correo.toLowerCase() === nuevo.correo.trim().toLowerCase()))
      e.correo = "Ya existe una cuenta con ese correo.";
    if (nuevo.password.length < 6) e.password = "Usa al menos 6 caracteres.";
    if (nuevo.confirmar !== nuevo.password) e.confirmar = "Las contraseñas no coinciden.";
    setErroresAdmin(e);
    return Object.keys(e).length === 0;
  };

  const guardarAdmin = () => {
    if (!esAdmin) {
      notificar("Solo un administrador puede crear cuentas administradoras.", "error");
      return;
    }
    if (espacio) {
      notificar(`El plan ${plan?.nombre} ya alcanzó el máximo de ${plan?.maxUsuarios} usuarios.`, "error");
      return;
    }
    if (!validarAdmin()) return;
    const id = uid("u");
    actualizar((prev) => ({
      ...prev,
      usuarios: [
        ...prev.usuarios,
        {
          id,
          nombre: nuevo.nombre.trim(),
          apellido: nuevo.apellido.trim(),
          correo: nuevo.correo.trim().toLowerCase(),
          telefono: nuevo.telefono.trim() || "—",
          rol: "ADMIN" as const,
          password: nuevo.password,
          activo: true,
          creadoEn: new Date().toISOString().slice(0, 19),
          ultimoAcceso: null,
        },
      ],
    }));
    registrar("CREAR", "Usuario", id, null, `${nuevo.nombre.trim()} ${nuevo.apellido.trim()} — ADMIN`);
    notificar(`Administrador ${nuevo.nombre.trim()} registrado correctamente.`);
    setNuevo({ nombre: "", apellido: "", correo: "", telefono: "", password: "", confirmar: "" });
    setErroresAdmin({});
    setHojaAdmin(false);
  };

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

      {esAdmin && (
        <div className="mb-4 rounded-2xl border border-campo-300 dark:border-campo-700 bg-campo-50 dark:bg-campo-900/40 p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-campo-800 dark:text-campo-200">
            🔐 Cuentas administradoras
          </h2>
          <p className="mb-3 text-sm text-campo-700 dark:text-campo-300">
            Por seguridad, solo un administrador puede crear cuentas con rol administrador. Los
            usuarios comunes se registran desde la pantalla pública.
            {plan && ` Plan ${plan.nombre}: ${db.usuarios.length} de ${plan.maxUsuarios} usuarios.`}
          </p>
          <Boton className="w-full" onClick={() => setHojaAdmin(true)}>
            + Registrar administrador
          </Boton>
        </div>
      )}

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

      <HojaInferior abierto={hojaAdmin} onCerrar={() => setHojaAdmin(false)} titulo="Nuevo administrador">
        <div className="space-y-3 pb-4">
          <p className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            🔐 Esta cuenta tendrá control total de la empresa. Verifica el correo antes de guardar.
          </p>
          <div className="flex items-center justify-between rounded-xl bg-stone-100 dark:bg-stone-700 px-3 py-2 text-sm">
            <span className="text-stone-600 dark:text-stone-300">Rol asignado</span>
            <span className="rounded-full bg-campo-800 px-2.5 py-0.5 text-xs font-bold text-white">ADMIN</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Nombre" valor={nuevo.nombre} onChange={(v) => setNuevo((n) => ({ ...n, nombre: v }))} error={erroresAdmin.nombre} obligatorio />
            <Campo etiqueta="Apellido" valor={nuevo.apellido} onChange={(v) => setNuevo((n) => ({ ...n, apellido: v }))} error={erroresAdmin.apellido} obligatorio />
          </div>
          <Campo etiqueta="Correo" valor={nuevo.correo} onChange={(v) => setNuevo((n) => ({ ...n, correo: v }))} tipo="email" placeholder="admin@correo.com" error={erroresAdmin.correo} obligatorio />
          <Campo etiqueta="Teléfono" valor={nuevo.telefono} onChange={(v) => setNuevo((n) => ({ ...n, telefono: v }))} tipo="tel" placeholder="Opcional" />
          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Contraseña" valor={nuevo.password} onChange={(v) => setNuevo((n) => ({ ...n, password: v }))} tipo="password" autoComplete="new-password" error={erroresAdmin.password} obligatorio />
            <Campo etiqueta="Confirmar" valor={nuevo.confirmar} onChange={(v) => setNuevo((n) => ({ ...n, confirmar: v }))} tipo="password" autoComplete="new-password" error={erroresAdmin.confirmar} obligatorio />
          </div>
          <Boton className="w-full" onClick={guardarAdmin} disabled={espacio}>
            {espacio ? "Límite del plan alcanzado" : "Guardar administrador"}
          </Boton>
        </div>
      </HojaInferior>
    </div>
  );
}
