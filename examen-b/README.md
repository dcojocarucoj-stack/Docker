# 🚦 Examen Docker · Bloque B — Monta tu reverse proxy

Esta vez no hay nada que arreglar: el `docker-compose.yml` solo trae el corrector.
Tienes que **escribir tú los servicios y la configuración de Nginx** para que todo el tráfico
entre por un único reverse proxy.

- [Reglas](#-reglas)
- [Antes de empezar](#-antes-de-empezar)
- [Tus datos personales](#-tus-datos-personales)
- [Qué tienes que montar](#-qué-tienes-que-montar)
- [Requisitos](#-requisitos-05-puntos-cada-uno)
- [El corrector](#-el-corrector)
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
   git clone https://github.com/CIFPZornotzaLHII/examen-docker-b examen-b
   ```

2. Borra la carpeta `.git` que viene dentro de `examen-b` (si no, se subirá como un repositorio
   anidado y **no se podrá corregir**):

   ```powershell
   Remove-Item -Recurse -Force examen-b\.git      # Windows (PowerShell)
   ```
   ```bash
   rm -rf examen-b/.git                            # Linux
   ```

3. Escribe **tu número de examen** (el mismo del bloque A) en `examen-b/alumno.txt`.
   Solo el número, sustituyendo el `0`.

4. Descarga las imágenes para no perder tiempo luego:

   ```bash
   docker pull python:3.12-alpine
   docker pull nginx:alpine
   docker pull httpd:2.4
   docker pull filebrowser/filebrowser:v2.23.0
   docker pull traefik/whoami
   ```

## 🪪 Tus datos personales

Salen de tu número de examen (**N**). Ejemplo para N = 7:

| Dato | Valor | Ejemplo (N = 7) |
|---|---|---|
| Puerto del proxy en tu equipo (`PUERTO_PROXY`) | `8300 + N` | `8307` |
| Tu nombre para el servicio `quien` | `alumnoN` | `alumno7` |
| Texto que debe aparecer en tu página | `ALUMNO-N` | `ALUMNO-7` |

## 🧱 Qué tienes que montar

Cuatro servicios, con estos nombres exactos:

| Servicio | Imagen | Para qué |
|---|---|---|
| `proxy` | `nginx:alpine` | El reverse proxy. Su configuración es `proxy/nginx.conf`, que dentro del contenedor va en `/etc/nginx/conf.d/default.conf` |
| `web` | `httpd:2.4` | Apache sirviendo tu página. Sus ficheros van en `/usr/local/apache2/htdocs` |
| `quien` | `traefik/whoami` | Responde con los datos de la petición que recibe. Lee tu nombre de la variable `WHOAMI_NAME` |
| `archivos` | `filebrowser/filebrowser:v2.23.0` | Gestor de archivos (usuario `admin`, contraseña `admin`). Trabaja sobre `/srv` |

Los tres últimos escuchan en el puerto 80 de su contenedor.

Así se tiene que entrar desde el navegador (con N = 7):

| Dirección | Qué se ve |
|---|---|
| `http://localhost:8307/` | Tu página, servida por `web` |
| `http://localhost:8307/quien/` | La respuesta de `quien` |
| `http://archivos.localhost:8307/` | Filebrowser |

## ✅ Requisitos (0,5 puntos cada uno)

1. Los servicios `proxy`, `web`, `quien` y `archivos` están en marcha.
2. `proxy` está publicado en tu puerto personal (dentro del contenedor, el 80).
3. `proxy` es **el único** servicio que publica puertos en tu equipo.
4. La portada del proxy (`/`) muestra **tu página**: un `index.html` hecho por ti que contiene
   tu texto personal (`ALUMNO-N`) y que sirve el servicio `web`.
5. La ruta `/quien/` del proxy llega al servicio `quien`, que responde con tu nombre personal
   (línea `Name: alumnoN`).
6. El proxy **quita el prefijo** `/quien` antes de pasarle la petición al servicio: si pides
   `/quien/hola`, a `quien` le tiene que llegar `/hola`.
7. El nombre `archivos.localhost` lleva a Filebrowser (virtual host). Con `localhost` se sigue
   viendo tu página, no Filebrowser.
8. `web` y `archivos` comparten la carpeta `./compartida` de este proyecto: lo que subas con
   Filebrowser aparece en la web. Ahí tiene que estar tu `index.html`.
9. El puerto personal no está escrito en `docker-compose.yml`: sale de un fichero `.env`, de
   la variable `PUERTO_PROXY`.
10. `.env` está en `.gitignore` (no se sube) y hay un `.env.template` con las mismas variables.

## 🤖 El corrector

Cuando tu stack esté levantado, comprueba cómo vas todas las veces que quieras:

```bash
docker compose run --rm corrector
```

Te dice **qué** requisitos se cumplen y cuáles no. No te dice por qué: averiguarlo es el examen.
Para eso tienes `docker compose ps`, `docker compose logs proxy` y el navegador.

**No toques** el servicio `corrector` del compose ni la carpeta `corrector/`. El profesor
corrige con su propia copia.

## 📤 Entrega

Desde la carpeta de tu repositorio:

```bash
git add --all
git commit -m "Examen bloque B"
git push
```

Comprueba en GitHub que la carpeta `examen-b` está subida, con tu `proxy/nginx.conf` y tu
`compartida/index.html` dentro. Subir el fichero `.env` al repositorio **resta 0,5 puntos**.
