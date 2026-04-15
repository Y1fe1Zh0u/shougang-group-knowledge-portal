import { useState, useEffect, useCallback } from 'react';
import type { BannerItem } from '../data/mock';
import s from './Banner.module.css';

interface Props {
  items: BannerItem[];
}

export default function Banner({ items }: Props) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [next, items.length]);

  if (!items.length) return null;

  return (
    <div className={s.wrap}>
      <div
        className={s.track}
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className={s.slide}
            style={{ background: item.bgColor }}
          >
            <span className={s.label}>{item.label}</span>
            <div className={s.title}>{item.title}</div>
            <div className={s.desc}>{item.desc}</div>
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className={s.dots}>
          {items.map((_, i) => (
            <button
              key={i}
              className={`${s.dot} ${i === current ? s.dotActive : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
