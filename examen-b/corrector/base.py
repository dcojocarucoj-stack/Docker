"""Utilidades del corrector del examen. No hace falta tocar nada de esta carpeta.

El corrector habla con Docker por su socket (solo lee) y hace peticiones HTTP a los
servicios por la red interna del proyecto. Solo dice qué requisitos se cumplen.
"""
import http.client
import json
import os
import re
import socket
import sys
import time
from urllib.parse import quote

SOCKET_DOCKER = "/var/run/docker.sock"
CARPETA = os.environ.get("CARPETA", "/examen")
ESPERA = int(os.environ.get("ESPERA", "45"))
_INICIO = time.time()


class _ConexionUnix(http.client.HTTPConnection):
    def __init__(self):
        super().__init__("localhost", timeout=20)

    def connect(self):
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        s.settimeout(20)
        s.connect(SOCKET_DOCKER)
        self.sock = s


def docker(ruta):
    """GET a la API de Docker. Devuelve el JSON ya convertido."""
    con = _ConexionUnix()
    try:
        con.request("GET", ruta)
        r = con.getresponse()
        datos = r.read()
    finally:
        con.close()
    if r.status >= 400:
        raise RuntimeError("Docker respondió %s a %s" % (r.status, ruta))
    return json.loads(datos)


def _proyecto():
    p = os.environ.get("PROYECTO")
    if p:
        return p
    yo = docker("/containers/%s/json" % socket.gethostname())
    return yo["Config"]["Labels"]["com.docker.compose.project"]


class Contenedor:
    def __init__(self, datos):
        self.d = datos
        self.etiquetas = datos["Config"].get("Labels") or {}

    @property
    def en_marcha(self):
        e = self.d.get("State", {})
        return bool(e.get("Running")) and not e.get("Restarting")

    @property
    def imagen(self):
        return self.d["Config"].get("Image", "")

    @property
    def env(self):
        r = {}
        for linea in self.d["Config"].get("Env") or []:
            k, _, v = linea.partition("=")
            r[k] = v
        return r

    def publicados(self, interno=None):
        """Puertos del equipo en los que se publica el puerto interno (o todos)."""
        r = set()
        fuentes = [self.d.get("HostConfig", {}).get("PortBindings") or {},
                   self.d.get("NetworkSettings", {}).get("Ports") or {}]
        for f in fuentes:
            for clave, lista in f.items():
                if interno is not None and clave.split("/")[0] != str(interno):
                    continue
                for b in lista or []:
                    if b.get("HostPort"):
                        r.add(int(b["HostPort"]))
        return r

    def montaje(self, destino):
        for m in self.d.get("Mounts") or []:
            if m.get("Destination", "").rstrip("/") == destino.rstrip("/"):
                return m
        return None

    @property
    def reinicio(self):
        return (self.d.get("HostConfig", {}).get("RestartPolicy") or {}).get("Name", "")

    @property
    def depende_de(self):
        t = self.etiquetas.get("com.docker.compose.depends_on", "")
        return {x.split(":")[0] for x in t.split(",") if x}


class Stack:
    """Los contenedores del proyecto de Compose desde el que se lanza el corrector."""

    def __init__(self):
        self.proyecto = _proyecto()
        filtro = quote(json.dumps({"label": ["com.docker.compose.project=" + self.proyecto]}))
        self.servicios = {}
        for c in docker("/containers/json?all=1&filters=" + filtro):
            et = c.get("Labels") or {}
            if et.get("com.docker.compose.oneoff") == "True":
                continue
            nombre = et.get("com.docker.compose.service")
            if nombre and nombre not in self.servicios:
                self.servicios[nombre] = Contenedor(docker("/containers/%s/json" % c["Id"]))

    def __getitem__(self, nombre):
        return self.servicios.get(nombre)

    def en_marcha(self, *nombres):
        return all(self[n] is not None and self[n].en_marcha for n in nombres)


def pedir(host, ruta="/", nombre=None):
    """GET http://host/ruta por la red interna. Devuelve (codigo, cuerpo). (0, '') si no responde.

    nombre: si se indica, se pide con ese nombre de host (para probar virtual hosts).
    """
    try:
        con = http.client.HTTPConnection(host, 80, timeout=10)
        cabeceras = {"User-Agent": "corrector-examen"}
        if nombre:
            cabeceras["Host"] = nombre
        con.request("GET", ruta, headers=cabeceras)
        r = con.getresponse()
        cuerpo = r.read(600000).decode("utf-8", "replace")
        con.close()
        return r.status, cuerpo
    except Exception:
        return 0, ""


