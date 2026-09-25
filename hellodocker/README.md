# 🐳 Hello Docker: WordPress + MySQL

Este repositorio contiene un fichero `docker-compose.yml` que define dos servicios: **WordPress** y **MySQL**.

## 🎯 Objetivos

1. **Afianzar el flujo de trabajo** que usaremos durante todo el curso y en los exámenes: *clonar → desplegar → publicar en GitHub*.
2. **Entender el formato de un fichero `docker-compose.yml`** y aprender a **añadir nuevos servicios**.

> [!TIP]
> Piensa en el `docker-compose.yml` como el **plano de un edificio**: cada servicio es una habitación (un contenedor), y el plano indica qué hay dentro (imagen), qué puertas dan a la calle (puertos) y dónde se guardan las cosas que no deben perderse (volúmenes). Con `docker compose up`, Docker construye el edificio siguiendo el plano.

---

## 🏄‍♀️ Parte 1 · Clonar, desplegar y publicar en GitHub

### 1. Clona este repositorio dentro de tu repositorio de la asignatura

Abre un terminal en la carpeta raíz de tu repositorio y ejecuta:

```bash
git clone https://github.com/CIFPZornotzaLHII/hellodocker
cd hellodocker
```

Debe quedarte esta estructura:

```text
mi-repositorio/
├── .git/
└── hellodocker/
    ├── .git/          ← esta es la que vamos a borrar
    ├── README.md
    └── docker-compose.yml
```

### 2. Elimina la carpeta `.git` de `hellodocker`

Así `hellodocker` deja de ser un repositorio independiente y pasa a formar parte del tuyo. Si no lo haces, Git lo trata como un repositorio anidado y **su contenido no se subirá a GitHub**.

> [!WARNING]
> Asegúrate de estar **dentro de `hellodocker`** si lo en la raíz, borrarás el historial de **tu** repositorio.


### 3. Levanta los servicios

```bash
docker compose up -d
```

Comprueba que funcionan:

- `docker ps` → deben aparecer los contenedores `wordpress` y `db` en marcha.
- Abre <http://localhost:8080> y completa la instalación de WordPress.

### 4. Publica en GitHub

Desde la raíz de tu repositorio.

```bash
git add --all
git commit -m "Añade hellodocker"
git push
```

Entra en GitHub y comprueba que la carpeta `hellodocker` aparece **con sus ficheros dentro**. Si ves la carpeta sin contenido o con un icono de flecha, no borraste bien el `.git`.

Tambien puedes usar la interfaza de vscode.

---

## 📄 Parte 2 · Entender el fichero `docker-compose.yml`

