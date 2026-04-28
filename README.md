# Juego Yahtzee — Simulación Montecarlo

**Materia:** Simulación  
**Docente:** Julian Andres Loaiza  
**Código:** PREICA2601B020049  
**Estudiante:** Alejandro Arango Calderón  

---

## ¿De qué trata?

Es una aplicación web que simula el juego clásico de **Yahtzee** para 2 jugadores. Además incluye un módulo de **simulación Montecarlo** donde se pueden hacer miles de lanzamientos de dados para analizar las probabilidades y comparar los resultados con los valores teóricos.

El juego usa dados con **distribución uniforme discreta** (cada cara del 1 al 6 tiene probabilidad 1/6).

## ¿Cómo ejecutarlo?

Solo abre el archivo `index.html` en tu navegador. No necesita instalación, servidor ni nada extra.

```
# En Windows
start index.html

# En macOS
open index.html
```

> Necesita internet solo para cargar Chart.js y la fuente (CDN).

## Qué se puede hacer

### Jugar Yahtzee (2 jugadores)
- Lanzar 5 dados hasta 3 veces por turno
- Guardar dados haciendo clic en ellos
- Elegir entre 13 categorías de puntaje (unos, doses, tercia, póker, full house, escaleras, yahtzee, chance, etc.)
- Bono de 35 puntos si la sección superior suma 63 o más
- Al final muestra quién ganó

### Simulación Montecarlo
- Configurar de 100 a 1,000,000 de lanzamientos
- Ver histograma de la suma de dados
- Gráfica de frecuencia por cara (para verificar uniformidad)
- Comparación de probabilidades simuladas vs teóricas
- Gráfica de convergencia de la media (Ley de los Grandes Números)
- Tabla con errores relativos

## Archivos del proyecto

| Archivo | Qué hace |
|---------|----------|
| `index.html` | Estructura de las pantallas (inicio, juego, simulación) |
| `style.css` | Diseño visual con tema oscuro y animaciones |
| `game.js` | Lógica del Yahtzee: dados, puntaje, turnos |
| `montecarlo.js` | Simulación masiva de lanzamientos y gráficas |
| `README.md` | Este archivo |

## Tecnologías

- HTML5, CSS3, JavaScript (vanilla)
- [Chart.js](https://www.chartjs.org/) para las gráficas
- Google Fonts (Outfit)

## Probabilidades teóricas (5 dados)

| Combinación | Probabilidad |
|-------------|-------------|
| Yahtzee (5 iguales) | 0.077% |
| Póker (4 iguales) | 2.006% |
| Full House | 3.858% |
| Escalera Larga | 3.086% |
| Escalera Corta | 14.866% |
| Tercia (3 iguales) | 21.296% |

La media teórica de la suma de 5 dados es **17.5** y la desviación estándar **3.82**. Con suficientes iteraciones la simulación converge a estos valores.

## Video

[Video de presentación](https://drive.google.com/file/d/1Z6CKLxF9i6OlwQDKQffcP3NWkcznWW1u/view?usp=sharing)

## Autor

Alejandro Arango Calderón  
Simulación — PREICA2601B020049
