import type { FileItem } from '../data/mock';
import TagPill from './TagPill';
import s from './FileListItem.module.css';

interface Props {
  file: FileItem;
  onClick?: () => void;
  visibleTagCount?: number;
}

const META_TAGS = ['最新精选', '典型案例'];

export default function FileListItem({ file, onClick, visibleTagCount = 2 }: Props) {
  const displayTags = file.tags.filter((tag) => !META_TAGS.includes(tag));

  return (
    <div className={s.item} onClick={onClick}>
      <div className={s.body}>
        <div className={s.title}>{file.title}</div>
        {file.summary ? <div className={s.summary}>{file.summary}</div> : null}
        <div className={s.meta}>
          <span className={s.source}>{file.source}</span>
          {displayTags.slice(0, visibleTagCount).map((tag) => (
            <TagPill key={tag} name={tag} neutral />
          ))}
          <span className={s.date}>{file.date}</span>
        </div>
      </div>
    </div>
  );
}