Explica en una o dos líneas qué significa cada uno de estos elementos. Escribe tus respuestas en la sección [✍️ Tus respuestas](#️-tus-respuestas) al final de este README.

| Elemento | Pregunta guía |
|---|---|
| `services` | ¿Qué es un servicio y cuántos hay en este fichero? |
| `image` | ¿De dónde sale la imagen? ¿Qué significa `:8.0` en `mysql:8.0`? |
| `restart` | ¿Qué hace `always`? |
| `ports` | En `8080:80`, ¿qué número es el de tu equipo y cuál el del contenedor? |
| `environment` | ¿Para qué sirven estas variables? |
| `volumes` (dentro del servicio) | ¿Qué carpeta del contenedor se guarda y dónde? |
| `volumes` (al final del fichero) | ¿Por qué se declaran también aquí? |

Responde además a estas dos preguntas en la sección [✍️ Tus respuestas](#️-tus-respuestas):

1. WordPress se conecta a la base de datos con `WORDPRESS_DB_HOST: db`. ¿Por qué basta con escribir `db`?
2. Si ejecutas `docker compose down` y después `docker compose up -d`, ¿sigue estando tu WordPress instalado? ¿Por qué?

---

## ➕ Parte 3 · Añadir un nuevo servicio: phpMyAdmin

phpMyAdmin es un cliente web para gestionar bases de datos MySQL desde el navegador. Lo añadiremos en dos fases.

> [!IMPORTANT]
> En YAML **los espacios importan**. El nuevo servicio va al mismo nivel que `wordpress` y `db` (2 espacios), dentro de `services:` y **antes** del bloque `volumes:` final.

### Fase 1 · Login manual

Añade este servicio al `docker-compose.yml`:

```yaml
  phpmyadmin:
    image: phpmyadmin
    restart: always
    ports:
      - 8081:80
    environment:
      PMA_ARBITRARY: '1'
    depends_on:
      - db
```

Aplica los cambios:

```bash
docker compose up -d
docker compose ps
```

Abre <http://localhost:8081>. Verás una pantalla de login con tres campos. Rellénalos con los datos que aparecen en el propio `docker-compose.yml`:

| Campo | Valor |
|---|---|
| Servidor | `db` |
| Usuario | *(búscalo en el servicio `db`)* |
| Contraseña | *(búscala en el servicio `db`)* |

Si todo va bien, verás la base de datos `exampledb` con las tablas de WordPress (`wp_posts`, `wp_users`…).

**Preguntas:** 
Responde en la sección [✍️ Tus respuestas](#️-tus-respuestas)
1. ¿Qué hace `depends_on`?
2. ¿Por qué el servidor es `db` y no `localhost`?

Sube los cambios:

```bash
git add .
git commit -m "Añade servicio phpmyadmin (login manual)"
git push
```

### Fase 2 · Login automático

Ahora configuraremos phpMyAdmin para que se conecte a la base de datos **sin pedir usuario ni contraseña**. Sustituye el bloque `environment` del servicio `phpmyadmin` por este:

```yaml
    environment:
      PMA_HOST: db
      PMA_USER: exampleuser
      PMA_PASSWORD: examplepass
```

El servicio completo queda así:

```yaml
  phpmyadmin:
    image: phpmyadmin
    restart: always
    ports:
      - 8081:80
    environment:
      PMA_HOST: db
      PMA_USER: exampleuser
      PMA_PASSWORD: examplepass
    depends_on:
      - db
```

Aplica los cambios y recarga <http://localhost:8081>: debes entrar directamente, sin pantalla de login.

```bash
docker compose up -d
```

**Preguntas:**
Responde en la sección [✍️ Tus respuestas](#️-tus-respuestas)

1. ¿Qué hace cada una de las tres variables `PMA_HOST`, `PMA_USER` y `PMA_PASSWORD`?
2. Al ejecutar `docker compose up -d`, ¿qué contenedores se han recreado y cuáles no? ¿Por qué?
3. El login automático es cómodo, pero **¿qué riesgo tiene?** ¿Lo usarías en un servidor de producción?

Sube los cambios:

```bash
git add .
git commit -m "phpmyadmin con login automático"
git push
```

---

## 🛠️ Si algo falla

- **Un contenedor no arranca:** `docker compose logs nombre-del-servicio`
- **Error de puerto ocupado:** otro programa está usando ese puerto. Para los contenedores anteriores con `docker compose down` o cambia el puerto de tu equipo.
- **Error al leer el YAML:** casi siempre es la indentación.

---

## ✅ Entrega

Entrega la **URL de tu repositorio de GitHub**. Antes de entregar, comprueba que:

- [ ] La carpeta `hellodocker` se ve en GitHub con sus ficheros.
- [ ] Este README tiene todas las respuestas de las partes 2 y 3.
- [ ] El `docker-compose.yml` incluye el servicio `phpmyadmin` con la configuración de la fase 2 y funciona.
- [ ] Hay al menos un commit por cada fase.

---

## ✍️ Tus respuestas

### Contenido del `docker-compose.yml`

Pega aquí el contenido final de tu `docker-compose.yml`:

```yaml

```

### Parte 2 · Elementos del fichero

| Elemento | Explicación |
|---|---|
| `services` | Define los contenedores individuales que componen la aplicación.|
| `image` |Especifica la imagen de Docker que se usará para crear el contenedor. |
| `restart` | Configura la política de reinicio automático del contenedor si falla o se apaga.|
| `ports` |Mapea los puertos del contenedor hacia los puertos de la máquina local (host). |
| `environment` | Define las variables de entorno que se inyectarán dentro del contenedor.|
| `volumes` (dentro del servicio) |Monta o asigna un volumen específico (o una ruta local) a un contenedor concreto, indicando el origen externo y el destino dentro del contenedor. |
| `volumes` (al final del fichero) | Declara y crea volúmenes nombrados a nivel global para que puedan ser compartidos y reutilizados por uno o más servicios del archivo.|

1. **¿Por qué basta con escribir `db`?**Porque Docker Compose crea una red interna automática donde el nombre de cada servicio (en este caso, db) funciona directamente como su nombre de dominio (hostname). Esto permite que el contenedor de WordPress se conecte a la base de datos usando solo esa palabra, sin necesidad de conocer su dirección IP.
2. **¿Sigue instalado WordPress tras `down` y `up`?**Sí, sigue instalado siempre que se utilicen volúmenes (volumes) para guardar los datos. El comando docker-compose down borra los contenedores, pero mantiene intactos los volúmenes de datos. Al levantar todo de nuevo con docker-compose up, WordPress lee los datos guardados y mantiene tu configuración e instalación intactas.Sí, sigue instalado siempre que se utilicen volúmenes (volumes) para guardar los datos. El comando docker-compose down borra los contenedores, pero mantiene intactos los volúmenes de datos. Al levantar todo de nuevo con docker-compose up, WordPress lee los datos guardados y mantiene tu configuración e instalación intactas.

### Parte 3 · Fase 1

1. **`depends_on`:**Establece el orden de arranque y parada de los servicios. Define las dependencias entre contenedores, asegurando que un servicio (como WordPress) no se inicie hasta que el servicio del que depende (como db) se esté ejecutando.
2. **¿Por qué `db` y no `localhost`?**Porque cada contenedor tiene su propio localhost aislado. Si desde el contenedor de WordPress intentas conectar a localhost, buscará la base de datos dentro de sí mismo y fallará. Usar db le indica a Docker que resuelva el nombre a través de su red interna para llegar al contenedor correcto.

### Parte 3 · Fase 2

1. **`PMA_HOST`, `PMA_USER`, `PMA_PASSWORD`:**Son variables de entorno de phpMyAdmin. PMA_HOST indica la dirección del servidor de base de datos (por ejemplo, db), mientras que PMA_USER y PMA_PASSWORD definen las credenciales para conectarse automáticamente a él.
2. **Contenedores recreados:**Ocurre cuando cambias la configuración en el archivo docker-compose.yml y ejecutas docker-compose up. Docker detecta las modificaciones y destruye el contenedor antiguo para crear uno nuevo con los nuevos parámetros, aplicando los cambios sin perder los volúmenes de datos asociados.
3. **Riesgo del login automático:** Radica en la falta de seguridad, ya que cualquier persona que acceda a la URL de phpMyAdmin entrará directamente a la base de datos con permisos totales sin necesidad de autenticarse. Además, las credenciales quedan expuestas en texto plano dentro del archivo de configuración.
