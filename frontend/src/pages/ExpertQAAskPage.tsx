import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  BadgeCheck,
  Bold,
  Code,
  Image as ImageIcon,
  Italic,
  Lightbulb,
  Link2,
  List,
  Paperclip,
  Plus,
  Quote,
  Save,
  Search,
  Send,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import { ASK_DRAFT, DOMAINS, EXPERTS } from '../data/expertQaMock';
import type { ExpertDomainKey, ExpertProfile } from '../data/expertQaMock';
import s from './ExpertQAAskPage.module.css';

const DOMAIN_OPTIONS = DOMAINS.filter((d) => d.key !== 'all');

const TOOLBAR_BUTTONS = [
  { key: 'bold', icon: Bold, title: '加粗' },
  { key: 'italic', icon: Italic, title: '斜体' },
  { key: 'list', icon: List, title: '列表' },
  { key: 'sep1', sep: true },
  { key: 'quote', icon: Quote, title: '引用' },
  { key: 'code', icon: Code, title: '代码' },
  { key: 'sep2', sep: true },
  { key: 'image', icon: ImageIcon, title: '插入图片' },
  { key: 'attach', icon: Paperclip, title: '附件' },
  { key: 'related', icon: Link2, title: '关联文档' },
] as const;

export default function ExpertQAAskPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState(ASK_DRAFT.title);
  const [body, setBody] = useState(ASK_DRAFT.body);
  const [domain, setDomain] = useState<ExpertDomainKey>(ASK_DRAFT.domainKey);
  const [invited, setInvited] = useState<ExpertProfile[]>(ASK_DRAFT.invited);
  const [tags, setTags] = useState<string[]>(ASK_DRAFT.tags);
  const [tagInput, setTagInput] = useState('');
  const [bountyOn, setBountyOn] = useState(true);
  const [bountyAmount, setBountyAmount] = useState(ASK_DRAFT.bounty);
  const [anonymous, setAnonymous] = useState(false);

  const recommendedSet = useMemo(() => new Set(invited.map((e) => e.id)), [invited]);

  function toggleInvite(expert: ExpertProfile) {
    setInvited((current) => {
      if (current.some((e) => e.id === expert.id)) {
        return current.filter((e) => e.id !== expert.id);
      }
      if (current.length >= 3) return current;
      return [...current, expert];
    });
  }

  function addTag() {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setTagInput('');
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handlePublish() {
    navigate('/expert-qa');
  }

  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.crumbs}>
          <Link to="/">首页</Link>
          <span> · </span>
          <Link to="/expert-qa">专家问答</Link>
          <span> · </span>
          <span>提问</span>
        </div>

        <div className={s.layout}>
          <main className={s.formCard}>
            <h2 className={s.formTitle}>发起提问</h2>
            <p className={s.formSub}>
              清晰的标题与背景描述，能让专家更快定位问题、给出准确回答
            </p>

            <div className={s.field}>
              <label className={s.fieldLabel}>
                问题标题<span className={s.req}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={s.input}
              />
              <div className={s.hint}>
                建议以一句完整问句描述，包含设备/工艺/现象关键词
              </div>
            </div>

            <div className={s.field}>
              <label className={s.fieldLabel}>
                所属业务域<span className={s.req}>*</span>
              </label>
              <div className={s.domainGrid}>
                {DOMAIN_OPTIONS.map((d) => {
                  const Icon = d.icon;
                  const selected = d.key === domain;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setDomain(d.key)}
                      className={`${s.domainOpt} ${selected ? s.domainOptSel : ''}`}
                    >
                      <Icon size={22} className={s.domainIco} />
                      <span className={s.domainName}>{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={s.field}>
              <label className={s.fieldLabel}>
                详细描述<span className={s.req}>*</span>
              </label>
              <div className={s.editorBar}>
                {TOOLBAR_BUTTONS.map((btn) => {
                  if ('sep' in btn) {
                    return <span key={btn.key} className={s.editorSep} aria-hidden />;
                  }
                  const Icon = btn.icon;
                  return (
                    <button
                      key={btn.key}
                      type="button"
                      title={btn.title}
                      className={s.editorBtn}
                    >
                      <Icon size={15} />
                    </button>
                  );
                })}
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className={`${s.input} ${s.textarea}`}
              />
              <div className={s.hint}>
                支持 Markdown · 可粘贴图片 · 推荐附上现场照片或趋势曲线
              </div>
            </div>

            <div className={s.field}>
              <label className={s.fieldLabel}>
                邀请专家
                <span className={s.optional}>（可选，最多 3 人）</span>
              </label>
              <div className={s.expertChips}>
                {invited.map((expert) => (
                  <span key={expert.id} className={s.expChipSel}>
                    <span
                      className={s.expChipAv}
                      style={{ backgroundColor: expert.avatarColor }}
                    >
                      {expert.initial}
                    </span>
                    {expert.name}
                    <button
                      type="button"
                      className={s.expChipX}
                      onClick={() => toggleInvite(expert)}
                      aria-label={`移除 ${expert.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {invited.length < 3 ? (
                  <button type="button" className={s.addExp}>
                    <Plus size={13} />
                    添加专家
                  </button>
                ) : null}
              </div>
              <div className={s.hint}>未邀请专家时，问题将向所选业务域的全部认证专家公开</div>
            </div>

            <div className={s.row2}>
              <div className={s.field}>
                <label className={s.fieldLabel}>问题标签</label>
                <div className={s.tagInput}>
                  {tags.map((tag) => (
                    <span key={tag} className={s.tagChip}>
                      {tag}
                      <button
                        type="button"
                        className={s.tagX}
                        onClick={() => removeTag(tag)}
                        aria-label={`移除 ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    placeholder="输入后按回车添加"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                </div>
              </div>
              <div className={s.field}>
                <label className={s.fieldLabel}>关联文档</label>
                <input
                  type="text"
                  className={s.input}
                  placeholder="搜索关联首钢知库内文档"
                />
                <div className={s.hint}>已关联：1 篇 · 振动纹排查指引 V2.1</div>
              </div>
            </div>

            <div className={s.row2}>
              <div className={s.switchRow}>
                <button
                  type="button"
                  className={`${s.switch} ${bountyOn ? s.switchOn : ''}`}
                  onClick={() => setBountyOn((v) => !v)}
                  aria-pressed={bountyOn}
                  aria-label="悬赏积分"
                />
                <div className={s.switchBody}>
                  <div className={s.switchLb}>悬赏积分</div>
                  <div className={s.switchHt}>
                    {bountyOn ? `${bountyAmount} 积分 · 被采纳后发放` : '当前未设置悬赏'}
                  </div>
                </div>
                <input
                  type="number"
                  value={bountyAmount}
                  onChange={(e) => setBountyAmount(Number(e.target.value) || 0)}
                  className={s.bountyInput}
                  disabled={!bountyOn}
                />
              </div>
              <div className={s.switchRow}>
                <button
                  type="button"
                  className={`${s.switch} ${anonymous ? s.switchOn : ''}`}
                  onClick={() => setAnonymous((v) => !v)}
                  aria-pressed={anonymous}
                  aria-label="匿名提问"
                />
                <div className={s.switchBody}>
                  <div className={s.switchLb}>匿名提问</div>
                  <div className={s.switchHt}>隐藏提问者姓名，仅专家可见</div>
                </div>
              </div>
            </div>

            <div className={s.actionBar}>
              <span className={s.draftHint}>
                <Save size={13} />
                草稿已自动保存于 14:32
              </span>
              <div className={s.actionBtns}>
                <button type="button" className={s.btnGhost}>预览</button>
                <button type="button" className={s.btnPrimary} onClick={handlePublish}>
                  <Send size={14} />
                  发布提问
                </button>
              </div>
            </div>
          </main>

          <aside className={s.right}>
            <div className={`${s.sideCard} ${s.tipsCard}`}>
              <div className={s.sideTitle}>
                <Lightbulb size={15} className={s.tipsIcon} />
                提问小贴士
              </div>
              <ul className={s.tipList}>
                <li>先描述<strong>现象</strong>与<strong>已做检查</strong>，再提出问题</li>
                <li>附上现场照片、趋势曲线、点检表</li>
                <li>注明设备编号、钢种、规格</li>
                <li>避免与其他用户重复提问，优先在右上角检索</li>
                <li>采纳最佳回答可帮助沉淀知识</li>
              </ul>
            </div>

            <div className={s.sideCard}>
              <div className={s.sideTitle}>
                <Award size={15} className={s.sideTitleIco} />
                推荐邀请的专家
              </div>
              <div className={s.recommendNote}>
                基于业务域「{DOMAIN_OPTIONS.find((d) => d.key === domain)?.label || ''}」自动推荐
              </div>
              {ASK_DRAFT.recommended.map((expert) => {
                const isInvited = recommendedSet.has(expert.id);
                return (
                  <div key={expert.id} className={s.recommendExpert}>
                    <div
                      className={`${s.avatar} ${s.avatarExpert}`}
                      style={{ backgroundColor: expert.avatarColor }}
                    >
                      {expert.initial}
                    </div>
                    <div className={s.recommendInfo}>
                      <div className={s.recommendName}>
                        {expert.name}
                        <span className={s.expBadge}>
                          <BadgeCheck size={12} />
                        </span>
                      </div>
                      <div className={s.recommendRole}>
                        {expert.role.replace(' · ', ' · ')}
                        {expert.resolveRate ? ` · 解决率 ${expert.resolveRate}%` : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`${s.inviteBtn} ${isInvited ? s.inviteBtnActive : ''}`}
                      onClick={() => toggleInvite(expert)}
                      disabled={!isInvited && invited.length >= 3}
                    >
                      {isInvited ? '已邀请' : '邀请'}
                    </button>
                  </div>
                );
              })}
              {/* fallback: extras from EXPERTS not in recommended list */}
              {EXPERTS.filter(
                (e) => !ASK_DRAFT.recommended.some((r) => r.id === e.id)
              )
                .slice(0, 1)
                .map((expert) => {
                  const isInvited = recommendedSet.has(expert.id);
                  return (
                    <div key={expert.id} className={s.recommendExpert}>
                      <div
                        className={`${s.avatar} ${s.avatarExpert}`}
                        style={{ backgroundColor: expert.avatarColor }}
                      >
                        {expert.initial}
                      </div>
                      <div className={s.recommendInfo}>
                        <div className={s.recommendName}>
                          {expert.name}
                          <span className={s.expBadge}>
                            <BadgeCheck size={12} />
                          </span>
                        </div>
                        <div className={s.recommendRole}>
                          {expert.role}
                          {expert.resolveRate ? ` · 解决率 ${expert.resolveRate}%` : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`${s.inviteBtn} ${isInvited ? s.inviteBtnActive : ''}`}
                        onClick={() => toggleInvite(expert)}
                        disabled={!isInvited && invited.length >= 3}
                      >
                        {isInvited ? '已邀请' : '邀请'}
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className={s.sideCard}>
              <div className={s.sideTitle}>
                <Search size={15} className={s.sideTitleIco} />
                类似问题
              </div>
              {ASK_DRAFT.similar.map((title) => (
                <div key={title} className={s.similarItem}>{title}</div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
