import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  CheckCircle,
  LayoutGrid,
  Leaf,
  Settings,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';

export type ExpertDomainKey =
  | 'all'
  | 'mgmt'
  | 'safety'
  | 'env'
  | 'device'
  | 'tech'
  | 'quality'
  | 'people';

export type QuestionStatus = 'solved' | 'unsolved' | 'urgent' | 'bounty' | 'pending';

export type StatusFilterKey =
  | 'all'
  | 'unsolved'
  | 'solved'
  | 'bounty'
  | 'mine'
  | 'invited';

export interface DomainOption {
  key: ExpertDomainKey;
  label: string;
  icon: LucideIcon;
  count: number;
}

export interface ExpertProfile {
  id: string;
  initial: string;
  name: string;
  role: string;
  avatarColor: string;
  domainKey: ExpertDomainKey;
  isExpert: boolean;
  answerCount?: number;
  resolveRate?: number;
  experience?: string;
}

export interface AnswerComment {
  id: string;
  initial: string;
  name: string;
  text: string;
  ts: string;
}

export interface AnswerEntry {
  id: string;
  author: ExpertProfile;
  isAccepted: boolean;
  isExpert: boolean;
  votes: number;
  ts: string;
  bodyHtml: string;
  helpful: number;
  commentCount: number;
  comments?: AnswerComment[];
  showAcceptCta?: boolean;
  relatedDoc?: { label: string; href?: string };
}

export interface QuestionAsker {
  initial: string;
  name: string;
  role?: string;
}

export interface QuestionEntry {
  id: string;
  title: string;
  excerpt: string;
  domain: string;
  domainKey: ExpertDomainKey;
  status: QuestionStatus;
  bounty?: number;
  invitedSummary?: string;
  votes: number;
  answers: number;
  acceptedAnswers: number;
  views: number;
  asker: QuestionAsker;
  askedAt: string;
  tags: string[];
  acceptedPreview?: {
    author: ExpertProfile;
    excerpt: string;
    accepted: boolean;
  };
}

export interface QuestionDetail extends QuestionEntry {
  bodyParagraphs: string[];
  checkedItems: string[];
  followups: string;
  relatedDoc?: { label: string };
  followers: number;
  invitedExperts: { expert: ExpertProfile; status: 'answered' | 'pending' }[];
  answers: number;
  fullAnswers: AnswerEntry[];
  related: { id: string; title: string; meta: string }[];
}

export interface TopicChip {
  label: string;
  count: number;
}

export const DOMAINS: DomainOption[] = [
  { key: 'all', label: '全部', icon: LayoutGrid, count: 1284 },
  { key: 'mgmt', label: '管理', icon: Briefcase, count: 186 },
  { key: 'safety', label: '安全', icon: Shield, count: 214 },
  { key: 'env', label: '环保', icon: Leaf, count: 142 },
  { key: 'device', label: '设备', icon: Settings, count: 241 },
  { key: 'tech', label: '技术', icon: Wrench, count: 268 },
  { key: 'quality', label: '质量', icon: CheckCircle, count: 158 },
  { key: 'people', label: '人员', icon: Users, count: 75 },
];

export const STATUS_FILTERS: { key: StatusFilterKey; label: string; count: number }[] = [
  { key: 'unsolved', label: '未解决', count: 186 },
  { key: 'solved', label: '已解决', count: 874 },
  { key: 'bounty', label: '悬赏中', count: 42 },
  { key: 'mine', label: '我提问的', count: 7 },
  { key: 'invited', label: '邀请我的', count: 3 },
];

export const SORT_TABS: { key: 'latest' | 'hot' | 'unanswered' | 'bounty'; label: string }[] = [
  { key: 'latest', label: '最新' },
  { key: 'hot', label: '最热' },
  { key: 'unanswered', label: '未回答' },
  { key: 'bounty', label: '悬赏' },
];

