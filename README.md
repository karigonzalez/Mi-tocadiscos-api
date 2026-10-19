# 🎛️ Tocadisco Virtual

Una consola tocadiscos analógica e interactiva desarrollada con **HTML5, Tailwind CSS, JavaScript ES6+ y Web Audio API**, conectada a catálogos de música digital mediante REST APIs.

---

## 🌟 Características Principales

- **Tocadiscos Analógico Interactivo:**
  - Brazo mecánico con aguja móvil.
  - Plato base con textura *slipmat* y eje central metálico.
  - Generador procedural de ruido/chasquido de aguja de vinilo (*Vinyl Crackle*) en tiempo real.
- **Procesamiento de Audio Digital (DSP):**
  - Ecualizador analógico de 3 bandas (Graves, Medios, Agudos).
  - Control de velocidad RPM (33 / 45 RPM) y ajuste de Pitch.
  - Espectrograma de frecuencia y vúmetro estéreo en tiempo real mediante canvas 2D.
- **Grabador de Audio Processado:**
  - Permite grabar el audio saliente filtrado por el ecualizador y descargarlo en MP3.
- **Cargador de MP3 Local & Conexión con API:**
  - Búsqueda en vivo de pistas de audio y portadas en alta resolución.
  - Carga de archivos MP3/WAV locales mediante drag & drop.
- **Atajos de Teclado:**
  - `Espacio`: Play / Pause.
  - `E`: Expulsar disco.
  - `1 - 6`: Cargar discos rápidamente.

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 & Canvas 2D API**
- **Tailwind CSS & FontAwesome**
- **JavaScript (ES6+)**
- **Web Audio API** (`AudioContext`, `BiquadFilterNode`, `AnalyserNode`, `MediaRecorder`)
- **iTunes Search REST API**

---
##  Url:
https://karigonzalez.github.io/Mi-tocadiscos-api/
