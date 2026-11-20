# 🧯 Examen Docker · Bloque A — Arregla y despliega

Te han pasado el `docker-compose.yml` de un WordPress con su base de datos y phpMyAdmin.
**No arranca y está mal configurado.** Tu trabajo es dejarlo funcionando y cumpliendo los
requisitos de más abajo.

- [Reglas](#-reglas)
- [Antes de empezar](#-antes-de-empezar)
- [Tus datos personales](#-tus-datos-personales)
- [Requisitos](#-requisitos-05-puntos-cada-uno)
- [El corrector](#-el-corrector)
- [Avisos](#️-avisos)
- [Entrega](#-entrega)

## 📏 Reglas

- El examen es **individual**. Puedes usar internet y tus prácticas anteriores; no puedes
  comunicarte con otras personas ni pasar ficheros.
- Solo cuenta lo que esté **subido a tu repositorio** a la hora de cierre que indique el profesor.
- La corrección final la hace el profesor arrancando tu examen en su equipo con tu
  `.env.template`. Si con ese fichero no arranca, no puntúa.

## 🚀 Antes de empezar

1. Abre una terminal **dentro de la carpeta de tu repositorio de la asignatura** y copia el examen:

   ```bash
   git clone https://github.com/CIFPZornotzaLHII/examen-docker-a examen-a
   ```

2. Borra la carpeta `.git` que viene dentro de `examen-a` (si no, se subirá como un repositorio
   anidado y **no se podrá corregir**):

   ```powershell
   Remove-Item -Recurse -Force examen-a\.git      # Windows (PowerShell)
   ```
   ```bash
   rm -rf examen-a/.git                            # Linux
   ```

3. Escribe **tu número de examen** (te lo da el profesor) en el fichero `examen-a/alumno.txt`.
   Solo el número, sustituyendo el `0`.

4. Descarga la imagen del corrector para no perder tiempo luego:

   ```bash
   docker pull python:3.12-alpine
   ```

## 🪪 Tus datos personales

Salen de tu número de examen (**N**). Ejemplo para N = 7:

| Dato | Valor | Ejemplo (N = 7) |
|---|---|---|
| Puerto de WordPress en tu equipo | `8100 + N` | `8107` |
| Puerto de phpMyAdmin en tu equipo | `8200 + N` | `8207` |
| Nombre de la base de datos | `examenN` | `examen7` |
| Usuario de la base de datos | `alumnoN` | `alumno7` |
| Contraseña de la base de datos | la que tú quieras (8 caracteres o más) | — |

## ✅ Requisitos (0,5 puntos cada uno)

1. Los servicios `wordpress`, `db` y `phpmyadmin` están en marcha (no les cambies el nombre).
2. WordPress se abre en tu equipo en tu puerto personal de WordPress.
3. phpMyAdmin se abre en tu equipo en tu puerto personal de phpMyAdmin.
4. La base de datos y su usuario tienen tus nombres personales.
5. WordPress conecta con la base de datos: al abrirlo aparece su instalador, no un error.
   **No hace falta que instales WordPress.**
6. phpMyAdmin entra directamente en la base de datos, **sin pedir usuario ni contraseña**.
7. Los datos de WordPress (`/var/www/html`) y los de MySQL (`/var/lib/mysql`) se guardan en
   volúmenes con nombre.
8. `wordpress` y `phpmyadmin` arrancan después de `db`.
9. En `docker-compose.yml` no hay ninguna contraseña escrita: salen de un fichero `.env`.
10. `.env` está en `.gitignore` (no se sube) y hay un `.env.template` con las mismas variables
    y una contraseña de ejemplo que no sea la tuya.

## 🤖 El corrector

Cuando tu stack esté levantado, comprueba cómo vas todas las veces que quieras:

```bash
docker compose run --rm corrector
```

Te dice **qué** requisitos se cumplen y cuáles no. No te dice por qué: averiguarlo es el examen.
Para eso tienes `docker compose ps`, `docker compose logs`, el navegador y Docker Desktop.

## ⚠️ Avisos

- **No toques** el servicio `corrector` del compose ni la carpeta `corrector/`. El profesor
  corrige con su propia copia, así que cambiarlos solo sirve para engañarte a ti.
- MySQL solo lee el nombre de la base de datos, el usuario y la contraseña **la primera vez
  que arranca**. Si los cambias después, tendrás que borrar su volumen para que los vuelva
  a leer: `docker compose down -v`.

## 📤 Entrega

Desde la carpeta de tu repositorio:

```bash
git add --all
git commit -m "Examen bloque A"
git push
```

Comprueba en GitHub que la carpeta `examen-a` está subida con sus ficheros dentro.
Subir el fichero `.env` al repositorio **resta 0,5 puntos**.
