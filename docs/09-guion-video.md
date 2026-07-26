# 🎬 Guion del video — GuIA (T-1401)

> **Duración objetivo: 4:30–5:00 min.** Reglamento pide: objetivos, componentes principales y demo funcional.
> **Preparación antes de grabar:** sesiones cerradas · pestañas listas: (1) demo pública, (2) prototipo HTML, (3) tablero GitHub, (4) consola AWS en DynamoDB · correo de invitación de Cognito a mano · modo no-molestar.
> **Regla de oro:** TODO lo que se muestra en vivo ya fue probado 2 veces hoy.

---

## 0:00–0:35 · EL PROBLEMA (cámara o voz sobre título)

> "Soy Javier Causil, profesor de Estadística en el Politécnico Jaime Isaza Cadavid. Cada semestre tengo grupos de 30 o 40 estudiantes… y un solo ritmo de clase. El que se atrasa en la unidad 2, arrastra el hueco hasta el final. La tutoría personalizada que necesitan no existe: es cara y no escala.
> Por eso construí **GuIA**: un tutor con inteligencia artificial que se adapta a cada estudiante — con mi curso real, mi programa oficial y mi bibliografía real."

*(Pantalla: portada del FD-GC70 2 segundos → landing de GuIA)*

## 0:35–1:05 · LA MATRÍCULA UNIVERSITARIA (el flujo real)

*(Mostrar el correo de invitación de Cognito)*
> "La universidad me entrega el listado oficial de matriculados en Excel. GuIA lo lee — con sus columnas reales — crea las cuentas y envía esta invitación. El curso es **privado**: solo entra quien está en el listado."

*(Login → contraseña temporal → pantalla "crea tu contraseña definitiva" → entra)*
> "Primer ingreso: el estudiante activa su cuenta. Sin fricción, sin auto-registro."

## 1:05–2:20 · EL CORAZÓN: RUTA ADAPTATIVA (demo en vivo)

*(Mi curso: las 6 unidades del FD-GC70)*
> "Este es mi curso real: las seis unidades del programa oficial. Cada subtema registra el avance."

*(Práctica: responder 2 ejercicios — uno bien, uno MAL a propósito)*
> "Cada respuesta se califica **en el servidor** — la respuesta correcta nunca viaja al navegador, imposible hacer trampa con F12. Miren el mapa de dominio moverse… y aquí está lo que no tiene nadie más: la **ruta explica sus decisiones**. 'Es donde más te cuesta'. 'Bajé la dificultad tras tus fallos'. No es una caja negra: es un tutor que razona a la vista."

*(Señalar XP/racha/nivel → **F5**)*
> "Y si recargo… todo sigue aquí. El progreso vive en DynamoDB, no en el navegador."

## 2:20–3:10 · EL TUTOR IA CON BIBLIOGRAFÍA (el wow)

*(Chat: escribir "¿qué es la desviación estándar? dame un ejemplo")*
> "Ahora, la magia: un tutor con Claude corriendo en nuestra Lambda. Pregunto lo que quiera…"

*(Esperar respuesta — leer un fragmento en voz alta, señalar la fórmula LaTeX y la cita)*
> "Fórmulas renderizadas… y fíjense en esto: **cita el libro, el capítulo y la página** — Devore, Walpole — porque el tutor SOLO puede citar la bibliografía oficial del curso. Cero fuentes inventadas. Y cuando el estudiante falla, la pista es socrática: el prompt ni siquiera contiene la respuesta correcta — es estructuralmente imposible que la revele."

## 3:10–3:45 · EL DOCENTE

*(Cambiar a profe.demo → panel docente)*
> "Del lado del profesor: el mapa de calor de todo el grupo — quién domina qué, quién necesita apoyo YA. Aquí cargo el listado oficial de la universidad…" *(cargar el CSV anónimo → tabla de matriculados)* "…y GuIA valida fila por fila. Quiz con rúbrica, seguimiento de uso, y en el roadmap: los informes institucionales llenándose solos."

## 3:45–4:15 · VISIÓN + ARQUITECTURA

*(Prototipo HTML: pestañas Evaluación → proctoring animado → Avatar)*
> "Esto es lo que sigue, ya diseñado: exámenes con proctoring —cámara, verificación de entorno—, talleres en papel calificados con OCR, y un avatar que explica y guarda tus preguntas en un buzón."

*(Tablero GitHub 3 seg → diagrama de arquitectura del README)*
> "Todo serverless en AWS: Cognito, AppSync, DynamoDB, Lambdas, Amplify. El motor adaptativo es un algoritmo puro con 42 tests — la IA generativa solo se usa donde aporta, con caché y fallbacks: la demo completa costó menos de un dólar."

## 4:15–4:45 · EL MÉTODO + CIERRE

> "Y lo construimos en cinco días con un equipo de tres: yo como docente y product owner, **Claude** como arquitecto y revisor, y **Kiro** construyendo el backend guiado por specs versionadas — cada tarea con revisión obligatoria; hasta los errores que el review cazó están documentados en el tablero.
> GuIA ya funciona con mi curso real. El próximo semestre, mis estudiantes del Politécnico tendrán un tutor 1:1 esperándolos.
> **GuIA: para que nadie se quede atrás.** Gracias."

*(Pantalla final: logo ∞ + URL de la demo + repo)*

---

## ✅ Checklist técnico de grabación
- [ ] Resolución 1080p, zoom del navegador 110–125 % (legibilidad)
- [ ] Micrófono probado; sin notificaciones
- [ ] Ensayo completo 1 vez ANTES de grabar (cronometrar)
- [ ] Si el tutor tarda >8 s en el chat: cortar la espera en edición
- [ ] Plan B por sección: si algo falla en vivo, capturas de respaldo (tomarlas hoy tras el QA)
- [ ] Subir a YouTube (oculto/no listado) y probar el enlace en incógnito
