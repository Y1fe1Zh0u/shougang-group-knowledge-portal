import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  PenLine,
  Tag,
  User,
  UserPlus,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import {
  DOMAINS,
  EXPERTS,
  HERO_STATS,
  QUESTIONS,
  SORT_TABS,
  STATUS_FILTERS,
  TOPIC_CHIPS,
} from '../data/expertQaMock';
import type {
  ExpertDomainKey,
  QuestionEntry,
  QuestionStatus,
  StatusFilterKey,
} from '../data/expertQaMock';
import s from './ExpertQAPage.module.css';

type SortKey = 'latest' | 'hot' | 'unanswered' | 'bounty';

const STATUS_LABEL: Record<QuestionStatus, { text: string; cls: string; icon?: typeof CheckCircle }> = {
  solved: { text: '已解决', cls: s.solved, icon: CheckCircle },
  unsolved: { text: '待采纳', cls: s.unsolved },
  urgent: { text: '紧急', cls: s.urgent, icon: AlertTriangle },
  bounty: { text: '悬赏', cls: s.bounty, icon: Award },
  pending: { text: '未回答', cls: s.unsolved },
};

function StatusPill({ status, bounty }: { status: QuestionStatus; bounty?: number }) {
  if (status === 'bounty' && bounty) {
    return (
      <span className={`${s.statusPill} ${s.bounty}`}>
        <Award size={11} />
        悬赏 {bounty} 积分
      </span>
    );
  }
  const meta = STATUS_LABEL[status];
  const Icon = meta.icon;
  return (
    <span className={`${s.statusPill} ${meta.cls}`}>
      {Icon ? <Icon size={11} /> : null}
      {meta.text}
    </span>
  );
}

