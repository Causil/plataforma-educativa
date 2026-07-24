/**
 * Parser del listado de matrícula/asistencia del Politécnico JIC (R02).
 *
 * Formato real (ver docs/05-insumos-institucionales.md):
 *   - Filas de encabezado institucional (asignatura, docente, fecha, …)
 *   - Fila de columnas: N° | DOCUMENTO | NOMBRE | PRIMER APELLIDO |
 *     SEGUNDO APELLIDO | CORREO ELECTRONICO | ASISTENCIA (SI/NO)
 *   - Una fila por estudiante.
 *
 * Tolerante a: tildes, mayúsculas/minúsculas, espacios extra, columnas en
 * otro orden y filas vacías. Aquí se procesa CSV (export del xlsx);
 * la Lambda `parseRoster` (T-902) añadirá lectura .xlsx nativa con SheetJS.
 */

export interface RosterStudent {
  document: string;
  fullName: string;
  email: string;
}

export interface RosterResult {
  students: RosterStudent[];
  /** Errores por fila (fila legible: "fila 13: correo inválido …"). */
  errors: string[];
}

/** Normaliza un encabezado: mayúsculas, sin tildes, sin espacios repetidos. */
function norm(cell: string): string {
  return cell
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function splitCsvLine(line: string): string[] {
  // El formato del Poli no usa comillas ni comas internas; split simple.
  return line.split(',').map((c) => c.trim());
}

export function parseRosterCsv(text: string): RosterResult {
  const lines = text.split(/\r?\n/);
  const errors: string[] = [];
  const students: RosterStudent[] = [];

  // 1. Localizar la fila de encabezados de columnas
  let headerIdx = -1;
  let cols: Record<string, number> = {};
  for (let i = 0; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]).map(norm);
    if (cells.some((c) => c.includes('DOCUMENTO')) && cells.some((c) => c.includes('CORREO'))) {
      headerIdx = i;
      cells.forEach((c, idx) => {
        if (c.includes('DOCUMENTO')) cols.document = idx;
        else if (c === 'NOMBRE' || c.startsWith('NOMBRE')) cols.name = idx;
        else if (c.includes('PRIMER APELLIDO')) cols.lastName1 = idx;
        else if (c.includes('SEGUNDO AP')) cols.lastName2 = idx; // tolera "APLELLIDO" (typo real del formato)
        else if (c.includes('CORREO')) cols.email = idx;
      });
      break;
    }
  }

  if (headerIdx === -1) {
    return {
      students: [],
      errors: ['No encontré la fila de encabezados (debe incluir DOCUMENTO y CORREO ELECTRONICO).'],
    };
  }
  if (cols.document === undefined || cols.email === undefined || cols.name === undefined) {
    return {
      students: [],
      errors: ['Encabezados incompletos: se requieren DOCUMENTO, NOMBRE y CORREO ELECTRONICO.'],
    };
  }

  // 2. Filas de estudiantes
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;
    const cells = splitCsvLine(raw);
    const document = (cells[cols.document] ?? '').trim();
    const name = (cells[cols.name] ?? '').trim();
    const ln1 = cols.lastName1 !== undefined ? (cells[cols.lastName1] ?? '').trim() : '';
    const ln2 = cols.lastName2 !== undefined ? (cells[cols.lastName2] ?? '').trim() : '';
    const email = (cells[cols.email] ?? '').trim();

    if (!document && !name && !email) continue; // fila decorativa/vacía

    const rowLabel = `fila ${i + 1}`;
    if (!/^\d{5,15}$/.test(document)) {
      errors.push(`${rowLabel}: documento inválido "${document}"`);
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      errors.push(`${rowLabel}: correo inválido "${email}"`);
      continue;
    }
    if (!name) {
      errors.push(`${rowLabel}: nombre vacío`);
      continue;
    }

    const fullName = [name, ln1, ln2].filter(Boolean).join(' ');
    students.push({ document, fullName, email });
  }

  return { students, errors };
}
