# 🕵️‍♂️ OPERACIÓN: GHOST PROTOCOL (Pausoz Pausoko Eraikuntza Bertsióa)

![alt text](image.png)

Agente\! Ongi etorri **Operación: GHOST PROTOCOL**-era. Zure misioa, onartzea erabakitzen baduzu, *The Daily Leak* komunikabide digitalaren zerbitzari-azpiegitura berreraikitzea da, barne-sabotaje bat jasan baitu.

**Misioa:** *The Daily Leak*-en zerbitzari-azpiegitura berreraikitzea.
**Maila:** Hasiberria / Ertaina.
**Denbora:** 120 minutu.

- [🕵️‍♂️ OPERACIÓN: GHOST PROTOCOL (Pausoz Pausoko Eraikuntza Bertsióa)](#️️-operación-ghost-protocol-pausoz-pausoko-eraikuntza-bertsióa)
  - [🛠️ 1. FASEA: Zimenduak (.env)](#️-1-fasea-zimenduak-env)
  - [🏗️ 2. FASEA: Zerbitzuak Altxatzen (Docker Compose)](#️-2-fasea-zerbitzuak-altxatzen-docker-compose)
    - [🧩 2.1 Urratsa: Fitxategi Kudeatzailea (Uploader)](#-21-urratsa-fitxategi-kudeatzailea-uploader)
    - [🧩 2.2 Urratsa: Nabigatzaile Segurua (Firefox)](#-22-urratsa-nabigatzaile-segurua-firefox)
    - [🧩 2.3 Urratsa: Bulego Tresnak (Obsidian eta LibreOffice)](#-23-urratsa-bulego-tresnak-obsidian-eta-libreoffice)
    - [🧩 2.4 Urratsa: Multimedia Zentroa (Jellyfin) eta Bolumenak](#-24-urratsa-multimedia-zentroa-jellyfin-eta-bolumenak)
  - [🔗 3. FASEA: Konexioa (Erronka handia)](#-3-fasea-konexioa-erronka-handia)
  - [🎬 5. FASEA: Misioa Burutzea](#-5-fasea-misioa-burutzea)
  - [🎉 Misioa Burututa](#-misioa-burututa)


-----

## 🛠️ 1. FASEA: Zimenduak (.env)

Aurreko administratzailearen lehen akatsa pasahitzak eta portuak zuzenean kodean idaztea izan zen. Guk aldagaiak erabiliko ditugu.

**ZURE AGINDUAK:**

1.  Sortu `.env` izeneko fitxategi bat.
2.  Kopiatu eduki hau barruan. Hauek dira gure misioaren koordenatu seguruak:

<!-- end list -->

```bash
# Erabiltzaile-identifikatzaileak (segurtasuna)
PUID=1000
PGID=1000
TZ=Europe/Madrid

# Benetako datuak gordeko diren karpeta
RUTA_BASE=./redaccion_data

# Portu seguruak (Erasoak saihesteko aldatuak)
PORT_FILEBROWSER=8080
PORT_FIREFOX=5800
PORT_OBSIDIAN=3000
PORT_LIBREOFFICE=3001
PORT_JELLYFIN=8096
```

-----

## 🏗️ 2. FASEA: Zerbitzuak Altxatzen (Docker Compose)

Orain `docker-compose.yml` fitxategia sortuko dugu. Ez dugu dena batera egingo. Zerbitzuz zerbitzu joango gara, traidoreak utzitako sabotajeak (akatsak) detektatzeko.

Sortu `docker-compose.yml` fitxategia karpeta berean eta hasi hau kopiatzen:

```yaml
version: "3.8"

services:
```

### 🧩 2.1 Urratsa: Fitxategi Kudeatzailea (Uploader)

Kopiatu eta itsatsi bloke hau `services:`-en azpian.

**⚠️ SABOTAJEA:** Portua "hardcodeatuta" (finko) dago 80an; hori oso ez-segurua da eta talka egingo du zure sistemarekin.

```yaml
  uploader:
    image: filebrowser/filebrowser:v2.23.0
    container_name: uploader
    volumes:
      - ${RUTA_BASE}:/srv
    ports:
      - "80:80"   # <--- AKATSA HEMEN!
    restart: unless-stopped
    
```

> **🔧 ZURE ZEREGINA:** Ezabatu `"80:80"` eta aldatu, `.env` fitxategian definitu duzun Filebrowser portuaren aldagaia erabil dezan. `"${ALDAGAI_IZENA}:80"` bezalako zerbait geratu beharko litzateke.

Probatu zerbitzua `docker compose up -d` erabiliz eta sartu `http://localhost:8080`-ra (edo jarri duzun portura). Filebrowser-en interfazea ikusi beharko zenuke. Probatu fitxategi bat igotzen funtzionatzen duela ziurtatzeko eta ikusi fitxategi-sisteman non gordetzen den.

:octocat: Egin zure aldaketen commit bat mezu honekin: `2.1 urratsa osatuta: Uploader behar bezala konfiguratuta`.

### 🧩 2.2 Urratsa: Nabigatzaile Segurua (Firefox)

Gehitu bloke hau jarraian (kontuz lerrokatzearekin).

**⚠️ SABOTAJEA:** Irudiaren izena osatu gabe dago. Dockerrek ez du jakingo zer deskargatu.

```yaml
  firefox:
    image: jlesage/firefox-gui   # <--- AKATSA HEMEN! Zerbait falta da amaieran...
    ports:
      - "${PORT_FIREFOX}:5800"
      
```

> **🔧 ZURE ZEREGINA:** Bilatu Googlen "docker hub jlesage firefox gui" eta ikusi zer etiketa (tag) joan ohi den irudiaren izenaren amaieran (pista: `:latest` edo zenbakizko bertsio bat izan ohi da). Gehitu ezazu.

> Probatu zerbitzua `docker compose up -d` erabiliz eta sartu `http://localhost:5800`-ra (edo jarri duzun portura). Firefox zure nabigatzailean funtzionatzen ikusi beharko zenuke.

:octocat: Egin zure aldaketen commit bat mezu honekin: `2.2 urratsa osatuta: Firefox behar bezala konfiguratuta`.

### 🧩 2.3 Urratsa: Bulego Tresnak (Obsidian eta LibreOffice)

Gehitu bi bloke hauek.

**⚠️ SABOTAJEA:** Bi akats daude hemen.

1.  **Sintaxia:** Norbaitek espazio gehiegi (indentazioa) jarri ditu Obsidian edukiontziaren izenean.
2.  **Logika:** LibreOffice Obsidianen portu bera erabiltzen saiatzen ari da\!

<!-- end list -->

```yaml
  obsidian:
    image: lscr.io/linuxserver/obsidian:latest
      container_name: obsidian   # <--- IDAZKETA AKATSA! Espazio gehiegi ezkerrean
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
      - "${PORT_OBSIDIAN}:3000" # <--- AKATS LOGIKOA! Portu hau okupatuta dago goian
      - "3001:3001"
    shm_size: "1gb"
    restart: unless-stopped
```

> **🔧 ZURE ZEREGINA:**
>
> 1.  Zuzendu espazioak Obsidian-en `container_name` lerroan.
> 2.  Aldatu LibreOffice-ren portua, bere aldagai propioa (`PORT_LIBREOFFICE`) erabil dezan, Obsidian-i portua lapurtu beharrean.

Probatu bi zerbitzuak `docker compose up -d` erabiliz eta sartu `http://localhost:3000`-ra Obsidianerako eta `http://localhost:3001`-era LibreOfficerako (edo jarri dituzun portuetara). Bi aplikazioak martxan ikusi beharko zenituzke.

Ez konfiguratu ezer Obsidian edo LibreOffice barruan oraindik; soilik ziurtatu ondo kargatzen direla.

:octocat: Egin zure aldaketen commit bat mezu honekin: `2.3 urratsa osatuta: Obsidian eta LibreOffice behar bezala konfiguratuta`.

### 🧩 2.4 Urratsa: Multimedia Zentroa (Jellyfin) eta Bolumenak

Azkenik, gehitu azken zerbitzua.

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

:octocat: Egin zure aldaketen commit bat mezu honekin: `2.4 urratsa osatuta: Jellyfin behar bezala konfiguratuta`.

## 🔗 3. FASEA: Konexioa (Erronka handia)

Orain bertan, edukiontzi bakoitza uharte bat da. Firefox-en zerbait deskargatzen baduzu, Jellyfinek ez du ikusten. Zure misioa denak karpeta komun batera konektatzea da.

**ZURE AGINDUAK:**

1.  Sortu `redaccion_data` izeneko karpeta bat zure `GHOST` karpetaren barruan (berez sortu ez bada).
2.  Editatu zure `docker-compose.yml`. Lerro gehigarri bat gehitu behar duzu `volumes:` atalean zerbitzu **BAKOITZEAN** (uploader, firefox, obsidian, libreoffice, jellyfin).

Lerroak eskema hau jarraitu behar du:
`- ${RUTA_BASE}:/edukiontziaren_barne_ibilbidea`

Erabili "Barne Ibilbideen Txuleta" hau zerbitzu bakoitzean bi puntuen `:` eskuinean zer jarri jakiteko:

  * **Firefox-erako:** `/config/downloads`
  * **Jellyfin-erako:** `/media`
  * **Obsidian eta LibreOffice-rako:** `/config/redaccion_data`
  * **Uploader-erako:** `/srv` (Hau jada jarrita zegoen, berrikusi).

> **💡 Pista:** Amaieran, Firefox zerbitzuak (adibidez) bi lerro izan beharko lituzke bolumenetan. Konfiguraziokoa (dagoeneko zegoena) eta zuk jarri duzun berria.

Amaitzen duzunean, aplikatu aldaketak:
`docker compose up -d`

:octocat: Egin zure aldaketen commit bat mezu honekin: `3. urratsa osatuta: Bolumenak behar bezala konektatuta`.

## 🎬 5. FASEA: Misioa Burutzea

Dena ondo konektatu baduzu, jarraitu urrats hauek praktika gainditzeko:

1.  **Deskarga:** Ireki Firefox (`http://localhost:5800`), bilatu "Top Secret" irudi bat Googlen eta gorde `/config/downloads` helbidean.
2.  **Egiaztapena:** Ireki Uploader (`http://localhost:8080`). Irudia bertan ikusten duzu? Hala bada, **bolumenek funtzionatzen dute\!**
3.  **Edizioa:** Ireki LibreOffice (`http://localhost:3001`), sortu testu-dokumentu bat, idatzi "MISIOA BETETA" eta saiatu deskargatu duzun irudia txertatzen (bilatu `/config/redaccion_data` helbidean).
4.  **Gordetzea:** Gorde dokumentua `INFORME_FINAL.odt` gisa.

> **🏆 AZKEN ENTREGATZEA:**
> Igo pantaila-argazki bat non **Uploader (Filebrowser)** agertzen den LibreOffice-rekin sortu berri duzun `INFORME_FINAL.odt` fitxategia erakusten. Honek sistema guztiak konektatuta daudela frogatzen du.
> Igo Docker Desktop-en exekutatzen ari diren edukiontzien pantaila-argazkia.
> Igo biltegi honetako aldaketak.

-----

:octocat: Egin azken commit bat mezu honekin: `Misioa burututa: Zerbitzu guztiak funtzionatzen eta konektatuta`.

## 🎉 Misioa Burututa

Zorionak, agente\! Operación: GHOST PROTOCOL arrakastaz osatu duzu.

Gogoratu sortutako edukiontzi eta bolumen guztiak ezabatzea, misioaren arrastorik ez uzteko:
`docker compose down -v`

Hurrengo misiora arte\!

![alt text](image-1.png)