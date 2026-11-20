"""Corrector del Bloque A. Se lanza con:  docker compose run --rm corrector"""
import re

from base import con_espera, ejecutar, env_bien_guardado, leer_compose, leer_env, pedir


def comprobar(stack, n):
    puerto_wp, puerto_pma = 8100 + n, 8200 + n
    base_datos, usuario = "examen%d" % n, "alumno%d" % n
    wp, db, pma = stack["wordpress"], stack["db"], stack["phpmyadmin"]

    def wordpress_conecta():
        codigo, cuerpo = pedir("wordpress", "/wp-admin/install.php")
        return (codigo == 200 and "wp-" in cuerpo
                and "Error establishing a database connection" not in cuerpo
                and "select database" not in cuerpo)

    def phpmyadmin_entra_solo():
        codigo, cuerpo = pedir("phpmyadmin", "/")
        if codigo != 200 or "phpMyAdmin" not in cuerpo:
            return False
        if "input_username" in cuerpo or "pma_username" in cuerpo:
            return False                      # sigue pidiendo usuario y contraseña
        if re.search(r"Cannot log in|mysqli::real_connect|rejected the connection", cuerpo):
            return False                      # no consigue entrar en la base de datos
        return bool(re.search(r"logged_in[\"']?\s*:\s*true", cuerpo)) or "pma_navigation" in cuerpo

    def volumen_con_nombre(contenedor, destino):
        m = contenedor.montaje(destino)
        return (m is not None and m.get("Type") == "volume"
                and not re.fullmatch(r"[0-9a-f]{64}", m.get("Name", "")))

    def sin_contrasenas_en_el_compose():
        compose, env = leer_compose(), leer_env(".env")
        if not compose or not env:
            return False
        claves = set()
        for c in (wp, db, pma):
            for k, v in c.env.items():
                if k.endswith("PASSWORD") and "RANDOM" not in k and v:
                    claves.add(v)
        principal = db.env.get("MYSQL_PASSWORD", "")
        return (len(principal) >= 8 and principal in env.values()
                and all(c not in compose for c in claves))

    return [
        ("Los servicios wordpress, db y phpmyadmin están en marcha",
         lambda: stack.en_marcha("wordpress", "db", "phpmyadmin")),
        ("WordPress está publicado en tu puerto personal (%d)" % puerto_wp,
         lambda: wp.en_marcha and puerto_wp in wp.publicados(80)),
        ("phpMyAdmin está publicado en tu puerto personal (%d)" % puerto_pma,
         lambda: pma.en_marcha and puerto_pma in pma.publicados(80)),
        ("La base de datos se llama %s y su usuario %s" % (base_datos, usuario),
         lambda: db.env.get("MYSQL_DATABASE") == base_datos and db.env.get("MYSQL_USER") == usuario),
        ("WordPress conecta con la base de datos (muestra su instalador)",
         lambda: wp.en_marcha and db.en_marcha and con_espera(wordpress_conecta)),
        ("phpMyAdmin entra en la base de datos sin pedir usuario ni contraseña",
         lambda: pma.en_marcha and db.en_marcha and con_espera(phpmyadmin_entra_solo)),
        ("Los datos de WordPress y de MySQL están en volúmenes con nombre",
         lambda: volumen_con_nombre(wp, "/var/www/html") and volumen_con_nombre(db, "/var/lib/mysql")),
        ("wordpress y phpmyadmin arrancan después de db",
         lambda: "db" in wp.depende_de and "db" in pma.depende_de),
        ("El compose no contiene contraseñas: salen de .env (8 caracteres o más)",
         sin_contrasenas_en_el_compose),
        (".env está en .gitignore y hay un .env.template con las mismas variables",
         env_bien_guardado),
    ], None


if __name__ == "__main__":
    ejecutar("A", comprobar)
