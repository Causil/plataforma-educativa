# US-06 · Banco de ejercicios

**Prioridad:** Alta · **Depende de:** — · **Épica:** Contenido

## Historia
Como **sistema**, necesito un **banco de ejercicios etiquetados por subtema y dificultad**, para que **el motor adaptativo pueda seleccionarlos**.

## Criterios de aceptación (EARS)
1. EL SISTEMA DEBERÁ almacenar ejercicios con: enunciado, respuesta correcta, subtema, dificultad (1–5) y tipo.
2. CUANDO el motor pide un ejercicio de (subtema, dificultad), EL SISTEMA DEBERÁ devolver uno no repetido en la sesión si existe.
3. EL SISTEMA PODRÁ generar ejercicios nuevos con Bedrock si se agota el banco para una combinación (extensión opcional).

## Servicios AWS
- **DynamoDB** tabla `Exercises`.
- (Opcional) **Bedrock** para generación de ejercicios nuevos.

## Modelo de datos
- Tabla `Exercises`: `exerciseId (PK)`, `subtema (GSI)`, `dificultad (1–5)`, `tipo` (opción múltiple / respuesta numérica), `enunciado`, `respuestaCorrecta`, `opciones[]`, `explicacionBase`.
- Índice secundario por `(subtema, dificultad)` para selección eficiente.

## Notas de implementación
- **Sembrar (seed)** el banco con 30–50 ejercicios de fracciones/álgebra básica cubriendo los subtemas × dificultades. Esto es clave para que la demo se vea rica.
- Los ejercicios generados por Bedrock se validan y guardan para reuso (cachear = menor costo).

## Subtemas semilla (fracciones/álgebra básica)
1. Concepto de fracción · 2. Fracciones equivalentes · 3. Suma/resta con igual denominador · 4. Suma/resta con distinto denominador · 5. Multiplicación/división · 6. Fracción ↔ decimal.

## Definición de Hecho (DoD)
- [ ] Tabla creada + seed cargado (≥ 30 ejercicios).
- [ ] Endpoint/consulta que devuelve ejercicio por (subtema, dificultad) sin repetir en sesión.
- [ ] Test de selección y de no-repetición.
