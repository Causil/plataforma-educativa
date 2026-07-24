import { describe, expect, it } from 'vitest';
import { parseRosterCsv } from './roster';

/** Réplica del formato real del Poli (anonimizado). */
const SAMPLE = `LISTADO DE ASISTENCIA,,,,,,
ASIGNATURA:,0310-TECNOLOGÍA EN COSTOS Y AUDITORIA,,,,,
DOCENTE:,Javier Andrés Causil Martínez,,,,,
FECHA:,29-Sep-2025,,,HORA DE INICIO: 6:00,HORA FIN: 8:00,
MUNICIPIO:,Barbosa,,,,,
N°,DOCUMENTO,NOMBRE,PRIMER APELLIDO,SEGUNDO APLELLIDO,CORREO ELECTRONICO,ASISTENCIA (SI/NO)
1,1000000001,ANA,MUÑOZ,PEREZ,ana_munoz00000@elpoli.edu.co,SI
2,1000000002,CARLOS,RENDON,GIL,carlos_rendon00000@elpoli.edu.co,SI
3,1000000003,LAURA,PRIETO,SOTO,laura_prieto00000@elpoli.edu.co,NO
4,1000000004,OSCAR,SALAZAR,RUIZ,oscar_salazar00000@elpoli.edu.co,SI`;

describe('parseRosterCsv — formato real del Politécnico', () => {
  it('encuentra el encabezado tras las filas institucionales y lee los 4 estudiantes', () => {
    const r = parseRosterCsv(SAMPLE);
    expect(r.errors).toEqual([]);
    expect(r.students).toHaveLength(4);
  });

  it('arma el nombre completo con los dos apellidos (tolera el typo "APLELLIDO" del formato)', () => {
    const r = parseRosterCsv(SAMPLE);
    expect(r.students[0]).toEqual({
      document: '1000000001',
      fullName: 'ANA MUÑOZ PEREZ',
      email: 'ana_munoz00000@elpoli.edu.co',
    });
  });

  it('tolera tildes y mayúsculas distintas en encabezados', () => {
    const alt = SAMPLE.replace('CORREO ELECTRONICO', 'Correo Electrónico').replace(
      'DOCUMENTO',
      'documento',
    );
    const r = parseRosterCsv(alt);
    expect(r.students).toHaveLength(4);
  });

  it('reporta filas con correo o documento inválido sin tumbar el resto', () => {
    const bad =
      SAMPLE + '\n5,abc,PEPE,PEREZ,,correo-malo,SI\n6,1000000006,SOFIA,RIOS,,sofia@elpoli.edu.co,SI';
    const r = parseRosterCsv(bad);
    expect(r.students).toHaveLength(5); // 4 + SOFIA
    expect(r.errors).toHaveLength(1); // la fila de PEPE (documento inválido corta antes del correo)
    expect(r.errors[0]).toMatch(/documento inválido/);
  });

  it('archivo sin encabezado válido → error claro y cero estudiantes', () => {
    const r = parseRosterCsv('a,b,c\n1,2,3');
    expect(r.students).toHaveLength(0);
    expect(r.errors[0]).toMatch(/encabezados/i);
  });

  it('ignora filas vacías intermedias', () => {
    const withBlank = SAMPLE.replace('3,1000000003', '\n3,1000000003');
    const r = parseRosterCsv(withBlank);
    expect(r.students).toHaveLength(4);
  });
});
