export interface SphereColor {
  base: string
  light: string
  dark: string
  rim: string
  glow: string
}

export const SPHERE_COLORS: SphereColor[] = [
  { base: '#E6B8FF', light: '#F9EEFF', dark: '#7B4FA8', rim: '#FFB8EE', glow: 'rgba(230,184,255,0.9)' },
  { base: '#FF6B9D', light: '#FFD0E4', dark: '#8C1A42', rim: '#FF9EC0', glow: 'rgba(255,107,157,0.9)' },
  { base: '#7AA2F7', light: '#CCE0FF', dark: '#2A44A8', rim: '#A8C4FF', glow: 'rgba(122,162,247,0.9)' },
  { base: '#FFD700', light: '#FFF7A0', dark: '#907000', rim: '#FFE840', glow: 'rgba(255,215,0,0.9)'   },
  { base: '#9ECE6A', light: '#DAFAB0', dark: '#3E6A20', rim: '#C0F080', glow: 'rgba(158,206,106,0.9)' },
  { base: '#FF9E64', light: '#FFDAB8', dark: '#8C3A00', rim: '#FFB880', glow: 'rgba(255,158,100,0.9)' },
  { base: '#BB9AF7', light: '#EAD8FF', dark: '#5A30B0', rim: '#D4B0FF', glow: 'rgba(187,154,247,0.9)' },
  { base: '#2AC3DE', light: '#A8F0FA', dark: '#087090', rim: '#70E0F0', glow: 'rgba(42,195,222,0.9)'  },
  { base: '#F7768E', light: '#FFBCCC', dark: '#8C2038', rim: '#FFA0B8', glow: 'rgba(247,118,142,0.9)' },
  { base: '#73DACA', light: '#C4F8F0', dark: '#1C7868', rim: '#98F0E0', glow: 'rgba(115,218,202,0.9)' },
]
