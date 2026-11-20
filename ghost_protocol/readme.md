# 🕵️‍♂️ OPERACIÓN: GHOST PROTOCOL (Versión Construcción Paso a Paso)

![alt text](image.png)

¡Agente\! Bienvenido a la **Operación: GHOST PROTOCOL**. Tu misión, si decides aceptarla, es reconstruir la infraestructura de servidores de *The Daily Leak*, un medio digital que ha sufrido un sabotaje interno.

**Misión:** Reconstruir la infraestructura de servidores de *The Daily Leak*.
**Nivel:** Principiante / Intermedio.
**Tiempo:** 120 minutos.

--- 

- [🕵️‍♂️ OPERACIÓN: GHOST PROTOCOL (Versión Construcción Paso a Paso)](#️️-operación-ghost-protocol-versión-construcción-paso-a-paso)
  - [🛠️ FASE 1: Los Cimientos (.env)](#️-fase-1-los-cimientos-env)
  - [🏗️ FASE 2: Levantando Servicios (Docker Compose)](#️-fase-2-levantando-servicios-docker-compose)
    - [🧩 Paso 2.1: El Gestor de Archivos (Uploader)](#-paso-21-el-gestor-de-archivos-uploader)
    - [🧩 Paso 2.2: El Navegador Seguro (Firefox)](#-paso-22-el-navegador-seguro-firefox)
    - [🧩 Paso 2.3: Las Herramientas de Oficina (Obsidian y LibreOffice)](#-paso-23-las-herramientas-de-oficina-obsidian-y-libreoffice)
    - [🧩 Paso 2.4: El Centro Multimedia (Jellyfin) y los Volúmenes](#-paso-24-el-centro-multimedia-jellyfin-y-los-volúmenes)
  - [🔗 FASE 3: La Conexión (El gran reto)](#-fase-3-la-conexión-el-gran-reto)
  - [🎬 FASE 5: Ejecución de la Misión](#-fase-5-ejecución-de-la-misión)
  - [🎉 Misión Cumplida](#-misión-cumplida)

-----

## 🛠️ FASE 1: Los Cimientos (.env)

El primer error del anterior administrador fue escribir contraseñas y puertos directamente en el código. Nosotros usaremos variables.

**TUS ÓRDENES:**

1.  Crea un archivo llamado `.env`.
2.  Copia este contenido dentro. Estas son las coordenadas seguras de nuestra misión:

<!-- end list -->

```bash
# Identificadores de usuario (seguridad)
PUID=1000
PGID=1000
TZ=Europe/Madrid

# Carpeta donde se guardarán los datos reales
RUTA_BASE=./redaccion_data

# Puertos seguros (Cambiados para evitar ataques)
PORT_FILEBROWSER=8080
PORT_FIREFOX=5800
PORT_OBSIDIAN=3000
PORT_LIBREOFFICE=3001
PORT_JELLYFIN=8096
```

-----

## 🏗️ FASE 2: Levantando Servicios (Docker Compose)

Ahora crearemos el archivo `docker-compose.yml`. No lo haremos todo de golpe. Iremos servicio por servicio para detectar los sabotajes (errores) que dejó el traidor.

Crea el archivo `docker-compose.yml` en la misma carpeta y empieza copiando esto:

```yaml
version: "3.8"

services:
```

### 🧩 Paso 2.1: El Gestor de Archivos (Uploader)

Copia y pega este bloque debajo de `services:`.

**⚠️ EL SABOTAJE:** El puerto está "hardcodeado" (fijo) en 80, lo cual es muy inseguro y chocará con tu sistema.

```yaml
  uploader:
    image: filebrowser/filebrowser:v2.23.0
    container_name: uploader
    volumes:
      - ${RUTA_BASE}:/srv
    ports:
      - "80:80"   # <--- ¡ERROR AQUÍ!
    restart: unless-stopped
    
```

> **🔧 TU TAREA:** Borra `"80:80"` y cámbialo para que use la variable del puerto de Filebrowser que definiste en el archivo `.env`. Debería quedar algo como `"${NOMBRE_VARIABLE}:80"`.

Prueba el servicio con `docker compose up -d` y accede a `http://localhost:8080` (o el puerto que hayas puesto). Deberías ver la interfaz de Filebrowser. Prueba a subir un archivo para asegurarte de que funciona y ver donde se guarda en el sistema de archivos.

:octocat: Haz un commit de tus cambios con el mensaje: `Paso 2.1 completado: Uploader configurado correctamente`.

-----

### 🧩 Paso 2.2: El Navegador Seguro (Firefox)

Añade este bloque a continuación (cuidado con la alineación).

**⚠️ EL SABOTAJE:** El nombre de la imagen está incompleto. Docker no sabrá qué descargar.

```yaml
  firefox:
    image: jlesage/firefox-gui   # <--- ¡ERROR AQUÍ! Falta algo al final...
    ports:
      - "${PORT_FIREFOX}:5800"
      
```

> **🔧 TU TAREA:** Busca en Google "docker hub jlesage firefox gui" y averigua qué etiqueta (tag) suele ir al final del nombre de la imagen (pista: suele ser `:latest` o una versión numérica). Añádela.

> Prueba el servicio con `docker compose up -d` y accede a `http://localhost:5800` (o el puerto que hayas puesto). Deberías ver Firefox funcionando en tu navegador.

:octocat: Haz un commit de tus cambios con el mensaje: `Paso 2.2 completado: Firefox configurado correctamente`.

-----

### 🧩 Paso 2.3: Las Herramientas de Oficina (Obsidian y LibreOffice)

Añade estos dos bloques.

**⚠️ EL SABOTAJE:** Hay dos errores aquí.

1.  **Sintaxis:** Alguien ha puesto demasiados espacios (indentación) en el nombre del contenedor de Obsidian.
2.  **Lógica:** ¡LibreOffice está intentando usar el mismo puerto que Obsidian\!

<!-- end list -->

```yaml
  obsidian:
    image: lscr.io/linuxserver/obsidian:latest
      container_name: obsidian   # <--- ¡ERROR DE ESCRITURA! Demasiados espacios a la izquierda
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=Etc/UTC
    ports:
      - "${PORT_OBSIDIAN}:3000"
      - "3001:3001"
    shm_size: "1gb"
    restart: unless-stopped

  libreoffice:
    image: lscr.io/linuxserver/libreoffice:latest
    container_name: libreoffice
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=Etc/UTC
    ports:
      - "${PORT_OBSIDIAN}:3000" # <--- ¡ERROR LÓGICO! Este puerto ya está ocupado arriba
      - "3001:3001"
    shm_size: "1gb"
    restart: unless-stopped
```

> **🔧 TU TAREA:**
>
> 1.  Corrige los espacios en la línea `container_name` de Obsidian.
> 2.  Cambia el puerto de LibreOffice para que use su propia variable (`PORT_LIBREOFFICE`) en lugar de robarle el puerto a Obsidian.

Prueba ambos servicios con `docker compose up -d` y accede a `http://localhost:3000` para Obsidian y `http://localhost:3001` para LibreOffice (o los puertos que hayas puesto). Deberías ver ambas aplicaciones funcionando.

No configures nada dentro de Obsidian o LibreOffice todavía; solo asegúrate de que cargan correctamente.

:octocat: Haz un commit de tus cambios con el mensaje: `Paso 2.3 completado: Obsidian y LibreOffice configurados correctamente`.

-----

### 🧩 Paso 2.4: El Centro Multimedia (Jellyfin) y los Volúmenes

Finalmente, añade el último servicio.

```yaml
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    ports:
      - "${PORT_JELLYFIN}:8096"
    environment:
      - TZ=Etc/UTC
    volumes:
      - ./jellyfin_config:/config
    restart: unless-stopped

```

:octocat: Haz un commit de tus cambios con el mensaje: `Paso 2.4 completado: Jellyfin configurado correctamente`.

## 🔗 FASE 3: La Conexión (El gran reto)

Ahora mismo, cada contenedor es una isla. Si descargas algo en Firefox, Jellyfin no lo ve. Tu misión es conectar todos a una carpeta común.

**TUS ÓRDENES:**

1.  Crea una carpeta llamada `redaccion_data` dentro de tu carpeta `GHOST` (si no se ha creado sola).
2.  Edita tu `docker-compose.yml`. Tienes que añadir una línea extra en la sección `volumes:` de **CADA** servicio (uploader, firefox, obsidian, libreoffice, jellyfin).

La línea debe seguir este esquema:
`- ${RUTA_BASE}:/ruta_interna_del_contenedor`

Usa esta "Chuleta de Rutas Internas" para saber qué poner a la derecha de los dos puntos `:` en cada servicio:

  * **Para Firefox:** `/config/downloads`
  * **Para Jellyfin:** `/media`
  * **Para Obsidian y LibreOffice:** `/config/redaccion_data`
  * **Para Uploader:** `/srv` (Esta ya venía puesta, revísala).

> **💡 Pista:** Al final, el servicio de Firefox (por ejemplo) debería tener dos líneas en volúmenes. La de configuración (que ya estaba) y la nueva que tú has puesto.

Cuando termines, aplica los cambios:
`docker compose up -d`


:octocat: Haz un commit de tus cambios con el mensaje: `Paso 3 completado: Volúmenes conectados correctamente`.

-----

## 🎬 FASE 5: Ejecución de la Misión

Si has conectado todo bien, sigue estos pasos para superar la práctica:

1.  **Descarga:** Abre Firefox (`http://localhost:5800`), busca una imagen de "Top Secret" en Google y guárdala en `/config/downloads`.
2.  **Verificación:** Abre el Uploader (`http://localhost:8080`). ¿Ves la imagen ahí? Si es así, **¡los volúmenes funcionan\!**
3.  **Edición:** Abre LibreOffice (`http://localhost:3001`), crea un documento de texto, escribe "MISIÓN CUMPLIDA" e intenta insertar la imagen que descargaste (búscala en `/config/redaccion_data`).
4.  **Guardado:** Guarda el documento como `INFORME_FINAL.odt`.

> **🏆 ENTREGA FINAL:**
> Sube una captura de pantalla donde se vea el **Uploader (Filebrowser)** mostrando el archivo `INFORME_FINAL.odt` que acabas de crear con LibreOffice. Esto demuestra que todos los sistemas están conectados.
> Sube una captura de pantalla de los contenedores corriendo en Docker Desktop.
> Sube los cambios de este repositorio.

--- 
:octocat: Haz un commit final con el mensaje: `Misión completada: Todos los servicios funcionando y conectados`.

## 🎉 Misión Cumplida
¡Felicidades, agente\! Has completado la Operación: GHOST PROTOCOL con éxito.

Recuerda borrar todos los contenedores y volúmenes creados para no dejar rastro de la misión:
`docker compose down -v`

¡Hasta la próxima misión\!

![alt text](image-1.png)