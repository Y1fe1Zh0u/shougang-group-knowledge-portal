import s from './TagPill.module.css';

const COLORS = ['blue', 'amber', 'green', 'red'] as const;
type Color = (typeof COLORS)[number];

interface Props {
  name: string;
  color?: Color;
  neutral?: boolean;
}

function hashColor(name: string): Color {
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return COLORS[sum % 4];
}

export default function TagPill({ name, color, neutral = false }: Props) {
  const c = color ?? hashColor(name);
  return <span className={`${s.pill} ${neutral ? s.neutral : s[c]}`}>{name}</span>;
}
