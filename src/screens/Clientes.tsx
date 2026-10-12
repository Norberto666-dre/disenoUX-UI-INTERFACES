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

export default function Clientes() {
  const { db, puede, actualizar, registrar, notificar, empresaVencida } = useApp();
  const editar = puede("estructura:administrar") && !empresaVencida;
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [rfc, setRfc] = useState("");

  const guardar = () => {
    if (!nombre.trim()) {
      notificar("Captura el nombre del cliente.", "error");
      return;
    }
    const id = uid("cli");
    actualizar((prev) => ({
      ...prev,
      clientes: [
        ...prev.clientes,
        {
          id,
          nombre: nombre.trim(),
          tipo: "OTRO" as const,
          rfc: rfc.trim() || null,
          telefono: null,
          correo: contacto.trim() || null,
          activo: true,
        },
      ],
    }));
    registrar("CREAR", "Cliente", id, null, nombre);
    notificar("Cliente creado.");
    setNombre("");
    setContacto("");
    setRfc("");
    setAbierto(false);
  };

  const activos = db.clientes.filter((c) => c.activo);

  return (
    <div className="pb-24">
      <TituloPantalla
        titulo="Clientes"
        subtitulo={`${activos.length} activos`}
        acciones={editar ? <Boton onClick={() => setAbierto(true)}>+ Nuevo</Boton> : undefined}
      />
      {activos.length === 0 ? (
        <EstadoVacio mensaje="Sin clientes registrados." icono="🤝" />
      ) : (
        <ul className="space-y-2">
          {activos.map((c) => {
            const ventas = db.ventas.filter((v) => v.clienteId === c.id);
            return (
              <li key={c.id} className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-3 shadow-sm">
                <p className="font-semibold text-stone-900 dark:text-stone-100">{c.nombre}</p>
                <p className="text-sm text-stone-600 dark:text-stone-300">{c.correo ?? c.telefono ?? "Sin contacto"}</p>
                {c.rfc && <p className="text-xs text-stone-500 dark:text-stone-400">RFC {c.rfc}</p>}
                <p className="mt-1 text-xs font-semibold text-campo-700 dark:text-campo-300">{ventas.length} venta(s)</p>
              </li>
            );
          })}
        </ul>
      )}
      <HojaInferior abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Nuevo cliente">
        <div className="space-y-4 pb-2">
          <Campo etiqueta="Nombre" valor={nombre} onChange={setNombre} obligatorio />
          <Campo etiqueta="Contacto (correo o teléfono)" valor={contacto} onChange={setContacto} placeholder="Teléfono o correo" />
          <Campo etiqueta="RFC" valor={rfc} onChange={setRfc} placeholder="Opcional" />
          <Boton className="w-full" onClick={guardar}>Guardar cliente</Boton>
        </div>
      </HojaInferior>
    </div>
  );
}
