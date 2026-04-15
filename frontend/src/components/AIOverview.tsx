import { Search } from 'lucide-react';
import s from './AIOverview.module.css';

interface Props {
  text: string;
  streaming?: boolean;
}

export default function AIOverview({ text, streaming }: Props) {
  return (
    <div className={s.wrap}>
      <div className={s.badge}>
        <Search size={11} />
        AI Overview
      </div>
      <div className={s.text}>
        {text}
        {streaming && <span className={s.cursor}>{'\u2588'}</span>}
      </div>
    </div>
  );
}
