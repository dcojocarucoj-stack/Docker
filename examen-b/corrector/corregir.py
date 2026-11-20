"""Corrector del Bloque B. Se lanza con:  docker compose run --rm corrector"""
import re

from base import con_espera, ejecutar, env_bien_guardado, leer_compose, leer_env, pedir


def comprobar(stack, n):
    puerto = 8300 + n
    nombre, marca = "alumno%d" % n, "ALUMNO-%d" % n
    proxy, web, quien, archivos = stack["proxy"], stack["web"], stack["quien"], stack["archivos"]

    def tiene_marca(cuerpo):
        return bool(re.search(r"(?<![0-9A-Za-z])%s(?![0-9])" % re.escape(marca), cuerpo))

    def es_filebrowser(cuerpo):
        return bool(re.search(r"file ?browser", cuerpo, re.I))

    def portada():
        directo, por_proxy = pedir("web", "/")[1], pedir("proxy", "/", "localhost")[1]
        return tiene_marca(directo) and tiene_marca(por_proxy)

    def ruta_quien():
        cuerpo = pedir("proxy", "/quien/", "localhost")[1]
        return bool(re.search(r"^Name: %s\s*$" % re.escape(nombre), cuerpo, re.M))

    def quita_prefijo():
        cuerpo = pedir("proxy", "/quien/prueba-%d" % n, "localhost")[1]
        return bool(re.search(r"^GET /prueba-%d HTTP" % n, cuerpo, re.M))

    def virtual_host():
        por_nombre = pedir("proxy", "/", "archivos.localhost")[1]
        por_defecto = pedir("proxy", "/", "localhost")[1]
        return es_filebrowser(por_nombre) and not es_filebrowser(por_defecto)

    def carpeta_compartida():
        a, b = web.montaje("/usr/local/apache2/htdocs"), archivos.montaje("/srv")
        if not a or not b or a.get("Type") != "bind" or b.get("Type") != "bind":
            return False
        origen = re.split(r"[\\/]+", a.get("Source", "").rstrip("\\/"))[-1]
        return a.get("Source") == b.get("Source") and origen == "compartida"

    def puerto_desde_env():
        compose, env = leer_compose(), leer_env(".env") or {}
        return (bool(re.search(r"\$\{?PUERTO_PROXY\b", compose))
                and str(puerto) not in compose
                and env.get("PUERTO_PROXY") == str(puerto))

    arriba = lambda: stack.en_marcha("proxy", "web", "quien", "archivos")
    return [
        ("Los servicios proxy, web, quien y archivos están en marcha", arriba),
        ("proxy usa nginx:alpine y está publicado en tu puerto personal (%d)" % puerto,
         lambda: proxy.en_marcha and proxy.imagen.startswith("nginx")
         and puerto in proxy.publicados(80)),
        ("proxy es el único servicio que publica puertos en tu equipo",
         lambda: arriba() and bool(proxy.publicados())
         and not (web.publicados() or quien.publicados() or archivos.publicados())),
        ("La portada del proxy (/) muestra tu página, servida por web (httpd:2.4)",
         lambda: web.en_marcha and web.imagen.startswith("httpd:2.4") and con_espera(portada)),
        ("/quien/ llega al servicio quien (traefik/whoami) y responde con tu nombre (%s)" % nombre,
         lambda: quien.en_marcha and "whoami" in quien.imagen and con_espera(ruta_quien)),
        ("El proxy quita el prefijo /quien antes de pasar la petición al servicio",
         lambda: quien.en_marcha and con_espera(quita_prefijo)),
        ("El nombre archivos.localhost lleva a Filebrowser (v2.23.0) y localhost no",
         lambda: archivos.en_marcha and archivos.imagen == "filebrowser/filebrowser:v2.23.0"
         and con_espera(virtual_host)),
        ("web y archivos comparten la carpeta ./compartida en las rutas pedidas",
         carpeta_compartida),
        ("El puerto del proxy no está escrito en el compose: sale de .env",
         puerto_desde_env),
        (".env está en .gitignore y hay un .env.template con las mismas variables",
         env_bien_guardado),
    ], None


if __name__ == "__main__":
    ejecutar("B", comprobar)
