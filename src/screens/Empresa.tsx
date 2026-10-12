import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { diasEntre, fecha, hoyIso } from "../lib/format";
import {
  AvisoSoloLectura,
  BarraGuardar,
  Boton,
  Campo,
  FilaDato,
  InsigniaEstado,
  TituloPantalla,
} from "../components/ui";

export default function Empresa() {
  const { db, puede, actualizar, registrar, notificar, empresaVencida } = useApp();
  const navegar = useNavigate();
  const empresa = db.empresa;
  const plan = db.planes.find((p) => p.id === empresa.planId);
  const editable = puede("empresa:administrar") && !empresaVencida;

  const [nombre, setNombre] = useState(empresa.nombre);
  const [razonSocial, setRazonSocial] = useState(empresa.razonSocial);
  const [rfc, setRfc] = useState(empresa.rfc);
  const [correo, setCorreo] = useState(empresa.correo);
  const [telefono, setTelefono] = useState(empresa.telefono);
  const [direccion, setDireccion] = useState(empresa.direccion);
  const [enviando, setEnviando] = useState(false);

  const diasRestantes =
    empresa.suscripcionVence !== null ? diasEntre(hoyIso(), empresa.suscripcionVence) : null;

  const usuarios = db.usuarios;
  const parcelas = db.parcelas.filter((p) => p.activo).length;

  const guardar = () => {
    if (!editable) return;
    if (!nombre.trim()) {
      notificar("El nombre no puede quedar vacío.", "error");
      return;
    }
    setEnviando(true);
    actualizar((prev) => ({
      ...prev,
      empresa: { ...prev.empresa, nombre: nombre.trim(), razonSocial: razonSocial.trim(), rfc: rfc.trim(), correo: correo.trim(), telefono: telefono.trim(), direccion: direccion.trim() },
    }));
    registrar("EDITAR", "Empresa", empresa.id, null, nombre);
    notificar("Empresa actualizada.");
    window.setTimeout(() => setEnviando(false), 400);
  };

  return (
    <div className="pb-56">
      <TituloPantalla
        titulo="Empresa"
        subtitulo={empresa.estado}
        acciones={<InsigniaEstado texto={empresa.estado} />}
        volver={() => navegar(-1)}
      />

      {empresaVencida && (
        <div className="mb-4">
          <AvisoSoloLectura
            texto={`Suscripción vencida el ${fecha(empresa.suscripcionVence ?? "")}. Consulta en modo solo lectura hasta renovar.`}
          />
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Plan</h2>
        <FilaDato etiqueta="Plan actual" valor={plan?.nombre ?? "—"} />
        <FilaDato etiqueta="Precio" valor={`$${plan?.precioMensual ?? 0} / mes`} />
        <FilaDato etiqueta="Parcelas" valor={`${parcelas} de ${plan?.maxParcelas ?? 0}`} />
        <FilaDato etiqueta="Usuarios" valor={`${usuarios.length} de ${plan?.maxUsuarios ?? 0}`} />
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

      <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Datos fiscales</h2>
        <div className="space-y-4">
          <Campo etiqueta="Nombre comercial" valor={nombre} onChange={setNombre} disabled={!editable} obligatorio />
          <Campo etiqueta="Razón social" valor={razonSocial} onChange={setRazonSocial} disabled={!editable} />
          <Campo etiqueta="RFC" valor={rfc} onChange={setRfc} disabled={!editable} />
          <Campo etiqueta="Correo" valor={correo} onChange={setCorreo} disabled={!editable} tipo="email" />
          <Campo etiqueta="Teléfono" valor={telefono} onChange={setTelefono} disabled={!editable} tipo="tel" />
          <Campo etiqueta="Dirección" valor={direccion} onChange={setDireccion} disabled={!editable} />
        </div>
        {!editable && (
          <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
            {empresaVencida
              ? "Modo solo lectura por suscripción vencida."
              : "Solo el administrador puede editar estos datos."}
          </p>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">Usuarios</h2>
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {usuarios.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {u.nombre} {u.apellido}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{u.correo}</p>
              </div>
              <span className="rounded-full bg-campo-100 dark:bg-campo-900/60 px-2.5 py-0.5 text-xs font-semibold text-campo-900 dark:text-campo-200">
                {u.rol}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">La gestión de altas/bajas de usuarios viene en una iteración posterior.</p>
      </div>

      <BarraGuardar>
        <Boton onClick={guardar} disabled={!editable || enviando}>
          {enviando ? "Guardando…" : "Guardar cambios"}
        </Boton>
      </BarraGuardar>
    </div>
  );
}
