import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad7ad',
          300: '#f6ba78',
          400: '#f19341',
          500: '#ed751c',
          600: '#de5a12',
          700: '#b84211',
          800: '#933516',
          900: '#772f15',
        },
        baby: {
          pink: '#FFB6C1',
          blue: '#87CEEB',
          green: '#98FB98',
          yellow: '#FFFACD',
          purple: '#DDA0DD',
        }
      },
    },
  },
  plugins: [],
}
export default config
