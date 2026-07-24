/**
 * Curso ESTADÍSTICA — CBS00074 (Politécnico Colombiano Jaime Isaza Cadavid).
 * Estructura tomada del programa oficial FD-GC70; bibliografía oficial.
 * Este seed alimenta tanto el modo local como la carga a DynamoDB (T-304/305).
 */
import type { CourseSeed, Exercise, Subtopic, Unit } from './types';
import { levelForDifficulty } from './types';

const WALPOLE = 'Walpole, Myers & Ye (2007) · Probabilidad y estadística';
const DEVORE = 'Devore (2015) · Probability and Statistics';
const MONTGOMERY = 'Montgomery & Runger (2010) · Applied Statistics';

export const UNITS: Unit[] = [
  { id: 'u1', order: 1, title: 'Nociones preliminares en Estadística' },
  { id: 'u2', order: 2, title: 'Tablas estadísticas' },
  { id: 'u3', order: 3, title: 'Medidas de resumen descriptivas' },
  { id: 'u4', order: 4, title: 'Regresión y correlación simple' },
  { id: 'u5', order: 5, title: 'Probabilidad y modelos probabilísticos' },
  { id: 'u6', order: 6, title: 'Muestreo y tamaño de muestra' },
];

export const SUBTOPICS: Subtopic[] = [
  {
    id: 'vars', unitId: 'u1', name: 'Tipos de variables', short: 'Vars', initialMastery: 0.72,
    bookRefs: [{ title: WALPOLE, chapter: 'Cap. 1 · Introducción y análisis de datos', page: 'pág. 1' }],
  },
  {
    id: 'tablas', unitId: 'u2', name: 'Tablas de frecuencia', short: 'fᵢ', initialMastery: 0.6,
    bookRefs: [{ title: DEVORE, chapter: 'Cap. 1 · Estadística descriptiva', page: 'pág. 12' }],
  },
  {
    id: 'tc', unitId: 'u3', name: 'Tendencia central', short: 'x̄', initialMastery: 0.55,
    bookRefs: [{ title: DEVORE, chapter: 'Cap. 1 · Medidas de localización', page: 'pág. 28' }],
  },
  {
    id: 'disp', unitId: 'u3', name: 'Dispersión', short: 'σ', initialMastery: 0.3,
    bookRefs: [{ title: DEVORE, chapter: 'Cap. 1 · Medidas de variabilidad', page: 'pág. 35' }],
  },
  {
    id: 'regresion', unitId: 'u4', name: 'Regresión y correlación', short: 'ŷ', initialMastery: 0.18,
    bookRefs: [{ title: WALPOLE, chapter: 'Cap. 11 · Regresión lineal simple', page: 'pág. 389' }],
  },
  {
    id: 'prob', unitId: 'u5', name: 'Probabilidad básica', short: 'P(A)', initialMastery: 0.45,
    bookRefs: [{ title: WALPOLE, chapter: 'Cap. 2 · Probabilidad', page: 'pág. 35' }],
  },
  {
    id: 'dist', unitId: 'u5', name: 'Distribuciones', short: 'N(μ,σ)', initialMastery: 0.25,
    bookRefs: [{ title: MONTGOMERY, chapter: 'Cap. 4 · Distribuciones continuas', page: 'pág. 107' }],
  },
  {
    id: 'muestreo', unitId: 'u6', name: 'Muestreo e inferencia', short: 'n', initialMastery: 0.2,
    bookRefs: [{ title: WALPOLE, chapter: 'Cap. 8 · Distribuciones muestrales', page: 'pág. 225' }],
  },
];

const ex = (
  id: string, subtopicId: string, difficulty: number, prompt: string,
  options: string[], answerIndex: number, hint: string, explanation: string,
): Exercise => ({ id, subtopicId, level: levelForDifficulty(difficulty), difficulty, prompt, options, answerIndex, hint, explanation });