export const EXPERTS: ExpertProfile[] = [
  {
    id: 'lzh',
    initial: '李',
    name: '李振华',
    role: '冷轧厂 · 工艺主任师',
    avatarColor: '#0e7490',
    domainKey: 'tech',
    isExpert: true,
    answerCount: 18,
    resolveRate: 96,
    experience: '21 年经验',
  },
  {
    id: 'zjg',
    initial: '赵',
    name: '赵建国',
    role: '设备 · 诊断高级工程师',
    avatarColor: '#7c3aed',
    domainKey: 'device',
    isExpert: true,
    answerCount: 14,
    resolveRate: 92,
    experience: '18 年经验',
  },
  {
    id: 'zwb',
    initial: '郑',
    name: '郑文博',
    role: '能源中心 · 副主任工程师',
    avatarColor: '#b45309',
    domainKey: 'env',
    isExpert: true,
    answerCount: 12,
    resolveRate: 88,
    experience: '15 年经验',
  },
  {
    id: 'lgh',
    initial: '林',
    name: '林国辉',
    role: '环保 · 监测室主任',
    avatarColor: '#15803d',
    domainKey: 'env',
    isExpert: true,
    answerCount: 9,
    resolveRate: 89,
    experience: '12 年经验',
  },
  {
    id: 'hl',
    initial: '何',
    name: '何丽',
    role: '质量 · 检验科科长',
    avatarColor: '#1d4ed8',
    domainKey: 'quality',
    isExpert: true,
    answerCount: 7,
    resolveRate: 90,
    experience: '14 年经验',
  },
];

export const TOPIC_CHIPS: TopicChip[] = [
  { label: '振动纹', count: 86 },
  { label: '轴承诊断', count: 62 },
  { label: '煤气平衡', count: 48 },
  { label: '表面缺陷', count: 41 },
  { label: '备件管理', count: 37 },
  { label: '能耗优化', count: 29 },
  { label: '环保监测', count: 22 },
];

const REGULAR_USER: ExpertProfile = {
  id: 'xm',
  initial: '徐',
  name: '徐明',
  role: '炼钢厂连铸操作工',
  avatarColor: '#475569',
  domainKey: 'tech',
  isExpert: false,
};

