# 🎲 Simulación Montecarlo — Juego Yahtzee Clásico

> **Materia:** Simulación  
> **Docente:** Julian Andres Loaiza  
> **Código:** PREICA2601B020049  
> **Estudiante:** Alejandro Arango Calderón  
> **Módulo 1 — Actividad Didáctica 2**

---

## 📋 Descripción del Proyecto

Aplicación web interactiva que implementa el juego clásico **Yahtzee** para 2 jugadores, aplicando el **método de Montecarlo** para la simulación y análisis estadístico de lanzamientos de dados.

El juego simula hasta tres lanzamientos de cinco dados convencionales de seis caras en cada turno. La distribución de probabilidad asociada es **uniforme discreta** en {1, 2, 3, 4, 5, 6}, donde cada cara tiene una probabilidad de **1/6** de aparecer.

### ¿Qué es el Método de Montecarlo?

El método de Montecarlo es una técnica computacional que utiliza la **generación masiva de números aleatorios** para estimar probabilidades y resolver problemas que pueden ser difíciles de calcular analíticamente. En este proyecto, se usa para:

- Simular miles de lanzamientos de dados
- Estimar probabilidades de combinaciones (Yahtzee, Full House, Escaleras, etc.)
- Verificar que los resultados simulados convergen hacia las probabilidades teóricas (Ley de los Grandes Números)

---

## 🎮 Funcionalidades

### Juego Yahtzee (2 Jugadores)
- 🎲 **5 dados** con distribución uniforme (1-6) generados por `Math.random()`
- 🔄 **Hasta 3 lanzamientos** por turno con opción de guardar dados selectivamente
- 📊 **13 categorías de puntuación:**
  - *Sección Superior:* Unos, Doses, Treses, Cuatros, Cincos, Seises (+ bono de 35 si ≥ 63)
  - *Sección Inferior:* Tercia, Póker, Full House, Escalera Corta, Escalera Larga, Yahtzee, Chance
- 👥 **Turnos alternados** entre 2 jugadores (26 turnos totales)
- ⌨️ **Atajos de teclado:** Espacio = lanzar, teclas 1-5 = guardar/soltar dado

### Simulación Montecarlo
- ⚙️ **Configurable:** 100 a 1,000,000 iteraciones; 1, 2 o 5 dados
- 📈 **4 gráficas interactivas:**
  1. Histograma de distribución de frecuencias (suma de dados)
  2. Frecuencia por cara individual vs. valor teórico (1/6)
  3. Probabilidad de combinaciones Yahtzee: simulada vs. teórica
  4. Convergencia de la media hacia el valor teórico (17.5)
- 📋 **Tabla comparativa:** Probabilidades teóricas vs. simuladas con error relativo
- 📊 **Estadísticas:** Media, desviación estándar, mínimo, máximo, P(Yahtzee)

---

## 🚀 Instalación y Ejecución

**No requiere instalación.** Solo necesitas un navegador web moderno.

```bash
# Opción 1: Abrir directamente
# Doble clic en index.html

# Opción 2: Desde la terminal
start index.html          # Windows
open index.html           # macOS
xdg-open index.html       # Linux
```

### Requisitos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexión a internet (solo para Chart.js y Google Fonts vía CDN)

---

## 📁 Estructura del Proyecto

```
S20 - Módulo 1. Actividad didáctica 2-M1/
├── index.html                          # Estructura HTML de la aplicación
├── style.css                           # Diseño visual (dark mode, glassmorphism, animaciones)
├── game.js                             # Motor del juego Yahtzee
├── montecarlo.js                       # Módulo de simulación Montecarlo
├── Arango_Alejandro_Montecarlo.html    # Documento académico
└── README.md                           # Este archivo
```

### Descripción de archivos

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `index.html` | ~200 | Estructura HTML: pantalla inicio, tablero de juego, overlay game over, pantalla Montecarlo |
| `style.css` | ~480 | Hoja de estilos: dark mode, glassmorphism, animaciones CSS, diseño responsive |
| `game.js` | ~310 | Motor del juego: generación aleatoria de dados, cálculo de puntajes (13 categorías), gestión de turnos, interfaz interactiva |
| `montecarlo.js` | ~290 | Simulación Montecarlo: generación masiva de datos, estadísticas descriptivas, gráficas con Chart.js |

---

## 🔬 Distribución de Probabilidad

### Distribución Uniforme Discreta

Cada dado sigue una distribución uniforme discreta con:

- **Espacio muestral:** Ω = {1, 2, 3, 4, 5, 6}
- **Probabilidad:** P(X = k) = 1/6 para todo k ∈ Ω
- **Media:** E[X] = 3.5
- **Varianza:** Var[X] = 35/12 ≈ 2.917

Para la suma de 5 dados:
- **Media teórica:** E[S₅] = 5 × 3.5 = **17.5**
- **Desv. estándar:** σ = √(5 × 35/12) ≈ **3.819**

### Probabilidades Teóricas de Combinaciones (5 dados)

| Combinación | Probabilidad |
|-------------|-------------|
| Yahtzee (5 iguales) | 0.077% |
| Póker (4 iguales) | 2.006% |
| Full House (3+2) | 3.858% |
| Escalera Larga (5 consecutivos) | 3.086% |
| Escalera Corta (4+ consecutivos) | 14.866% |
| Tercia (3 iguales) | 21.296% |

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Versión | Uso |
|------------|---------|-----|
| HTML5 | - | Estructura de la aplicación |
| CSS3 | - | Diseño visual con glassmorphism y animaciones |
| JavaScript ES6+ | - | Lógica del juego y simulación Montecarlo |
| [Chart.js](https://www.chartjs.org/) | 4.4.4 | Visualización de gráficas estadísticas |
| [Google Fonts (Outfit)](https://fonts.google.com/specimen/Outfit) | - | Tipografía moderna |

---

## 📊 Resultados de la Simulación

Con N = 10,000 iteraciones y 5 dados:

- **Media simulada:** ≈ 17.5 (converge al teórico)
- **Desv. estándar:** ≈ 3.8 (converge al teórico 3.819)
- **Distribución:** Forma acampanada simétrica (Teorema del Límite Central)
- **Uniformidad por cara:** Cada cara ≈ 16.67% ± 0.5%
- **Error relativo:** < 10% para combinaciones comunes; mayor para eventos raros (Yahtzee)

La convergencia de la media demuestra la **Ley de los Grandes Números**: a mayor número de iteraciones, la media muestral se aproxima al valor esperado teórico.

---

## 👤 Autor

**Alejandro Arango Calderón**  
Simulación — PREICA2601B020049  
Docente: Julian Andres Loaiza

---

## 📄 Licencia

Proyecto académico. Uso exclusivamente educativo.
