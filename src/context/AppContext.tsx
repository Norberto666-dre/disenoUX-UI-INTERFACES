import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import seed from "../data/db.json";
import { PERMISOS_POR_ROL, type AlertaGenerada, type Permiso, type Sesion, type DB, type Usuario } from "../types";
import { cargarDB, guardarDB, reiniciarDB, registrarBitacora } from "../lib/db";
import { DURACION_TOAST, uid } from "../lib/format";
import { generarAlertas } from "../lib/calc";

export interface Toast {
  id: string;
  mensaje: string;
  tipo: "exito" | "error" | "info";
}

export type Tema = "claro" | "oscuro";

interface Ctx {
  db: DB;
  sesion: Sesion | null;
  usuario: Usuario | null;
  empresaVencida: boolean;
  puede: (p: Permiso) => boolean;
  iniciarSesion: (correo: string, password: string) => boolean;
  cerrarSesion: () => void;
  actualizar: (fn: (db: DB) => DB) => void;
  registrar: (accion: string, entidad: string, entidadId: string, anterior?: string | null, nuevo?: string | null) => void;
  reiniciarDatos: () => void;
  toasts: Toast[];
  notificar: (mensaje: string, tipo?: Toast["tipo"]) => void;
  descartarToast: (id: string) => void;
  alertas: AlertaGenerada[];
  alertasNoLeidas: number;
  marcarAlertasLeidas: () => void;
  tema: Tema;
  alternarTema: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

const SESION_KEY = "rentabilidad-agricola-sesion-v1";
const TEMA_KEY = "rentabilidad-agricola-tema";
const LEIDAS_KEY = "rentabilidad-agricola-alertas-leidas-v1";

function leerLeidas(): string[] {
  try {
    const raw = localStorage.getItem(LEIDAS_KEY);
    const v = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function leerSesion(): Sesion | null {
  try {
    const raw = localStorage.getItem(SESION_KEY);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}

function leerTema(): Tema {
  try {
    const guardado = localStorage.getItem(TEMA_KEY);
    if (guardado === "claro" || guardado === "oscuro") return guardado;
  } catch {
    /* sin persistencia se usa la preferencia del sistema */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => cargarDB());
  const [sesion, setSesion] = useState<Sesion | null>(() => leerSesion());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tema, setTema] = useState<Tema>(() => leerTema());
  const [leidas, setLeidas] = useState<string[]>(() => leerLeidas());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "oscuro");
    try {
      localStorage.setItem(TEMA_KEY, tema);
    } catch {
      /* modo privado: no se persiste */
    }
  }, [tema]);

  const alternarTema = useCallback(() => {
    setTema((t) => (t === "claro" ? "oscuro" : "claro"));
  }, []);

  const usuario = useMemo(
    () => (sesion ? (db.usuarios.find((u) => u.id === sesion.usuarioId) ?? null) : null),
    [db.usuarios, sesion],
  );

  const empresaVencida =
    db.empresa.estado === "VENCIDA" || db.empresa.estado === "CANCELADA";

  const actualizar = useCallback(
    (fn: (db: DB) => DB) => {
      setDb((prev) => {
        const next = fn(prev);
        guardarDB(next);
        return next;
      });
    },
    [],
  );

  const notificar = useCallback((mensaje: string, tipo: Toast["tipo"] = "exito") => {
    const id = uid("t");
    setToasts((t) => [...t, { id, mensaje, tipo }].slice(-3));
    window.setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      DURACION_TOAST[tipo],
    );
  }, []);

  const descartarToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  /* ---- alertas "en tiempo real": recalculan ante cada cambio de datos
         y cada 60 s (vencimientos dependen del reloj) ---- */
  useEffect(() => {
    const i = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(i);
  }, []);

  const alertas = useMemo(() => generarAlertas(db), [db, tick]);

  const alertasNoLeidas = useMemo(
    () => alertas.filter((a) => !leidas.includes(a.id)).length,
    [alertas, leidas],
  );

  const marcarAlertasLeidas = useCallback(() => {
    const ids = alertas.map((a) => a.id);
    setLeidas(ids);
    try {
      localStorage.setItem(LEIDAS_KEY, JSON.stringify(ids));
    } catch {
      /* modo privado: no se persiste */
    }
  }, [alertas]);

  /* avisos automáticos cuando aparece una alerta nueva (ALTA/MEDIA) */
  const alertasPrevias = useRef<string[] | null>(null);
  useEffect(() => {
    const actuales = alertas.map((a) => a.id);
    const anteriores = alertasPrevias.current;
    alertasPrevias.current = actuales;
    if (!anteriores) return;
    const veAlertas = sesion && PERMISOS_POR_ROL[sesion.rol].includes("reporte:ver");
    if (!veAlertas) return;
    const nuevas = alertas.filter(
      (a) =>
        !anteriores.includes(a.id) &&
        !leidas.includes(a.id) &&
        (a.severidad === "ALTA" || a.severidad === "MEDIA"),
    );
    nuevas.slice(0, 2).forEach((a) => {
      const texto = `${a.tipo}: ${a.mensaje}`;
      notificar(texto.length > 145 ? `${texto.slice(0, 145)}…` : texto, "info");
    });
  }, [alertas, sesion, leidas, notificar]);

  const registrar = useCallback(
    (
      accion: string,
      entidad: string,
      entidadId: string,
      anterior: string | null = null,
      nuevo: string | null = null,
    ) => {
      if (!sesion) return;
      setDb((prev) => {
        const next = registrarBitacora(prev, sesion.usuarioId, accion, entidad, entidadId, anterior, nuevo);
        guardarDB(next);
        return next;
      });
    },
    [sesion],
  );

  const iniciarSesion = useCallback(
    (correo: string, password: string) => {
      const u = db.usuarios.find(
        (x) => x.correo.toLowerCase() === correo.trim().toLowerCase() && x.activo,
      );
      if (!u || u.password !== password) return false;
      const s: Sesion = { usuarioId: u.id, rol: u.rol, empresaId: db.empresa.id };
      localStorage.setItem(SESION_KEY, JSON.stringify(s));
      setSesion(s);
      const ahora = new Date().toISOString().slice(0, 19);
      setDb((prev) => {
        const conAcceso: DB = {
          ...prev,
          usuarios: prev.usuarios.map((x) => (x.id === u.id ? { ...x, ultimoAcceso: ahora } : x)),
        };
        const next = registrarBitacora(conAcceso, u.id, "INICIO_SESION", "Sesion", "-", null, null);
        guardarDB(next);
        return next;
      });
      return true;
    },
    [db.empresa.id, db.usuarios],
  );

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(SESION_KEY);
    setSesion(null);
  }, []);

  const puede = useCallback(
    (p: Permiso) => (sesion ? PERMISOS_POR_ROL[sesion.rol].includes(p) : false),
    [sesion],
  );

  const reiniciarDatos = useCallback(() => {
    const dbNuevo = reiniciarDB();
    setDb(dbNuevo);
    notificar("Datos de ejemplo restaurados", "info");
  }, [notificar]);

  const value: Ctx = {
    db,
    sesion,
    usuario,
    empresaVencida,
    puede,
    iniciarSesion,
    cerrarSesion,
    actualizar,
    registrar,
    reiniciarDatos,
    toasts,
    notificar,
    descartarToast,
    alertas,
    alertasNoLeidas,
    marcarAlertasLeidas,
    tema,
    alternarTema,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp fuera de AppProvider");
  return ctx;
}

export { seed };
