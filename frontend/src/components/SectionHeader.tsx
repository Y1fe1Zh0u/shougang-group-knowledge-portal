import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import s from './SectionHeader.module.css';

interface Props {
  icon: LucideIcon;
  title: string;
  moreLink?: string;
  moreText?: string;
  size?: 'default' | 'large';
}

export default function SectionHeader({ icon: Icon, title, moreLink, moreText, size = 'default' }: Props) {
  const isLarge = size === 'large';

  return (
    <div className={`${s.wrap} ${isLarge ? s.wrapLarge : ''}`}>
      <div className={s.left}>
        <div className={`${s.iconBox} ${isLarge ? s.iconBoxLarge : ''}`}>
          <Icon size={14} />
        </div>
        <span className={`${s.title} ${isLarge ? s.titleLarge : ''}`}>{title}</span>
      </div>
      {moreLink && (
        <Link to={moreLink} className={s.more}>
          {moreText || '更多'}
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
