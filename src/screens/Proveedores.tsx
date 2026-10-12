import { useState } from "react";
import { useApp } from "../context/AppContext";
import { uid } from "../lib/format";
import {
  Boton,
  Campo,
  EstadoVacio,
  HojaInferior,
  TituloPantalla,
} from "../components/ui";

export default function Proveedores() {
  const { db, puede, actualizar, registrar, notificar, empresaVencida } = useApp();
  const editar = puede("estructura:administrar") && !empresaVencida;
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");

  const guardar = () => {
    if (!nombre.trim()) {
      notificar("Captura el nombre del proveedor.", "error");
      return;
    }
    const id = uid("prv");
    actualizar((prev) => ({
      ...prev,
      proveedores: [
        ...prev.proveedores,
        {
          id,
          nombre: nombre.trim(),
          rfc: null,
          telefono: contacto.trim() || null,
          correo: null,
          direccion: null,
          activo: true,
        },
      ],
    }));
    registrar("CREAR", "Proveedor", id, null, nombre);
    notificar("Proveedor creado.");
    setNombre("");
    setContacto("");
    setAbierto(false);
  };

  const activos = db.proveedores.filter((p) => p.activo);

  return (
    <div className="pb-24">
      <TituloPantalla
        titulo="Proveedores"
        subtitulo={`${activos.length} activos`}
        acciones={editar ? <Boton onClick={() => setAbierto(true)}>+ Nuevo</Boton> : undefined}
      />
      {activos.length === 0 ? (
        <EstadoVacio mensaje="Sin proveedores registrados." icono="🚚" />
      ) : (
        <ul className="space-y-2">
          {activos.map((p) => {
            const gastos = db.gastos.filter((g) => g.proveedorId === p.id);
            return (
              <li key={p.id} className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 shadow-sm">
                <p className="font-semibold text-stone-900 dark:text-stone-100">{p.nombre}</p>
                <p className="text-sm text-stone-600 dark:text-stone-300">{p.telefono ?? p.correo ?? "Sin contacto"}</p>
                <p className="mt-1 text-xs font-semibold text-campo-700 dark:text-campo-300">{gastos.length} gasto(s)</p>
              </li>
            );
          })}
        </ul>
      )}
      <HojaInferior abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Nuevo proveedor">
        <div className="space-y-4 pb-2">
          <Campo etiqueta="Nombre" valor={nombre} onChange={setNombre} obligatorio />
          <Campo etiqueta="Contacto" valor={contacto} onChange={setContacto} placeholder="Teléfono o correo" />
          <Boton className="w-full" onClick={guardar}>Guardar proveedor</Boton>
        </div>
      </HojaInferior>
    </div>
  );
}
