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
 * otro orden, filas vacías, campos entrecomillados, BOM y separador `;`
 * (export de Excel en locale ES). Aquí se procesa CSV (export del xlsx);
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

/**
 * Detecta el separador real contando ocurrencias fuera de comillas.
 * Excel en locale ES exporta con `;`; el export "CSV UTF-8" usa `,`.
 */
function detectDelimiter(text: string): string {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') i++;
      else inQuotes = !inQuotes;
    } else if (!inQuotes && ch in counts) {
      counts[ch]++;
    }
  }
  return Object.keys(counts).reduce((best, c) => (counts[c] > counts[best] ? c : best), ',');
}

/**
 * Tokeniza CSV al estilo RFC 4180: campos entrecomillados pueden contener el
 * separador y saltos de línea, y `""` es una comilla escapada.
 * Devuelve filas de celdas ya recortadas.
 */
function parseCsvRows(text: string): string[][] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // quita BOM
  const delim = detectDelimiter(src);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const endField = () => {
    row.push(field.trim());
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === delim) endField();
    else if (ch === '\r') {
      if (src[i + 1] === '\n') i++;
      endRow();
    } else if (ch === '\n') endRow();
    else field += ch;
  }
  endRow(); // última fila (aunque el archivo no termine en salto de línea)

  return rows;
}

export function parseRosterCsv(text: string): RosterResult {
  const lines = parseCsvRows(text);
  const errors: string[] = [];
  const students: RosterStudent[] = [];

  // 1. Localizar la fila de encabezados de columnas
  let headerIdx = -1;
  let cols: Record<string, number> = {};
  for (let i = 0; i < lines.length; i++) {
    const cells = lines[i].map(norm);
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
    const cells = lines[i];
    if (cells.every((c) => !c)) continue;
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