export const QUESTIONS: QuestionEntry[] = [
  {
    id: 'q-2050-vibration',
    title: '2050mm 冷轧机出口振动纹周期性出现，停机检修后复发，可能原因？',
    excerpt:
      '最近一周 2050 机组出现周期性振动纹，间距约 110mm。检修组已对支撑辊偏心、传动轴系做过校核，复产 36 小时后症状再次出现，请教各位专家如何系统排查。',
    domain: '技术',
    domainKey: 'tech',
    status: 'solved',
    invitedSummary: '邀请：李振华 等 2 人',
    votes: 12,
    answers: 3,
    acceptedAnswers: 3,
    views: 486,
    asker: { initial: '王', name: '王志强', role: '冷轧厂操作工' },
    askedAt: '提问于 2 小时前',
    tags: ['振动纹', '2050机组'],
    acceptedPreview: {
      author: EXPERTS[0],
      excerpt:
        '建议优先排查保护渣的实际加入量曲线和结晶器液面 PI 控制器的积分时间。我们 2024 年遇到过类似情况，最终定位到是液面控制器…',
      accepted: true,
    },
  },
  {
    id: 'q-gasholder-leak',
    title: '高炉煤气柜活塞漏气量近期偏大，密封液槽油位正常，是否需要更换油封？',
    excerpt:
      '高炉 1#煤气柜活塞下行时漏气量从 3.2 m³/min 上升到 5.8 m³/min，但密封液槽油位与油质均在控制范围内，请问是否需要安排油封更换？',
    domain: '管理',
    domainKey: 'mgmt',
    status: 'bounty',
    bounty: 200,
    votes: 8,
    answers: 2,
    acceptedAnswers: 0,
    views: 213,
    asker: { initial: '陈', name: '陈敏' },
    askedAt: '提问于 5 小时前',
    tags: ['煤气柜', '密封'],
  },
  {
    id: 'q-bearing-frequency',
    title: '主电机轴承温升异常，振动频谱出现 213Hz 边带，如何判断故障类型？',
    excerpt:
      '2# 主电机驱动端轴承温度由 65℃ 升至 78℃，振动频谱在 1×、2× 转频附近出现 213Hz 边带，疑似存在内圈轻微剥落。',
    domain: '设备',
    domainKey: 'device',
    status: 'solved',
    votes: 5,
    answers: 4,
    acceptedAnswers: 4,
    views: 372,
    asker: { initial: '刘', name: '刘海涛' },
    askedAt: '提问于 昨天 14:32',
    tags: ['轴承', '振动诊断'],
    acceptedPreview: {
      author: EXPERTS[1],
      excerpt:
        '213Hz 与 BPFI（内圈通过频率）匹配，结合温度上升曲线，建议在下次计划检修时复测并准备更换轴承，同时缩短点检周期至 4 小时…',
      accepted: true,
    },
  },
  {
    id: 'q-esp-fluctuation',
    title: '烧结机头电除尘出口颗粒物在线检测数据异常波动，可能是什么原因？',
    excerpt:
      '近 24 小时内烧结机头电除尘出口在线监测仪表读数在 8–35 mg/Nm³ 间剧烈波动，环保监管平台已多次告警，怀疑是仪表问题或工艺扰动。',
    domain: '环保',
    domainKey: 'env',
    status: 'urgent',
    votes: 2,
    answers: 0,
    acceptedAnswers: 0,
    views: 68,
    asker: { initial: '孙', name: '孙立伟' },
    askedAt: '提问于 30 分钟前',
    tags: ['电除尘', '在线监测'],
  },
  {
    id: 'q-sphc-pit',
    title: 'SPHC 卷板表面出现规律性凹坑，间距与轧辊周长不一致，怀疑来源是哪一道次？',
    excerpt:
      'SPHC 钢卷在精轧后端面发现规律性凹坑，间距 ~340mm，与精轧 F1–F7 任一辊周长均不匹配，麻烦工艺组长帮忙判断。',
    domain: '质量',
    domainKey: 'quality',
    status: 'unsolved',
    votes: 7,
    answers: 1,
    acceptedAnswers: 0,
    views: 154,
    asker: { initial: '周', name: '周晓燕' },
    askedAt: '提问于 昨天 09:18',
    tags: ['表面缺陷', '精轧'],
  },
];

