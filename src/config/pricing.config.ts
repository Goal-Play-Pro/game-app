/**
 * Tabla de precios base para productos por división y nivel
 * División 1 = Primera (más cara/mejor)
 * División 2 = Segunda (intermedia)
 * División 3 = Tercera (más barata/básica)
 */
export const BASE_PRICE_TABLE: Record<number, Record<number, number>> = {
  1: { 1: 1000, 2: 1900, 3: 2775, 4: 3600, 5: 5000 }, // Primera División
  2: { 1: 200, 2: 380, 3: 555, 4: 710, 5: 850 },      // Segunda División
  3: { 1: 30, 2: 58, 3: 84, 4: 108, 5: 130 },         // Tercera División
};

/**
 * Mapeo de divisiones string a números para la tabla de precios
 */
export const DIVISION_TO_NUMBER: Record<string, number> = {
  'primera': 1,
  'segunda': 2,
  'tercera': 3,
};

/**
 * Obtener precio base para una división y nivel específicos
 */
export const getBasePrice = (division: string, level: number): number => {
  const divisionNumber = DIVISION_TO_NUMBER[division];
  if (!divisionNumber || !BASE_PRICE_TABLE[divisionNumber]) {
    throw new Error(`División inválida: ${division}`);
  }
  
  const price = BASE_PRICE_TABLE[divisionNumber][level];
  if (!price) {
    throw new Error(`Nivel inválido: ${level} para división ${division}`);
  }
  
  return price;
};

/**
 * Generar todas las variantes de productos con precios correctos
 */
export const generateProductVariants = () => {
  const variants = [];
  
  Object.entries(DIVISION_TO_NUMBER).forEach(([divisionName, divisionNumber]) => {
    for (let level = 1; level <= 5; level++) {
      const price = BASE_PRICE_TABLE[divisionNumber][level];
      variants.push({
        division: divisionName,
        level,
        price: price.toFixed(2),
        name: `Pack ${divisionName.charAt(0).toUpperCase() + divisionName.slice(1)} División - Nivel ${level}`,
        description: `Pack de jugadores de ${divisionName} división nivel ${level}`
      });
    }
  });
  
  return variants;
};

/**
 * Validar si un precio es correcto para una división y nivel
 */
export const validatePrice = (division: string, level: number, price: number): boolean => {
  try {
    const expectedPrice = getBasePrice(division, level);
    return Math.abs(price - expectedPrice) < 0.01; // Tolerancia de 1 centavo
  } catch {
    return false;
  }
};