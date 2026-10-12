import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useApp } from "./context/AppContext";
import { AppShell } from "./layout/AppShell";
import type { Permiso, Rol } from "./types";

import Login from "./screens/Login";
import Registro from "./screens/Registro";
import Tablero from "./screens/Tablero";
import InicioCapturista from "./screens/InicioCapturista";
import ListaCiclos from "./screens/ListaCiclos";
import DetalleCiclo from "./screens/DetalleCiclo";
import FormCiclo from "./screens/FormCiclo";
import CerrarCiclo from "./screens/CerrarCiclo";
import FormActividad from "./screens/FormActividad";
import FormGasto from "./screens/FormGasto";
import ListaGastos from "./screens/ListaGastos";
import FormCosecha from "./screens/FormCosecha";
import FormMerma from "./screens/FormMerma";
import ListaVentas from "./screens/ListaVentas";
import FormVenta from "./screens/FormVenta";
import DetalleVenta from "./screens/DetalleVenta";
import FormCobro from "./screens/FormCobro";
import Alertas from "./screens/Alertas";
import Predios from "./screens/Predios";
import Clientes from "./screens/Clientes";
import Proveedores from "./screens/Proveedores";
import MisRegistros from "./screens/MisRegistros";
import Perfil from "./screens/Perfil";
import Mas from "./screens/Mas";
import Ayuda from "./screens/Ayuda";
import Planes from "./screens/Planes";
import Empresa from "./screens/Empresa";
import Finanzas from "./screens/Finanzas";

function Protegido({ children, roles, permiso }: { children: ReactNode; roles?: Rol[]; permiso?: Permiso }) {
  const { sesion, puede } = useApp();
  const loc = useLocation();
  if (!sesion) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (roles && !roles.includes(sesion.rol)) return <Navigate to="/acceso-denegado" replace />;
  if (permiso && !puede(permiso)) return <Navigate to="/acceso-denegado" replace />;
  return <AppShell>{children}</AppShell>;
}

function InicioPorRol() {
  const { sesion } = useApp();
  if (!sesion) return <Navigate to="/login" replace />;
  return <Navigate to={sesion.rol === "CAPTURISTA" ? "/inicio" : "/tablero"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/" element={<InicioPorRol />} />
      <Route path="/acceso-denegado" element={<Protegido><Denegado /></Protegido>} />

      <Route path="/tablero" element={<Protegido roles={["ADMIN", "CONTADOR"]} permiso="tablero:ver"><Tablero /></Protegido>} />
      <Route path="/inicio" element={<Protegido roles={["CAPTURISTA"]}><InicioCapturista /></Protegido>} />

      <Route path="/ciclos" element={<Protegido><ListaCiclos /></Protegido>} />
      <Route path="/ciclos/nuevo" element={<Protegido permiso="ciclo:crear"><FormCiclo /></Protegido>} />
      <Route path="/ciclos/:id" element={<Protegido><DetalleCiclo /></Protegido>} />
      <Route path="/ciclos/:id/cerrar" element={<Protegido permiso="ciclo:cerrar"><CerrarCiclo /></Protegido>} />

      <Route path="/capturas/actividad" element={<Protegido permiso="actividad:crear"><FormActividad /></Protegido>} />
      <Route path="/capturas/gasto" element={<Protegido permiso="gasto:crear"><FormGasto /></Protegido>} />
      <Route path="/capturas/cosecha" element={<Protegido permiso="cosecha:crear"><FormCosecha /></Protegido>} />
      <Route path="/capturas/merma" element={<Protegido permiso="merma:crear"><FormMerma /></Protegido>} />

      <Route path="/gastos" element={<Protegido><ListaGastos /></Protegido>} />
      <Route path="/ventas" element={<Protegido roles={["ADMIN", "CONTADOR"]}><ListaVentas /></Protegido>} />
      <Route path="/ventas/nueva" element={<Protegido permiso="venta:crear"><FormVenta /></Protegido>} />
      <Route path="/ventas/:id" element={<Protegido roles={["ADMIN", "CONTADOR"]}><DetalleVenta /></Protegido>} />
      <Route path="/cobros/nuevo" element={<Protegido permiso="cobro:crear"><FormCobro /></Protegido>} />
      <Route path="/finanzas" element={<Protegido roles={["ADMIN", "CONTADOR"]}><Finanzas /></Protegido>} />

      <Route path="/alertas" element={<Protegido roles={["ADMIN", "CONTADOR"]} permiso="reporte:ver"><Alertas /></Protegido>} />
      <Route path="/predios" element={<Protegido><Predios /></Protegido>} />
      <Route path="/clientes" element={<Protegido><Clientes /></Protegido>} />
      <Route path="/proveedores" element={<Protegido><Proveedores /></Protegido>} />
      <Route path="/registros" element={<Protegido roles={["CAPTURISTA"]}><MisRegistros /></Protegido>} />
      <Route path="/perfil" element={<Protegido><Perfil /></Protegido>} />
      <Route path="/mas" element={<Protegido><Mas /></Protegido>} />
      <Route path="/mas/ayuda" element={<Protegido><Ayuda /></Protegido>} />
      <Route path="/mas/planes" element={<Protegido><Planes /></Protegido>} />
      <Route path="/mas/empresa" element={<Protegido permiso="empresa:administrar"><Empresa /></Protegido>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Denegado() {
  const { sesion } = useApp();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="text-5xl">🚫</span>
      <h1 className="mt-4 text-lg font-bold text-stone-900">Acceso denegado</h1>
      <p className="mt-2 max-w-xs text-sm text-stone-600">
        Tu rol ({sesion?.rol}) no tiene permiso para esta sección. Si necesitas acceso, pídele a tu
        administrador.
      </p>
      <a href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-campo-800 px-5 text-sm font-semibold text-white">
        Volver al inicio
      </a>
    </div>
  );
}
