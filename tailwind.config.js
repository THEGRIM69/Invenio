/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta Exacta Requerida (5 Colores Oficiales):
        // 1. #004146 - Teal Oscuro / Profundo (Deep Petrol)
        // 2. #018076 - Verde Azulado Medio (Medium Teal)
        // 3. #03BFB5 - Turquesa Neón / Cian Brillante (Vibrant Turquoise)
        // 4. #949398 - Gris Neutro / Plata Mate (Neutral Slate Grey)
        // 5. #EFF5F9 - Blanco Glaciar / Hielo (Ice White)
        f1: {
          darkest: '#004146',  // Color 1
          deep: '#018076',     // Color 2
          cyan: '#03BFB5',     // Color 3
          grey: '#949398',     // Color 4
          light: '#EFF5F9',    // Color 5
        },
        // Mapeo semántico directo para la aplicación
        petronas: {
          DEFAULT: '#03BFB5',
          deep: '#018076',
          darkest: '#004146',
          grey: '#949398',
          light: '#EFF5F9',
        },
        // Chasis y superficies derivados del Teal Oscuro (#004146)
        chassis: {
          950: '#001E21', // Fondo principal ultra profundo
          900: '#002B2E', // Paneles y Header
          850: '#00363B', // Tarjetas de inventario
          800: '#004146', // Color exacto 1 (Bordes y contenedores)
          700: '#018076', // Color exacto 2 (Bordes interactivos)
          600: '#029E92',
          500: '#03BFB5', // Color exacto 3 (Acentos y botones)
          400: '#949398', // Color exacto 4 (Textos secundarios)
          100: '#EFF5F9', // Color exacto 5 (Textos principales)
        },
      },
      boxShadow: {
        'f1-cyan': '0 0 20px -3px rgba(3, 191, 181, 0.4)',
        'f1-teal': '0 0 15px -3px rgba(1, 128, 118, 0.4)',
      }
    },
  },
  plugins: [],
}