function QuestionCard({ q }: { q: QuestionEntry }) {
  const accepted = q.acceptedPreview;
  return (
    <Link to={`/expert-qa/${q.id}`} className={s.qCard}>
      <div className={s.qStatsCol}>
        <div className={s.statBlock}>
          <span className={s.statNum}>{q.votes}</span>
          <span className={s.statLb}>投票</span>
        </div>
        <div
          className={`${s.statBlock} ${s.statAns} ${q.acceptedAnswers > 0 ? s.statSolved : ''}`}
        >
          <span className={s.statNum}>{q.answers}</span>
          <span className={s.statLb}>{q.acceptedAnswers > 0 ? '已采纳' : '回答'}</span>
        </div>
        <div className={`${s.statBlock} ${s.statViews}`}>
          <span className={s.statNum}>{q.views}</span>
          <span className={s.statLb}>浏览</span>
        </div>
      </div>
      <div className={s.qBody}>
        <div className={s.qMeta}>
          <span className={s.domainPill}>{q.domain}</span>
          <StatusPill status={q.status} bounty={q.bounty} />
          {q.invitedSummary ? (
            <span className={s.targetExpert}>
              <User size={11} />
              {q.invitedSummary}
            </span>
          ) : q.status === 'urgent' ? (
            <span className={`${s.statusPill} ${s.unsolved}`}>未回答</span>
          ) : null}
        </div>
        <h3 className={s.qTitle}>{q.title}</h3>
        <p className={s.qExcerpt}>{q.excerpt}</p>
        {accepted ? (
          <div className={s.answerPreview}>
            <div className={s.answerPreviewHead}>
              <span className={s.answerPreviewName}>
                <span className={s.expBadge}>
                  <BadgeCheck size={12} />
                </span>
                {accepted.author.name} · {accepted.author.role.replace(' · ', '')}
              </span>
              {accepted.accepted ? (
                <span className={s.acceptedFlag}>
                  <CheckCircle size={12} />
                  已采纳
                </span>
              ) : null}
            </div>
            <p className={s.answerPreviewText}>{accepted.excerpt}</p>
          </div>
        ) : null}
        <div className={s.qFooter}>
          <div className={s.askedBy}>
            <span className={s.askedAv}>{q.asker.initial}</span>
            <span className={s.askedName}>{q.asker.name}</span>
            <span className={s.askedAt}>{q.askedAt}</span>
          </div>
          <div className={s.tagWrap}>
            {q.tags.map((t) => (
              <span key={t} className={s.tagPill}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ExpertQAPage() {
  const [activeDomain, setActiveDomain] = useState<ExpertDomainKey>('all');
  const [activeStatus, setActiveStatus] = useState<StatusFilterKey | null>(null);
  const [sort, setSort] = useState<SortKey>('latest');

  return (
    <PageShell>
      <section className={s.heroStrip}>
        <div className={s.heroInner}>
          <div className={s.heroL}>
            <h1 className={s.heroTitle}>专家问答 · 一线问题，专家解答</h1>
            <p className={s.heroSub}>
              提问时可指定业务域或邀请特定专家，专家应答后所有同事可参与讨论与追问
            </p>
            <div className={s.heroStats}>
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className={s.heroStat}>
                  <span className={s.heroStatNum}>{stat.value}</span>
                  <span className={s.heroStatLb}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={s.heroAction}>
            <Link to="/expert-qa/ask" className={s.askBtn}>
              <PenLine size={15} />
              我要提问
            </Link>
          </div>
        </div>
      </section>

      <div className={s.container}>
        <div className={s.crumbs}>
          <Link to="/">首页</Link>
          <span> · </span>
          <span>专家问答</span>
        </div>

        <div className={s.layout}>
          <aside className={s.left}>
            <div className={s.leftCard}>
              <div className={s.leftLabel}>业务域</div>
              {DOMAINS.map((d) => {
                const Icon = d.icon;
                const active = d.key === activeDomain;
                return (
                  <button
                    key={d.key}
                    type="button"
                    className={`${s.filterItem} ${active ? s.filterActive : ''}`}
                    onClick={() => setActiveDomain(d.key)}
                  >
                    <span className={s.filterLabel}>
                      <Icon size={14} className={s.filterIco} />
                      {d.label}
                    </span>
                    <span className={s.filterCt}>{d.count}</span>
                  </button>
                );
              })}
            </div>
            <div className={s.leftCard}>
              <div className={s.leftLabel}>状态</div>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`${s.filterItem} ${activeStatus === f.key ? s.filterActive : ''}`}
                  onClick={() =>
                    setActiveStatus((prev) => (prev === f.key ? null : f.key))
                  }
                >
                  <span className={s.filterLabel}>{f.label}</span>
                  <span className={s.filterCt}>{f.count}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className={s.center}>
            <div className={s.sortBar}>
              <div className={s.sortTabs}>
                {SORT_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`${s.sortTab} ${sort === tab.key ? s.sortTabActive : ''}`}
                    onClick={() => setSort(tab.key as SortKey)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className={s.sortMeta}>
                共 <strong>1,284</strong> 个问题 · 12 名专家在线
              </div>
            </div>

            {QUESTIONS.map((q) => (
              <QuestionCard key={q.id} q={q} />
            ))}

            <div className={s.pagination}>
              <button type="button" className={s.pgBtn} aria-label="上一页">
                <ChevronLeft size={14} />
              </button>
              <button type="button" className={`${s.pgBtn} ${s.pgBtnActive}`}>1</button>
              <button type="button" className={s.pgBtn}>2</button>
              <button type="button" className={s.pgBtn}>3</button>
              <span className={s.pgEllipsis}>···</span>
              <button type="button" className={s.pgBtn}>26</button>
              <button type="button" className={s.pgBtn} aria-label="下一页">
                <ChevronRight size={14} />
              </button>
            </div>
          </main>

          <aside className={s.right}>
            <div className={s.rightCard}>
              <div className={s.rightTitle}>
                <Award size={15} className={s.rightTitleIco} />
                本周活跃专家
                <span className={s.rightTitleMore}>全部 ›</span>
              </div>
              {EXPERTS.map((expert) => (
                <div key={expert.id} className={s.expRow}>
                  <div
                    className={`${s.avatar} ${s.avatarExpert}`}
                    style={{ backgroundColor: expert.avatarColor }}
                  >
                    {expert.initial}
                  </div>
                  <div className={s.expInfo}>
                    <div className={s.expName}>
                      {expert.name}
                      <span className={s.expBadge}>
                        <BadgeCheck size={12} />
                      </span>
                    </div>
                    <div className={s.expRole}>{expert.role}</div>
                  </div>
                  <div className={s.expCt}>回答 {expert.answerCount}</div>
                </div>
              ))}
            </div>

            <div className={s.rightCard}>
              <div className={s.rightTitle}>
                <Tag size={15} className={s.rightTitleIco} />
                热门话题
              </div>
              <div className={s.topicChips}>
                {TOPIC_CHIPS.map((chip) => (
                  <button key={chip.label} type="button" className={s.topicChip}>
                    {chip.label}
                    <span className={s.topicCount}>{chip.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={`${s.rightCard} ${s.applyCard}`}>
              <div className={s.rightTitle}>
                <UserPlus size={15} className={s.rightTitleIco} />
                成为专家
              </div>
              <p className={s.applyDesc}>
                有十年以上一线经验、希望分享专业知识？联系后台管理员申请专家认证，认证后将出现在专家库与首页推荐位。
              </p>
              <button type="button" className={s.applyBtn}>
                <MessageCircle size={13} />
                申请认证
              </button>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
