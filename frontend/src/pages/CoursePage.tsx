import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Maximize,
  Pause,
  Play,
  PlayCircle,
  RotateCcw,
  RotateCw,
  UserCircle,
  Volume2,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import {
  getCourseDetail,
  type CourseChapter,
  type CourseChapterState,
  type CourseDetail,
  type CourseTag,
} from '../data/courseMock';
import s from './CoursePage.module.css';

const SPEEDS = [1.0, 1.25, 1.5, 2.0, 0.75];

function formatHmsFromSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s2 = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s2).padStart(2, '0')}`;
}

function formatSpeed(value: number): string {
  return `${value.toFixed(2).replace(/\.?0+$/, '')}×`;
}

function pillClassFor(tag: CourseTag): string {
  if (tag.type === 'domain') return `${s.pill} ${s.pillDomain}`;
  if (tag.type === 'level') return `${s.pill} ${s.pillLevel}`;
  return s.pill;
}

interface RunnerProps {
  course: CourseDetail;
}

function CourseRunner({ course }: RunnerProps) {
  const [chapters, setChapters] = useState<CourseChapter[]>(course.chapters);
  const [pct, setPct] = useState(14);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);

  const speed = SPEEDS[speedIdx];
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    const id = window.setInterval(() => {
      setPct((current) => {
        const next = Math.min(100, current + 0.4 * speed);
        if (next >= 100) {
          setPlaying(false);
        }
        return next;
      });
    }, 1000);
    tickRef.current = id;
    return () => {
      window.clearInterval(id);
      tickRef.current = null;
    };
  }, [playing, speed]);

  const elapsedSeconds = Math.floor((course.durationSeconds * pct) / 100);
  const elapsedLabel = formatHmsFromSeconds(elapsedSeconds);
  const doneCount = chapters.filter((c) => c.state === 'done').length;

  const togglePlay = () => setPlaying((current) => !current);

  const handleStageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest(`.${s.bigPlay}`)) return;
    togglePlay();
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    setPct(Math.max(0, Math.min(100, ratio * 100)));
  };

  const cycleSpeed = () => setSpeedIdx((current) => (current + 1) % SPEEDS.length);

  const seekChapter = (idx: number) => {
    setChapters((previous) =>
      previous.map((chapter, i) => {
        if (chapter.state === 'done' && i !== idx) return chapter;
        const nextState: CourseChapterState =
          i === idx ? 'current' : chapter.state === 'done' ? 'done' : 'todo';
        return { ...chapter, state: nextState };
      }),
    );
  };

  return (
    <>
      <section className={s.heroStrip}>
        <div className={s.heroInner}>
          <nav className={s.heroCrumbs} aria-label="breadcrumb">
            <Link to="/">首页</Link>
            <span className={s.crumbSep}>/</span>
            <Link to="/course">专业课程</Link>
            <span className={s.crumbSep}>/</span>
            <span>{course.title}</span>
          </nav>
          <div className={s.heroEyebrow}>SHOUGANG · 岗位赋能课程</div>
          <h1 className={s.heroTitle}>{course.title}</h1>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.layout}>
          <div>
            <div className={s.player}>
              <div
                className={`${s.videoStage} ${playing ? s.playing : ''}`}
                onClick={handleStageClick}
                role="presentation"
              >
                <div className={s.stageWatermark}>
                  <span className={s.wmDot} aria-hidden />
                  <span>SG · KNOWLEDGE</span>
                </div>

                <div className={s.stagePoster}>
                  <div className={s.stageEyebrow}>岗位赋能 · 在线课程</div>
                  <div className={s.stageHeadline}>{course.title}</div>
                  <div className={s.stageRule} />
                </div>

                <div className={s.stageOverlay}>
                  <button
                    type="button"
                    className={s.bigPlay}
                    onClick={(event) => {
                      event.stopPropagation();
                      togglePlay();
                    }}
                    aria-label={playing ? '暂停' : '播放'}
                  >
                    <Play size={36} fill="currentColor" />
                  </button>
                </div>

                <div className={s.nowPlaying}>
                  <span className={s.pulse} aria-hidden />
                  <span>正在播放 · {elapsedLabel}</span>
                </div>
              </div>

              <div className={s.controls}>
                <button
                  type="button"
                  className={s.ctrlBtn}
                  onClick={togglePlay}
                  aria-label={playing ? '暂停' : '播放'}
                >
                  {playing ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button type="button" className={s.ctrlBtn} aria-label="后退 10 秒">
                  <RotateCcw size={18} />
                </button>
                <button type="button" className={s.ctrlBtn} aria-label="前进 10 秒">
                  <RotateCw size={18} />
                </button>
                <span className={s.timer}>
                  {elapsedLabel} / {course.duration}
                </span>
                <div
                  className={s.progress}
                  onClick={handleProgressClick}
                  role="slider"
                  aria-label="播放进度"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(pct)}
                  tabIndex={0}
                >
                  <div className={s.progressBuffer} />
                  <div className={s.progressFill} style={{ width: `${pct}%` }} />
                </div>
                <button type="button" className={s.speedBtn} onClick={cycleSpeed}>
                  {formatSpeed(speed)}
                </button>
                <button type="button" className={s.ctrlBtn} aria-label="音量">
                  <Volume2 size={18} />
                </button>
                <button type="button" className={s.ctrlBtn} aria-label="全屏">
                  <Maximize size={18} />
                </button>
              </div>
            </div>

            <div className={s.metaPanel}>
              <div className={s.metaTags}>
                {course.tags.map((tag) => (
                  <span key={`${tag.type}-${tag.label}`} className={pillClassFor(tag)}>
                    {tag.label}
                  </span>
                ))}
              </div>
              <h2 className={s.metaTitle}>{course.title}</h2>
              <div className={s.metaSubtitle}>{course.subtitle}</div>

              <div className={s.metaStats}>
                <div className={s.metaStat}>
                  <div className={s.metaStatLabel}>
                    <Clock size={12} />
                    课程时长
                  </div>
                  <div className={`${s.metaStatValue} ${s.metaStatValueMono}`}>
                    {course.duration}
                  </div>
                </div>
                <div className={s.metaStat}>
                  <div className={s.metaStatLabel}>
                    <UserCircle size={12} />
                    主讲
                  </div>
                  <div className={s.metaStatValue}>{course.instructor.name}</div>
                </div>
                <div className={s.metaStat}>
                  <div className={s.metaStatLabel}>
                    <Building2 size={12} />
                    所属单位
                  </div>
                  <div className={s.metaStatValue}>{course.instructor.org}</div>
                </div>
                <div className={s.metaStat}>
                  <div className={s.metaStatLabel}>
                    <Calendar size={12} />
                    更新日期
                  </div>
                  <div className={`${s.metaStatValue} ${s.metaStatValueMono}`}>
                    {course.updatedAt}
                  </div>
                </div>
              </div>

              <div className={s.metaDesc}>
                {course.description.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>

          <aside>
            <div className={s.sidePanel}>
              <div className={s.sideHead}>
                <span className={s.sideTitle}>课程目录</span>
                <span className={s.sideMeta}>
                  <strong>
                    {doneCount}/{chapters.length}
                  </strong>{' '}
                  已学
                </span>
              </div>
              <div className={s.chapterList}>
                {chapters.map((chapter, idx) => {
                  const stateClass =
                    chapter.state === 'current'
                      ? s.chapterCurrent
                      : chapter.state === 'done'
                        ? s.chapterDone
                        : '';
                  const metaContent =
                    chapter.state === 'done' ? (
                      <span className={s.chapterMetaDone}>
                        <CheckCircle size={11} />
                        已学完
                      </span>
                    ) : chapter.state === 'current' ? (
                      <span className={s.chapterMetaCurrent}>
                        <PlayCircle size={11} />
                        正在播放
                      </span>
                    ) : (
                      <>
                        <Clock size={11} />
                        {chapter.duration}
                      </>
                    );
                  return (
                    <button
                      type="button"
                      key={`${chapter.title}-${idx}`}
                      className={`${s.chapter} ${stateClass}`}
                      onClick={() => seekChapter(idx)}
                    >
                      <div className={s.chapterIdx}>{String(idx + 1).padStart(2, '0')}</div>
                      <div className={s.chapterBody}>
                        <div className={s.chapterTitle}>{chapter.title}</div>
                        <div className={s.chapterMeta}>{metaContent}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const course = useMemo(() => getCourseDetail(courseId), [courseId]);

  return (
    <PageShell>
      <CourseRunner key={course.id} course={course} />
    </PageShell>
  );
}
