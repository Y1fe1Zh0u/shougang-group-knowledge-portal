import { FileText } from 'lucide-react';
import type { FileItem } from '../data/mock';
import TagPill from './TagPill';
import s from './FileListItem.module.css';

interface Props {
  file: FileItem;
  onClick?: () => void;
}

export default function FileListItem({ file, onClick }: Props) {
  return (
    <div className={s.item} onClick={onClick}>
      <div className={s.iconBox}>
        <FileText size={20} />
      </div>
      <div className={s.body}>
        <div className={s.title}>{file.title}</div>
        {file.summary && <div className={s.summary}>{file.summary}</div>}
        <div className={s.meta}>
          <span className={s.source}>{file.source}</span>
          {file.tags.map((t) => (
            <TagPill key={t} name={t} />
          ))}
          <span className={s.date}>{file.date}</span>
        </div>
      </div>
    </div>
  );
}
