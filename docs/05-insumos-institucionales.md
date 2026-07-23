# Insumos institucionales — Politécnico Colombiano Jaime Isaza Cadavid
### Formatos reales aportados por Javier (23 jul) y cómo alimentan a GuIA

> ⚠️ **Privacidad:** el archivo original `fotmato LISTADO DE ASISTENCIA.xlsx` contiene datos personales reales (cédulas, nombres, correos) y está **excluido del repo vía `.gitignore`**. Para trabajar se usa `listado-asistencia-ejemplo-anonimo.csv` (misma estructura, datos inventados).

---

## 1. FD-GC70 · Programa de Asignatura (PDF, oficial)

**Identificación real del curso:**

| Campo | Valor |
|---|---|
| Asignatura | **ESTADÍSTICA** |
| Código | **CBS00074** |
| Área | Ciencias Básicas |
| Tipo | Teórico-práctica |
| Créditos | 4 |
| Horario semanal | 4 HTP (presencial) + 5 HTI (independiente) |

**Contenidos temáticos (unidades) — este es el recorrido REAL del curso:**

1. **Nociones preliminares en Estadística** — conceptos básicos (población, muestra, parámetro, estadística, error, unidad, dato), variable y tipos, escalas de medición, tablas de frecuencia cualitativa
2. **Tablas estadísticas** — frecuencias simples variable discreta y continua, interpretaciones
3. **Cálculos estadísticos · medidas de resumen descriptivas** — tendencia central y posición, dispersión y gráficos, coeficientes de variación, asimetría y curtosis
4. **Análisis de regresión y correlación simple** — diagrama de dispersión, ecuación de regresión, coeficiente de correlación y determinación
5. **Probabilidad y modelos probabilísticos** — conjuntos, axiomas, técnicas de conteo, prob. discreta, probabilidad total y Bayes, binomial y binomial negativa, geométrica, hipergeométrica, Poisson, normal y aproximaciones
6. **Muestreo y tamaño de muestra** — técnicas de muestreo, tamaño por proporción y por variable cuantitativa

**Bibliografía oficial (→ "universo de libros" del tutor IA, R10/R11):**
- Devore, J. L. (2015). *Probability and Statistics for Engineering and the Sciences*. Cengage.
- Walpole, Myers, Myers & Ye (2007). *Probabilidad y estadística para ingeniería y ciencias*. Pearson.
- Montgomery & Runger (2010). *Applied Statistics and Probability for Engineers*. Wiley.
- (+ referencias de metrología: Esquivel, Rodríguez, Restrepo, ICONTEC GTC-115/NTC-1000, etc.)

> Nota copyright: son libros comerciales → el tutor puede **citar** título/capítulo/página libremente, pero el texto para RAG debe salir de material propio de Javier o libros abiertos (OpenIntro).

## 2. FD-GC71 · Guía Didáctica y Concertación de Evaluación (DOCX, plantilla V10)

Es **el informe que la universidad exige diligenciar** al docente. Estructura:

- Identificación (asignatura, código, créditos, **profesor: Javier Andrés Causil Martínez**, grupo: *Tecnología de Costos y Auditoría*, período)
- Justificación · Competencias · Resultados de aprendizaje · Objetivos
- Metodologías y estrategias didácticas
- **Contenidos por unidad en tabla de sesiones**: N° sesión · Fecha · Contenido por desarrollar · Trabajo presencial · Trabajo independiente (con fechas reales: 29-09, 30-09, 06-10…)
- Ambientes de aprendizaje · Medios educativos · Referencias

**→ Caso de uso estrella de R17 (informes auto-llenados):** GuIA ya tendrá los contenidos, fechas de sesión, actividades y avance del curso → puede **generar el FD-GC71 diligenciado automáticamente**. Este formato real es la prueba de concepto perfecta para el video.

## 3. Listado de Asistencia (XLSX)

**Estructura real del formato** (la que debe entender el parser de matrícula/asistencia):

| Zona | Contenido |
|---|---|
| Encabezado | LISTADO DE ASISTENCIA · ASIGNATURA (ej. *0310-Tecnología en Costos y Auditoría*) · DOCENTE · FECHA · HORA INICIO/FIN · MUNICIPIO (ej. Barbosa) |
| Columnas (fila 11) | **N° · DOCUMENTO · NOMBRE · PRIMER APELLIDO · SEGUNDO APELLIDO · CORREO ELECTRONICO · ASISTENCIA (SI/NO)** |
| Filas | Un estudiante por fila; correos institucionales `@elpoli.edu.co` |

**→ Implicaciones directas:**
- **R02 (matrícula XLSX):** el parser debe leer estas columnas exactas (incluye DOCUMENTO como identificador y los dos apellidos separados).
- **Nueva sub-funcionalidad detectada — asistencia por sesión (extiende R03):** el mismo formato sirve para que GuIA registre asistencia por sesión y la exporte en el formato oficial. El seguimiento de uso (ingresos/duración/ruta) + asistencia = informe de seguimiento completo.

---

## Mapa insumo → producto

| Insumo | Alimenta | Estado |
|---|---|---|
| FD-GC70 unidades | Recorrido "Mi curso" (Temas→Subtemas reales) | ✅ integrado al prototipo v2.3 |
| FD-GC70 bibliografía | Referencias del tutor IA (cap./pág.) | ✅ integrado al prototipo v2.3 |
| FD-GC71 estructura | Informe auto-llenado (R17) — pantalla docente | ✅ nombrado en prototipo; generación = P2 |
| Listado asistencia (estructura) | Parser XLSX de matrícula (R02) + asistencia por sesión (R03+) | ✅ columnas reales en el mock; parser = build |

## Pendientes que Javier aún puede aportar
- [ ] 2-3 preguntas reales de quiz/taller/examen (con respuesta y nivel)
- [ ] Una rúbrica real de calificación
- [ ] Diapositivas Beamer de una clase (PDF)
- [ ] Notas de clase propias (para el corpus RAG sin problemas de copyright)