export const QUESTION_DETAIL: QuestionDetail = {
  ...QUESTIONS[0],
  bodyParagraphs: [
    '最近一周 2050 机组出现周期性振动纹，间距约 110mm，凹凸条纹方向与拉坯方向一致。',
  ],
  checkedItems: [
    '支撑辊偏心已用千分表复测，OK',
    '传动轴系动平衡复校，OK',
    '液压缸保压测试合格',
  ],
  followups:
    '停机检修后复产 36 小时，症状再次出现。请教各位专家如何系统排查，是否可能与结晶器液面控制器参数漂移有关？',
  relatedDoc: { label: '关联文档：振动纹排查指引 V2.1' },
  followers: 36,
  invitedExperts: [
    { expert: EXPERTS[0], status: 'answered' },
    { expert: EXPERTS[1], status: 'answered' },
  ],
  fullAnswers: [
    {
      id: 'a-lzh',
      author: EXPERTS[0],
      isAccepted: true,
      isExpert: true,
      votes: 28,
      ts: '回答于 1 小时前',
      helpful: 28,
      commentCount: 5,
      bodyHtml: `<p>110mm 间距+复发性，第一时间应当怀疑<strong>结晶器液面控制环路</strong>，而不是设备本体。建议优先排查保护渣的实际加入量曲线和结晶器液面 PI 控制器的积分时间。我们 2024 年遇到过类似情况，最终定位到是液面控制器的积分时间被外协调试人员误改。</p>
<p>系统化排查路线：</p>
<ul>
  <li>调取近 7 天结晶器液面 PV 与 SP 的滚动相关系数</li>
  <li>对比同期保护渣加入量与振动周期的相位关系</li>
  <li>检查液面雷达表面是否结垢，影响测量精度</li>
  <li>核对 PI 参数（Kp / Ti）与厂家推荐值</li>
</ul>
<p>如确认为控制器参数问题，按下面参数恢复：</p>
<pre class="codeBlock">PI:
  Kp = 1.8
  Ti = 12s
  Output Limit = ±15%</pre>
<p>另外建议在下次大检修时复校液面雷达零点，并将 PI 参数纳入版本管理。</p>`,
      relatedDoc: { label: '引用：结晶器液面控制 SOP-CC-2024-007' },
      comments: [
        {
          id: 'c1',
          initial: '王',
          name: '王志强',
          text: '感谢李工，已经按你说的复核了 PI 参数，确实积分时间被改成了 8s。',
          ts: '1 小时前',
        },
        {
          id: 'c2',
          initial: '赵',
          name: '赵建国',
          text: '补充一点，下次调整 PI 参数务必要在 MES 里报备审批。',
          ts: '45 分钟前',
        },
      ],
    },
    {
      id: 'a-zjg',
      author: EXPERTS[1],
      isAccepted: false,
      isExpert: true,
      votes: 14,
      ts: '回答于 1 小时前',
      helpful: 14,
      commentCount: 2,
      bodyHtml: `<p>同意李工的判断，再补充一个设备视角：</p>
<p>110mm 间距对应的振动频率，可以反查电机转速 / 减速比，看是否与某一传动级的旋转频率匹配。如果完全无法对应，那基本可以排除设备旋转部件源头。</p>
<p>另外检修复产 36 小时再现，要关注下温度场是否完全稳定 — 升温初期的辊缝补偿如果不准确，也可能引起类似条纹。</p>`,
      showAcceptCta: true,
    },
    {
      id: 'a-xm',
      author: REGULAR_USER,
      isAccepted: false,
      isExpert: false,
      votes: 3,
      ts: '回答于 30 分钟前',
      helpful: 3,
      commentCount: 0,
      bodyHtml: `<p>我们之前也遇到过类似问题，结果是结晶器铜板镀层局部脱落引起的，建议在下次更换结晶器时检查一下铜板状态。</p>`,
    },
  ],
  related: [
    { id: 'r1', title: '连铸坯振动纹排查方法，已检修后复发', meta: '8 个回答 · 3 天前' },
    { id: 'r2', title: '结晶器液面 PI 参数误改后如何快速识别？', meta: '5 个回答 · 上周' },
    { id: 'r3', title: '2030 冷轧机轴承温升，振动谱出现边带', meta: '12 个回答 · 上月' },
  ],
};

export const HERO_STATS = [
  { value: '1,284', label: '问题' },
  { value: '3,217', label: '回答' },
  { value: '68', label: '认证专家' },
  { value: '94%', label: '解决率' },
];

export const ASK_DRAFT = {
  title: '2050mm 冷轧机出口振动纹周期性出现，停机检修后复发，可能原因？',
  body: `最近一周 2050 机组出现周期性振动纹，间距约 110mm。

【已排查】
1. 支撑辊偏心已用千分表复测，OK
2. 传动轴系动平衡复校，OK
3. 液压缸保压测试合格

【现象】
复产 36 小时后症状再次出现，凹凸条纹方向与拉坯方向一致。

请教各位专家如何系统排查，是否可能与结晶器液面控制器参数漂移有关？`,
  domainKey: 'tech' as ExpertDomainKey,
  invited: [EXPERTS[0], EXPERTS[1]],
  recommended: [EXPERTS[0], EXPERTS[1], EXPERTS[3]],
  tags: ['振动纹', '2050机组'],
  bounty: 200,
  similar: [
    '连铸坯振动纹排查方法，已检修后复发',
    '2030 冷轧机轴承温升，振动谱出现边带',
    '板坯表面规律性凹坑来源判断',
  ],
};
