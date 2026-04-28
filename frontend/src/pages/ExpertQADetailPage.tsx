import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  BarChart3,
  Bookmark,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Flag,
  Link2,
  MessageCircle,
  MessageSquare,
  Send,
  Share2,
  ThumbsUp,
  User,
  UserCheck,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import { QUESTION_DETAIL } from '../data/expertQaMock';
import type { AnswerEntry, QuestionStatus } from '../data/expertQaMock';
import s from './ExpertQADetailPage.module.css';

const STATUS_LABEL: Record<QuestionStatus, { text: string; cls: string }> = {
  solved: { text: '已解决', cls: s.solved },
  unsolved: { text: '待采纳', cls: s.unsolved },
  urgent: { text: '紧急', cls: s.urgent },
  bounty: { text: '悬赏中', cls: s.bounty },
  pending: { text: '未回答', cls: s.unsolved },
};

function StatusPill({ status }: { status: QuestionStatus }) {
  const meta = STATUS_LABEL[status];
  const Icon = status === 'solved' ? CheckCircle : status === 'urgent' ? AlertTriangle : null;
  return (
    <span className={`${s.statusPill} ${meta.cls}`}>
      {Icon ? <Icon size={11} /> : null}
      {meta.text}
    </span>
  );
}

function AnswerCard({ answer }: { answer: AnswerEntry }) {
  const wrapClass = [
    s.answer,
    answer.isExpert ? s.answerExpert : '',
    answer.isAccepted ? s.answerAccepted : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={wrapClass}>
      <div className={s.voteCol}>
        <button type="button" className={`${s.voteBtn} ${answer.isAccepted ? s.voteUpAct : ''}`}>
          <ChevronUp size={15} />
        </button>
        <span className={s.voteCount}>{answer.votes}</span>
        <button type="button" className={s.voteBtn}>
          <ChevronDown size={15} />
        </button>
        <button type="button" className={s.bookmarkBtn} aria-label="收藏">
          <Bookmark size={15} />
        </button>
      </div>
      <div className={s.answerMain}>
        {answer.isAccepted ? (
          <div className={s.acceptedBanner}>
            <Check size={13} />
            已采纳为最佳回答
          </div>
        ) : null}
        <div className={s.answerHead}>
          <div
            className={`${s.avatar} ${s.avatarLg} ${answer.isExpert ? s.avatarExpert : ''}`}
            style={{ backgroundColor: answer.author.avatarColor }}
          >
            {answer.author.initial}
          </div>
          <div className={s.answerAuthor}>
            <div className={s.answerName}>
              {answer.author.name}
              {answer.isExpert ? (
                <span className={s.expBadge}>
                  <BadgeCheck size={12} />
                </span>
              ) : null}
            </div>
            <div className={s.answerRole}>
              {[answer.author.role, answer.author.experience, answer.author.resolveRate ? `解决率 ${answer.author.resolveRate}%` : null]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
          <span className={s.answerTs}>{answer.ts}</span>
        </div>

        <div
          className={s.answerBody}
          dangerouslySetInnerHTML={{ __html: answer.bodyHtml }}
        />

        {answer.relatedDoc ? (
          <div className={s.relatedDocWrap}>
            <span className={s.relatedDoc}>
              <FileText size={13} />
              {answer.relatedDoc.label}
            </span>
          </div>
        ) : null}

        {answer.showAcceptCta ? (
          <button type="button" className={s.acceptCta}>
            <Check size={13} />
            采纳为最佳回答
          </button>
        ) : null}

        <div className={s.answerFoot}>
          <div className={s.answerActions}>
            <button type="button">
              <ThumbsUp size={13} />
              有用 ({answer.helpful})
            </button>
            <button type="button">
              <MessageCircle size={13} />
              评论 {answer.commentCount > 0 ? `(${answer.commentCount})` : ''}
            </button>
            <button type="button">
              <Share2 size={13} />
              分享
            </button>
          </div>
        </div>

        {answer.comments && answer.comments.length > 0 ? (
          <div className={s.commentSection}>
            {answer.comments.map((c) => (
              <div key={c.id} className={s.comment}>
                <span className={s.commentAv}>{c.initial}</span>
                <span className={s.commentText}>
                  <span className={s.commentName}>{c.name}</span>
                  {c.text}
                  <span className={s.commentTs}>{c.ts}</span>
                </span>
              </div>
            ))}
            <div className={s.commentInput}>
              <input placeholder="添加评论..." />
              <button type="button">发布</button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function ExpertQADetailPage() {
  const params = useParams();
  const q = QUESTION_DETAIL;
  const [sortMode, setSortMode] = useState<'top' | 'latest'>('top');
  const [draft, setDraft] = useState('');

  void params; // demo: route param is informational only

  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.crumbs}>
          <Link to="/">首页</Link>
          <span> · </span>
          <Link to="/expert-qa">专家问答</Link>
          <span> · </span>
          <span>{q.domain}</span>
          <span> · </span>
          <span>问题详情</span>
        </div>

        <div className={s.layout}>
          <main>
            <div className={s.qHeader}>
              <div className={s.qHeaderMeta}>
                <span className={s.domainPill}>{q.domain}</span>
                <StatusPill status={q.status} />
                {q.invitedSummary ? (
                  <span className={s.targetExpert}>
                    <User size={11} />
                    {q.invitedSummary.replace('邀请：', '邀请：')}
                  </span>
                ) : null}
              </div>
              <h1 className={s.qHeaderTitle}>{q.title}</h1>
              <div className={s.qHeaderRow}>
                <div className={s.askedInfo}>
                  <span className={`${s.avatar} ${s.avatarSm}`}>{q.asker.initial}</span>
                  <span>
                    <span className={s.askedName}>{q.asker.name}</span>
                    {q.asker.role ? ` · ${q.asker.role}` : null}
                    {' · '}
                    {q.askedAt}
                  </span>
                  <span className={s.divider}>|</span>
                  <span>浏览 {q.views} 次</span>
                </div>
                <div className={s.actBtns}>
                  <button type="button" className={s.btnGhost}>
                    <Bookmark size={14} />
                    收藏
                  </button>
                  <button type="button" className={s.btnGhost}>
                    <Share2 size={14} />
                    分享
                  </button>
                </div>
              </div>
            </div>

            <div className={s.qContent}>
              <div className={s.voteCol}>
                <button type="button" className={`${s.voteBtn} ${s.voteUpAct}`}>
                  <ChevronUp size={15} />
                </button>
                <span className={s.voteCount}>{q.votes}</span>
                <button type="button" className={s.voteBtn}>
                  <ChevronDown size={15} />
                </button>
                <button type="button" className={s.bookmarkBtn} aria-label="收藏">
                  <Bookmark size={15} />
                </button>
              </div>
              <div className={s.qContentMain}>
                <div className={s.qBodyText}>
                  {q.bodyParagraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  <h4>已排查项</h4>
                  <ol>
                    {q.checkedItems.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                  <p>{q.followups}</p>
                  {q.relatedDoc ? (
                    <span className={s.relatedDoc}>
                      <FileText size={13} />
                      {q.relatedDoc.label}
                    </span>
                  ) : null}
                </div>
                <div className={s.qFooter}>
                  <div className={s.tagWrap}>
                    {q.tags.map((tag) => (
                      <span key={tag} className={s.tagPill}>{tag}</span>
                    ))}
                    <span className={s.tagPill}>液面控制</span>
                  </div>
                  <div className={s.answerActions}>
                    <button type="button">
                      <MessageCircle size={13} />
                      追问 (4)
                    </button>
                    <button type="button">
                      <Flag size={13} />
                      举报
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={s.answersHeader}>
              <h2>{q.fullAnswers.length} 个回答</h2>
              <div className={s.sortToggle}>
                <button
                  type="button"
                  className={sortMode === 'top' ? s.sortActive : ''}
                  onClick={() => setSortMode('top')}
                >
                  最高赞
                </button>
                <button
                  type="button"
                  className={sortMode === 'latest' ? s.sortActive : ''}
                  onClick={() => setSortMode('latest')}
                >
                  最新
                </button>
              </div>
            </div>

            {q.fullAnswers.map((answer) => (
              <AnswerCard key={answer.id} answer={answer} />
            ))}

            <div className={s.yourAnswerCard}>
              <h3 className={s.yourAnswerTitle}>
                <MessageSquare size={15} className={s.yourAnswerIco} />
                你也来回答
              </h3>
              <textarea
                className={s.yourAnswerInput}
                placeholder="基于你的经验帮助提问者，专家身份的回答会被高亮显示..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className={s.yourAnswerFoot}>
                <span className={s.yourAnswerHint}>
                  支持 Markdown · 可粘贴图片 · 回答后可被采纳为最佳答案
                </span>
                <div className={s.yourAnswerBtns}>
                  <button type="button" className={s.btnGhost}>预览</button>
                  <button type="button" className={s.btnPrimary}>
                    <Send size={13} />
                    发布回答
                  </button>
                </div>
              </div>
            </div>
          </main>

          <aside className={s.right}>
            <div className={s.sideCard}>
              <div className={s.sideTitle}>
                <BarChart3 size={15} className={s.sideTitleIco} />
                问题概况
              </div>
              <div className={s.qStat}>
                <span>状态</span>
                <span className={s.qStatVal}>已解决</span>
              </div>
              <div className={s.qStat}>
                <span>悬赏积分</span>
                <span className={s.qStatVal}>200</span>
              </div>
              <div className={s.qStat}>
                <span>邀请专家</span>
                <span className={s.qStatVal}>{q.invitedExperts.length} 人</span>
              </div>
              <div className={s.qStat}>
                <span>专家回答</span>
                <span className={s.qStatVal}>
                  {q.invitedExperts.filter((e) => e.status === 'answered').length} / {q.invitedExperts.length}
                </span>
              </div>
              <div className={s.qStat}>
                <span>关注者</span>
                <span className={s.qStatVal}>{q.followers}</span>
              </div>
            </div>

            <div className={s.sideCard}>
              <div className={s.sideTitle}>
                <UserCheck size={15} className={s.sideTitleIco} />
                受邀专家
              </div>
              {q.invitedExperts.map(({ expert, status }) => (
                <div key={expert.id} className={s.invitedRow}>
                  <div
                    className={`${s.avatar} ${s.avatarExpert}`}
                    style={{ backgroundColor: expert.avatarColor }}
                  >
                    {expert.initial}
                  </div>
                  <div className={s.invitedInfo}>
                    <div className={s.invitedName}>
                      {expert.name}
                      <span className={s.expBadge}>
                        <BadgeCheck size={12} />
                      </span>
                    </div>
                    <div className={s.invitedRole}>{expert.role}</div>
                  </div>
                  <span className={`${s.invitedStatus} ${status === 'answered' ? s.invitedAnswered : s.invitedPending}`}>
                    {status === 'answered' ? '已答复' : '待回复'}
                  </span>
                </div>
              ))}
            </div>

            <div className={s.sideCard}>
              <div className={s.sideTitle}>
                <Link2 size={15} className={s.sideTitleIco} />
                相关问答
              </div>
              {q.related.map((item) => (
                <Link
                  key={item.id}
                  to={`/expert-qa/${item.id}`}
                  className={s.relQa}
                >
                  {item.title}
                  <div className={s.relQaMeta}>{item.meta}</div>
                </Link>
              ))}
            </div>

            <div className={`${s.sideCard} ${s.bountyCard}`}>
              <div className={s.sideTitle}>
                <Award size={15} className={s.sideTitleIco} />
                悬赏说明
              </div>
              <p className={s.bountyText}>
                悬赏积分将在提问者采纳回答后由系统自动发放。如 7 天内未采纳，积分将退还提问者。
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
