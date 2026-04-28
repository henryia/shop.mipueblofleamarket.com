import type { Config } from 'tailwindcss'
import baseConfig from '@shop/config/tailwind'

const config: Config = {
  presets: [baseConfig],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  plugins: [],
}

export default config