def con_espera(comprobacion):
    """Repite una comprobacion (algunos servicios tardan en arrancar) hasta agotar ESPERA."""
    while True:
        try:
            if comprobacion():
                return True
        except Exception:
            pass
        if time.time() - _INICIO > ESPERA:
            return False
        time.sleep(3)


def leer(nombre):
    try:
        with open(os.path.join(CARPETA, nombre), encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return None


def leer_compose():
    for n in ("docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml"):
        t = leer(n)
        if t is not None:
            return t
    return ""


def leer_env(nombre):
    """Variables de un fichero tipo .env -> diccionario (None si no existe)."""
    t = leer(nombre)
    if t is None:
        return None
    r = {}
    for linea in t.splitlines():
        linea = linea.strip()
        if not linea or linea.startswith("#") or "=" not in linea:
            continue
        k, _, v = linea.partition("=")
        r[k.strip()] = v.strip().strip('"').strip("'")
    return r


def env_bien_guardado():
    """.env ignorado por git y .env.template con las mismas variables."""
    ignorados = [l.strip().lstrip("/") for l in (leer(".gitignore") or "").splitlines()]
    real, plantilla = leer_env(".env"), leer_env(".env.template")
    return (".env" in ignorados and bool(real) and bool(plantilla)
            and set(real) == set(plantilla))


def numero_examen():
    t = (leer("alumno.txt") or "").strip()
    if not re.fullmatch(r"\d{1,2}", t) or not 1 <= int(t) <= 40:
        print("\n  Escribe tu número de examen (solo el número) en el fichero alumno.txt")
        print("  y vuelve a lanzar el corrector.\n")
        sys.exit(2)
    return int(t)


def informe(bloque, n, resultados, extra=None):
    """resultados: lista de (texto, cumple). Cada requisito vale 0,5. extra: (texto, cumple, puntos)."""
    raya = "=" * 74
    print("\n" + raya)
    print("  EXAMEN DOCKER - BLOQUE %s - alumno nº %d" % (bloque, n))
    print(raya)
    nota = 0.0
    for i, (texto, ok) in enumerate(resultados, 1):
        print("  [%s] %2d. %s" % (" OK  " if ok else "FALLA", i, texto))
        nota += 0.5 if ok else 0
    suma_extra = ""
    if extra:
        texto, ok, puntos = extra
        print("  [%s] EXTRA (+%g). %s" % (" OK  " if ok else "  -  ", puntos, texto))
        if ok:
            suma_extra = "  (+%g del extra)" % puntos
    print("-" * 74)
    print("  NOTA BLOQUE %s: %g / %g%s" % (bloque, nota, len(resultados) * 0.5, suma_extra))
    if extra and extra[1]:
        nota += extra[2]
    print("  El corrector solo dice QUÉ falla: averiguar POR QUÉ es parte del examen.")
    print("  Si acabas de arrancar el stack, espera un minuto y vuelve a lanzarlo.")
    print(raya + "\n")
    marcas = "".join("1" if ok else "0" for _, ok in resultados)
    if extra:
        marcas += "+" + ("1" if extra[1] else "0")
    print("RESULTADO;%s;%d;%g;%s" % (bloque, n, nota, marcas))


def ejecutar(bloque, comprobar):
    """Punto de entrada comun: prepara el stack, lanza las comprobaciones y saca el informe."""
    n = numero_examen()
    if not os.path.exists(SOCKET_DOCKER):
        print("\n  No encuentro el socket de Docker: no cambies el servicio 'corrector' del compose.\n")
        sys.exit(2)
    print("\n  Comprobando tu stack (puede tardar hasta un minuto)...")
    try:
        stack = Stack()
    except Exception as e:
        print("\n  No puedo hablar con Docker: %s\n" % e)
        sys.exit(2)
    resultados, extra = comprobar(stack, n)
    limpios = []
    for texto, prueba in resultados:
        try:
            ok = bool(prueba())
        except Exception:
            ok = False
        limpios.append((texto, ok))
    if extra:
        texto, prueba, puntos = extra
        try:
            ok = bool(prueba())
        except Exception:
            ok = False
        extra = (texto, ok, puntos)
    informe(bloque, n, limpios, extra)