export const EXERCISES: Exercise[] = [
  ex('vars-1', 'vars', 2, 'La estatura de una persona es una variable…',
    ['Cualitativa nominal', 'Cuantitativa continua', 'Cuantitativa discreta', 'Cualitativa ordinal'], 1,
    'Pregúntate: ¿se mide o se cuenta? ¿Puede tomar cualquier valor dentro de un rango, como 1.735 m?',
    'La estatura se mide y puede tomar cualquier valor en un rango (1.7351… m): es cuantitativa continua.'),
  ex('vars-2', 'vars', 3, 'El estrato socioeconómico (1 a 6) es una variable…',
    ['Cuantitativa discreta', 'Cualitativa nominal', 'Cualitativa ordinal', 'Cuantitativa continua'], 2,
    'Son categorías con un orden, aunque se escriban con números. ¿Tiene sentido "promediar" estratos?',
    'El estrato clasifica en categorías ordenadas (1 < 2 < … < 6) sin que las distancias sean magnitudes: cualitativa ordinal.'),
  ex('tablas-1', 'tablas', 2, 'En una tabla de frecuencias, la frecuencia relativa $h_i$ se calcula como…',
    ['$f_i / n$', '$n / f_i$', '$\\sum f_i$', '$f_i - 1$'], 0,
    'Es una proporción: las veces que ocurre la clase sobre el total de datos.',
    'La frecuencia relativa es la proporción de la clase: $h_i = f_i / n$, y todas suman 1.'),
  ex('tablas-2', 'tablas', 3, 'Para agrupar una variable continua con muchos datos se usan…',
    ['Intervalos de clase', 'Categorías nominales', 'Solo la moda', 'Diagramas de torta'], 0,
    'Cuando la variable es continua, los valores se agrupan en rangos consecutivos.',
    'Con variables continuas se construyen intervalos de clase [a, b) que cubren el recorrido de los datos.'),
  ex('tc-1', 'tc', 2, 'Datos: 2, 3, 3, 8, 9. ¿Cuál es la mediana?',
    ['3', '5', '8', '2'], 0,
    'Ordena los datos y busca el valor que queda exactamente en el centro.',
    'Ordenados: 2, 3, 3, 8, 9 → el valor central (3ª posición de 5) es 3.'),
  ex('tc-2', 'tc', 3, 'La media de 4, 6 y 11 es…',
    ['6', '7', '21', '5.5'], 1,
    'Suma todos los valores y divide entre cuántos son: $(4 + 6 + 11) / 3$.',
    '$\\bar{x} = (4+6+11)/3 = 21/3 = 7$.'),
  ex('disp-1', 'disp', 3, '¿Qué mide la desviación estándar?',
    ['El valor más frecuente', 'El centro de los datos', 'Qué tan dispersos están los datos respecto a la media', 'El valor máximo'], 2,
    'Imagina dos grupos con la misma media pero datos muy diferentes entre sí. ¿Qué los distingue?',
    'La desviación estándar $s$ mide la distancia típica de los datos a la media: a mayor $s$, mayor dispersión.'),
  ex('disp-2', 'disp', 2, 'El rango de los datos 5, 9, 12, 20 es…',
    ['15', '25', '12', '5'], 0,
    'El rango es la distancia entre el valor mayor y el menor.',
    'Rango $= 20 - 5 = 15$.'),
  ex('regresion-1', 'regresion', 3, 'Un coeficiente de correlación $r = -0.95$ indica…',
    ['Relación lineal negativa fuerte', 'Que no hay relación', 'Relación positiva débil', 'Causalidad directa'], 0,
    'El signo da la dirección y la cercanía a ±1 la fuerza. Ojo: correlación no implica causalidad.',
    '$r=-0.95$ está muy cerca de $-1$: relación lineal fuerte y negativa (cuando X sube, Y baja). Nunca implica causalidad por sí sola.'),
  ex('regresion-2', 'regresion', 4, 'En la recta de regresión $\\hat{y} = 3 + 2x$, el 2 representa…',
    ['El intercepto', 'El cambio en $\\hat{y}$ por cada unidad de $x$', 'El error estándar', 'El coeficiente $r^2$'], 1,
    'Es la pendiente: cuánto cambia la predicción cuando $x$ aumenta en una unidad.',
    'En $\\hat{y}=a+bx$, $b=2$ es la pendiente: por cada unidad adicional de $x$, $\\hat{y}$ aumenta 2.'),
  ex('prob-1', 'prob', 2, 'Al lanzar un dado, la probabilidad de obtener un número par es…',
    ['$\\frac{1}{6}$', '$\\frac{1}{3}$', '$\\frac{1}{2}$', '$\\frac{2}{3}$'], 2,
    'Cuenta los casos favorables (2, 4 y 6) sobre los casos posibles (6).',
    'Favorables: {2,4,6} = 3 casos de 6 posibles → $P = 3/6 = 1/2$.'),
  ex('prob-2', 'prob', 3, 'Si $P(A) = 0.3$, entonces $P(\\bar{A})$ es…',
    ['0.3', '0.7', '0.09', '1.3'], 1,
    'Un evento y su complemento siempre suman 1.',
    '$P(\\bar{A}) = 1 - P(A) = 1 - 0.3 = 0.7$.'),
  ex('dist-1', 'dist', 4, 'En una distribución normal, ¿qué porcentaje aproximado de los datos cae entre $\\mu-\\sigma$ y $\\mu+\\sigma$?',
    ['50%', '68%', '95%', '99.7%'], 1,
    'Es la regla empírica 68-95-99.7. El primer número corresponde a ±1σ.',
    'Regla empírica: ±1σ ≈ 68%, ±2σ ≈ 95%, ±3σ ≈ 99.7%.'),
  ex('dist-2', 'dist', 4, 'La distribución binomial modela…',
    ['El tiempo entre eventos', 'El número de éxitos en $n$ ensayos independientes', 'Valores continuos simétricos', 'La media de una muestra'], 1,
    'Piensa en repetir un experimento de sí/no varias veces y contar cuántos "sí" salen.',
    'Binomial($n$, $p$): cuenta éxitos en $n$ ensayos independientes con probabilidad $p$ constante.'),
  ex('muestreo-1', 'muestreo', 3, 'En un muestreo aleatorio simple…',
    ['Se eligen los casos más fáciles de encontrar', 'Cada elemento tiene la misma probabilidad de ser elegido', 'Solo participan voluntarios', 'Se selecciona por cuotas'], 1,
    'La palabra clave es "aleatorio": ¿qué garantiza el azar para cada elemento de la población?',
    'En el MAS todos los elementos de la población tienen igual probabilidad de integrar la muestra.'),
  ex('muestreo-2', 'muestreo', 4, 'El error muestral tiende a disminuir cuando…',
    ['Aumenta el tamaño de la muestra', 'Disminuye el tamaño de la muestra', 'Se usa una muestra por conveniencia', 'Aumenta la varianza'], 0,
    'Más información suele dar estimaciones más precisas. ¿Qué pasa cuando n crece?',
    'Al crecer $n$, el error estándar $\\sigma/\\sqrt{n}$ disminuye: estimaciones más precisas.'),
];

export const ESTADISTICA: CourseSeed = {
  code: 'CBS00074',
  name: 'Estadística',
  institution: 'Politécnico Colombiano Jaime Isaza Cadavid',
  visibility: 'private',
  credits: 4,
  units: UNITS,
  subtopics: SUBTOPICS,
  exercises: EXERCISES,
};
