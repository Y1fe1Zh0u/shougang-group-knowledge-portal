/* ------------------------------------------------------------------ */
/*  Mock data for 首钢知库 - Steel Industry Knowledge Portal          */
/* ------------------------------------------------------------------ */

// ======================= Interfaces =======================

export interface BannerItem {
  label: string;
  title: string;
  desc: string;
  bgColor: string;
  link?: string;
}

export interface DomainItem {
  name: string;
  spaceId: number;
  color: string;
  bg: string;
  icon: string;
}

export interface SectionConfig {
  title: string;
  tag: string;
  link: string;
  icon: string;
}

export interface AppItem {
  id: number;
  name: string;
  icon: string;
  desc: string;
  color: string;
  bg: string;
}

export interface SpaceItem {
  id: number;
  name: string;
  fileCount: number;
  tagCount: number;
}

export interface TagItem {
  id: number;
  name: string;
}

export interface FileItem {
  id: number;
  spaceId: number;
  title: string;
  summary: string;
  source: string;
  date: string;
  tags: string[];
  ext: string;
}

export interface FileDetail extends FileItem {
  space: { id: number; name: string };
}

// ======================= Config =======================

export const CFG = {
  name: '首钢知库',

  hot: ['设备故障', '质量异议', '安全课程', '能源调度'],

  banners: [
    {
      label: '平台概览',
      title: '首钢知库 — 钢铁行业知识共享平台',
      desc: '汇聚设备、轧线、冷轧、能源全域知识，助力技术传承与创新',
      bgColor: '#122351',
    },
    {
      label: '专题推荐',
      title: '典型案例·事故分析专题上线',
      desc: '从实践中学习，从案例中成长，构建安全生产知识体系',
      bgColor: '#0f3a2a',
    },
    {
      label: '能力升级',
      title: '技术问答全新升级',
      desc: 'AI 驱动的智能问答系统，快速定位知识、精准解答技术难题',
      bgColor: '#2a1a4a',
    },
  ] as BannerItem[],

  domains: [
    // Homepage business-domain order follows the frontend array order; the homepage only slices the first N items.
    { name: '设备', spaceId: 25, color: '#2563eb', bg: '#eff6ff', icon: 'Settings' },
    { name: '轧线', spaceId: 12, color: '#059669', bg: '#d1fae5', icon: 'Factory' },
    { name: '冷轧', spaceId: 18, color: '#6366f1', bg: '#ede9fe', icon: 'Snowflake' },
    { name: '能源', spaceId: 30, color: '#d97706', bg: '#fef3c7', icon: 'Zap' },
    { name: '安全', spaceId: 35, color: '#dc2626', bg: '#fee2e2', icon: 'Shield' },
    { name: '质量', spaceId: 40, color: '#7c3aed', bg: '#f5f3ff', icon: 'CheckCircle' },
    { name: '生产', spaceId: 45, color: '#0f766e', bg: '#ccfbf1', icon: 'Factory' },
    { name: '环保', spaceId: 50, color: '#16a34a', bg: '#dcfce7', icon: 'Leaf' },
    { name: '物流', spaceId: 45, color: '#1d4ed8', bg: '#dbeafe', icon: 'Truck' },
    { name: '调度', spaceId: 45, color: '#ea580c', bg: '#ffedd5', icon: 'Network' },
    { name: '检修', spaceId: 25, color: '#475569', bg: '#e2e8f0', icon: 'Wrench' },
    { name: '培训', spaceId: 35, color: '#be185d', bg: '#fce7f3', icon: 'GraduationCap' },
  ] as DomainItem[],

  sections: [
    { title: '知识推荐 · 最新精选', tag: '最新精选', link: '/list?tag=最新精选', icon: 'Star' },
    { title: '典型案例 · 事故分析', tag: '典型案例', link: '/list?tag=典型案例', icon: 'AlertTriangle' },
  ] as SectionConfig[],

  qaHot: [
    '振动纹通常如何排查？',
    '热轧精轧机轴承维护周期是多久？',
    '冷轧板面缺陷有哪些常见类型？',
    '高炉煤气利用率如何提升？',
    '安全巡检标准操作流程是什么？',
  ],

  apps: [
    { id: 1, name: '写作助手', icon: 'PenLine', desc: '智能写作辅助工具，快速生成技术文档', color: '#2563eb', bg: '#eff6ff' },
    { id: 2, name: '语义搜索', icon: 'Search', desc: '精准检索语义匹配，深度挖掘知识', color: '#059669', bg: '#d1fae5' },
    { id: 3, name: '智能问答', icon: 'MessageSquare', desc: '知识问答即时回答，AI 驱动', color: '#7c3aed', bg: '#f5f3ff' },
    { id: 4, name: '文档翻译', icon: 'Globe', desc: '多语翻译文档互译，支持主流语种', color: '#d97706', bg: '#fef3c7' },
    { id: 5, name: '报告生成', icon: 'BarChart3', desc: '自动汇总分析数据，生成专业报告', color: '#dc2626', bg: '#fee2e2' },
    { id: 6, name: '知识图谱', icon: 'Network', desc: '可视化知识关联，发现隐性关系', color: '#0891b2', bg: '#cffafe' },
  ] as AppItem[],
};

// ======================= Spaces =======================

export const SPACES: SpaceItem[] = [
  { id: 12, name: '轧线技术案例库', fileCount: 156, tagCount: 8 },
  { id: 18, name: '冷轧技术手册', fileCount: 89, tagCount: 5 },
  { id: 25, name: '设备维修规范', fileCount: 234, tagCount: 12 },
  { id: 30, name: '能源管理文档', fileCount: 67, tagCount: 6 },
  { id: 35, name: '安全培训资料', fileCount: 112, tagCount: 9 },
  { id: 40, name: '质量管理体系', fileCount: 78, tagCount: 7 },
  { id: 45, name: '生产调度手册', fileCount: 45, tagCount: 4 },
  { id: 50, name: '环保合规文档', fileCount: 33, tagCount: 3 },
];

// ======================= Space Tags =======================

export const SPACE_TAGS: Record<number, TagItem[]> = {
  12: [
    { id: 101, name: '热轧' },
    { id: 102, name: '精轧机' },
    { id: 103, name: '振动纹' },
    { id: 104, name: '粗轧' },
    { id: 105, name: '轧辊' },
    { id: 106, name: '板形控制' },
    { id: 107, name: '温度控制' },
    { id: 108, name: '最新精选' },
    { id: 109, name: '典型案例' },
    { id: 110, name: '层流冷却' },
  ],
  18: [
    { id: 201, name: '冷轧' },
    { id: 202, name: '酸洗' },
    { id: 203, name: '退火' },
    { id: 204, name: '镀锌' },
    { id: 205, name: '板面缺陷' },
    { id: 206, name: '轧制力' },
    { id: 207, name: '最新精选' },
    { id: 208, name: '典型案例' },
    { id: 209, name: '平整' },
  ],
  25: [
    { id: 301, name: '轴承' },
    { id: 302, name: '液压系统' },
    { id: 303, name: '电气维护' },
    { id: 304, name: '减速机' },
    { id: 305, name: '设备点检' },
    { id: 306, name: '故障诊断' },
    { id: 307, name: '润滑管理' },
    { id: 308, name: '备件管理' },
    { id: 309, name: '最新精选' },
    { id: 310, name: '典型案例' },
    { id: 311, name: '预防维修' },
    { id: 312, name: '振动分析' },
  ],
  30: [
    { id: 401, name: '高炉煤气' },
    { id: 402, name: '余热回收' },
    { id: 403, name: '能源调度' },
    { id: 404, name: '节能降耗' },
    { id: 405, name: '电力管理' },
    { id: 406, name: '蒸汽系统' },
    { id: 407, name: '最新精选' },
    { id: 408, name: '典型案例' },
  ],
  35: [
    { id: 501, name: '安全巡检' },
    { id: 502, name: '事故分析' },
    { id: 503, name: '应急预案' },
    { id: 504, name: '消防安全' },
    { id: 505, name: '特种作业' },
    { id: 506, name: '安全培训' },
    { id: 507, name: '最新精选' },
    { id: 508, name: '典型案例' },
    { id: 509, name: '职业健康' },
  ],
  40: [
    { id: 601, name: '质量检测' },
    { id: 602, name: '质量异议' },
    { id: 603, name: '工艺标准' },
    { id: 604, name: '统计分析' },
    { id: 605, name: '体系审核' },
    { id: 606, name: '持续改进' },
    { id: 607, name: '最新精选' },
    { id: 608, name: '典型案例' },
  ],
  45: [
    { id: 701, name: '调度优化' },
    { id: 702, name: '产能计划' },
    { id: 703, name: '排产管理' },
    { id: 704, name: '物流协调' },
    { id: 705, name: '库存管理' },
    { id: 706, name: '最新精选' },
  ],
  50: [
    { id: 801, name: '废气排放' },
    { id: 802, name: '废水处理' },
    { id: 803, name: '固废管理' },
    { id: 804, name: '环保法规' },
    { id: 805, name: '碳排放' },
    { id: 806, name: '最新精选' },
  ],
};

// ======================= Files =======================

export const FILES: FileItem[] = [
  // --- Space 12: 轧线技术案例库 ---
  {
    id: 1580,
    spaceId: 12,
    title: '热轧1580产线精轧机振动纹治理实践',
    summary: '针对1580产线精轧机组出现的振动纹缺陷，通过振动频谱分析定位振源，采取轧辊磨削工艺优化、轴承座刚度加强、AGC系统参数调整等综合措施，成功将振动纹发生率从12%降至0.8%。',
    source: '首钢京唐技术中心',
    date: '2026-04-13',
    tags: ['热轧', '精轧机', '振动纹', '最新精选', '典型案例'],
    ext: 'pdf',
  },
  {
    id: 1602,
    spaceId: 12,
    title: '热连轧精轧机振动纹异常案例复盘',
    summary: '对2026年3月精轧机F3-F5机架出现的异常振动纹进行系统复盘，分析工作辊磨损、支撑辊偏心、轧制速度匹配等关键因素，总结排查流程与应对策略。',
    source: '轧钢事业部',
    date: '2026-04-10',
    tags: ['振动纹', '热轧', '典型案例'],
    ext: 'pdf',
  },
  {
    id: 1583,
    spaceId: 12,
    title: '粗轧区R2立辊调宽技术改进报告',
    summary: '通过优化R2立辊调宽液压控制逻辑与辊缝标定方法，解决了带钢头部宽度超差问题，宽度命中率提升至99.2%。',
    source: '首钢京唐轧钢部',
    date: '2026-04-08',
    tags: ['粗轧', '板形控制', '最新精选'],
    ext: 'docx',
  },
  {
    id: 1590,
    spaceId: 12,
    title: '层流冷却系统水量分配优化方案',
    summary: '基于有限元热传导模型优化层流冷却段水量分配，实现带钢卷取温度波动控制在±8℃以内，有效改善卷取后力学性能均匀性。',
    source: '首钢技术研究院',
    date: '2026-04-05',
    tags: ['层流冷却', '温度控制'],
    ext: 'pdf',
  },
  {
    id: 1595,
    spaceId: 12,
    title: '热轧轧辊磨损预测模型与换辊策略',
    summary: '建立基于轧制公里数、轧制力、带钢材质的轧辊磨损预测模型，制定差异化换辊策略，轧辊单位消耗降低15%。',
    source: '轧钢事业部',
    date: '2026-04-01',
    tags: ['轧辊', '热轧'],
    ext: 'xlsx',
  },

  // --- Space 18: 冷轧技术手册 ---
  {
    id: 1801,
    spaceId: 18,
    title: '冷轧酸洗线酸液浓度控制技术规范',
    summary: '规范酸洗线盐酸浓度在线监测与自动补酸控制流程，确保酸洗质量稳定，减少欠酸洗与过酸洗缺陷发生。',
    source: '冷轧事业部',
    date: '2026-04-12',
    tags: ['冷轧', '酸洗', '最新精选'],
    ext: 'pdf',
  },
  {
    id: 1805,
    spaceId: 18,
    title: '连续退火炉温度场均匀性改善措施',
    summary: '针对连续退火炉横向温差过大问题，通过辐射管布局优化和炉辊对中调整，将横向温差从±15℃缩小至±6℃。',
    source: '冷轧技术室',
    date: '2026-04-09',
    tags: ['退火', '冷轧', '典型案例'],
    ext: 'pdf',
  },
  {
    id: 1810,
    spaceId: 18,
    title: '镀锌板表面白锈缺陷分析与控制',
    summary: '系统分析镀锌板在存储运输过程中出现白锈的原因，从镀层钝化工艺、包装防潮措施等方面提出改善方案。',
    source: '冷轧事业部',
    date: '2026-04-06',
    tags: ['镀锌', '板面缺陷', '典型案例'],
    ext: 'docx',
  },
  {
    id: 1815,
    spaceId: 18,
    title: '冷轧平整机延伸率控制精度提升',
    summary: '通过平整机轧制力模型优化与延伸率反馈控制参数整定，将延伸率控制精度提升至±0.05%，有效改善成品板形质量。',
    source: '冷轧技术室',
    date: '2026-03-30',
    tags: ['平整', '轧制力', '最新精选'],
    ext: 'pptx',
  },

  // --- Space 25: 设备维修规范 ---
  {
    id: 2501,
    spaceId: 25,
    title: '精轧机工作辊轴承维护周期与检查标准',
    summary: '制定精轧机工作辊轴承的分级维护周期标准，明确日常点检、定期拆检和大修的具体内容与判废标准，降低非计划停机风险。',
    source: '设备管理部',
    date: '2026-04-13',
    tags: ['轴承', '设备点检', '预防维修', '最新精选'],
    ext: 'pdf',
  },
  {
    id: 2505,
    spaceId: 25,
    title: '液压伺服阀故障诊断与维修手册',
    summary: '汇总液压伺服阀常见故障模式、诊断方法及维修步骤，包含阀芯卡涩、反馈信号异常、内泄量超标等典型故障处理方案。',
    source: '设备管理部',
    date: '2026-04-11',
    tags: ['液压系统', '故障诊断', '典型案例'],
    ext: 'pdf',
  },
  {
    id: 2510,
    spaceId: 25,
    title: '主传动减速机齿轮箱振动异常分析',
    summary: '通过振动频谱分析与油液铁谱分析，定位减速机齿轮箱振动异常原因为中间轴齿轮点蚀，制定修复与监测方案。',
    source: '首钢京唐设备部',
    date: '2026-04-07',
    tags: ['减速机', '振动分析', '故障诊断', '典型案例'],
    ext: 'pdf',
  },
  {
    id: 2515,
    spaceId: 25,
    title: '轧线电气传动系统预防维修规程',
    summary: '规范轧线主传动电机、变频器和整流变压器的预防维修内容、周期及验收标准，确保电气系统可靠运行。',
    source: '设备管理部',
    date: '2026-04-03',
    tags: ['电气维护', '预防维修'],
    ext: 'docx',
  },
  {
    id: 2520,
    spaceId: 25,
    title: '设备润滑管理标准与油品选用指南',
    summary: '建立设备分级润滑管理体系，明确各类设备润滑点的油品型号、换油周期、取样检测标准。',
    source: '设备管理部',
    date: '2026-03-31',
    tags: ['润滑管理', '备件管理', '最新精选'],
    ext: 'xlsx',
  },

  // --- Space 30: 能源管理文档 ---
  {
    id: 3001,
    spaceId: 30,
    title: '高炉煤气利用率提升技术方案',
    summary: '分析高炉煤气产生、输配与利用环节的损耗点，提出管网压力优化、用户端燃烧效率提升等综合措施，目标利用率提升至98%。',
    source: '能源管理中心',
    date: '2026-04-12',
    tags: ['高炉煤气', '节能降耗', '最新精选', '典型案例'],
    ext: 'pdf',
  },
  {
    id: 3005,
    spaceId: 30,
    title: '转炉余热蒸汽回收系统运行优化',
    summary: '对转炉汽化冷却余热锅炉运行参数进行优化，提升蒸汽品质和回收量，年节约标煤约3200吨。',
    source: '能源管理中心',
    date: '2026-04-08',
    tags: ['余热回收', '蒸汽系统'],
    ext: 'docx',
  },
  {
    id: 3010,
    spaceId: 30,
    title: '全厂电力负荷预测与调度优化模型',
    summary: '建立基于LSTM神经网络的电力负荷预测模型，结合分时电价策略优化调度方案，年节约电费约560万元。',
    source: '首钢技术研究院',
    date: '2026-04-02',
    tags: ['电力管理', '能源调度', '典型案例'],
    ext: 'pdf',
  },

  // --- Space 35: 安全培训资料 ---
  {
    id: 3501,
    spaceId: 35,
    title: '2026年度安全生产巡检标准操作规程',
    summary: '更新年度安全巡检标准，涵盖高温作业、有限空间、起重作业等重点风险区域的巡检内容、频次和记录要求。',
    source: '安全环保部',
    date: '2026-04-11',
    tags: ['安全巡检', '安全培训', '最新精选'],
    ext: 'pdf',
  },
  {
    id: 3505,
    spaceId: 35,
    title: '煤气中毒事故案例分析与应急处置',
    summary: '汇编近三年行业内煤气中毒典型事故案例，分析事故原因链，提出应急处置流程和预防管控要点。',
    source: '安全环保部',
    date: '2026-04-09',
    tags: ['事故分析', '应急预案', '典型案例'],
    ext: 'pptx',
  },
  {
    id: 3510,
    spaceId: 35,
    title: '特种作业人员资质管理与培训计划',
    summary: '规范特种作业人员（电工、焊工、起重司机等）的资质审核、持续教育和能力评估管理流程。',
    source: '安全环保部',
    date: '2026-04-04',
    tags: ['特种作业', '安全培训'],
    ext: 'docx',
  },
  {
    id: 3515,
    spaceId: 35,
    title: '消防系统年度检测与维保报告',
    summary: '汇总全厂消防设施年度检测结果，包括自动喷水灭火系统、火灾报警系统、消防水池等设施的运行状态评估。',
    source: '安全环保部',
    date: '2026-03-29',
    tags: ['消防安全', '安全巡检'],
    ext: 'pdf',
  },

  // --- Space 40: 质量管理体系 ---
  {
    id: 4001,
    spaceId: 40,
    title: '热轧带钢力学性能不合格质量异议处理报告',
    summary: '某批次热轧带钢抗拉强度低于标准下限，通过成分复验、工艺追溯和金相分析定位原因，制定赔偿与改进方案。',
    source: '质量管理部',
    date: '2026-04-13',
    tags: ['质量异议', '质量检测', '典型案例', '最新精选'],
    ext: 'pdf',
  },
  {
    id: 4005,
    spaceId: 40,
    title: 'IATF 16949质量管理体系内审检查清单',
    summary: '依据IATF 16949:2016标准条款编制的内审检查清单，覆盖过程方法、风险评估、FMEA和控制计划等核心要素。',
    source: '质量管理部',
    date: '2026-04-07',
    tags: ['体系审核', '工艺标准'],
    ext: 'xlsx',
  },
  {
    id: 4010,
    spaceId: 40,
    title: '冷轧产品尺寸精度SPC统计分析月报',
    summary: '3月冷轧产品厚度、宽度、板形等尺寸指标的SPC控制图分析，识别异常波动点并提出纠正措施。',
    source: '质量管理部',
    date: '2026-04-01',
    tags: ['统计分析', '质量检测', '持续改进'],
    ext: 'xlsx',
  },

  // --- Space 45: 生产调度手册 ---
  {
    id: 4501,
    spaceId: 45,
    title: '热轧产线月度排产计划编制指南',
    summary: '规范热轧产线月度排产计划的编制流程，包括订单优先级排序、轧制单元组批规则和换辊计划协调等内容。',
    source: '生产调度中心',
    date: '2026-04-10',
    tags: ['排产管理', '产能计划', '最新精选'],
    ext: 'docx',
  },
  {
    id: 4505,
    spaceId: 45,
    title: '原料-炼钢-轧钢物流协调优化方案',
    summary: '通过建立铁水调度、钢坯库存和轧线节奏的联动优化模型，缩短工序间等待时间，提高全流程物流效率。',
    source: '生产调度中心',
    date: '2026-04-03',
    tags: ['物流协调', '调度优化'],
    ext: 'pdf',
  },

  // --- Space 50: 环保合规文档 ---
  {
    id: 5001,
    spaceId: 50,
    title: '烧结烟气超低排放改造项目技术报告',
    summary: '烧结烟气脱硫脱硝除尘超低排放改造工程技术方案，改造后颗粒物≤10mg/m³、SO₂≤35mg/m³、NOₓ≤50mg/m³。',
    source: '安全环保部',
    date: '2026-04-11',
    tags: ['废气排放', '环保法规', '最新精选'],
    ext: 'pdf',
  },
  {
    id: 5005,
    spaceId: 50,
    title: '钢铁企业碳排放核算方法与报告编制',
    summary: '依据国家发改委钢铁行业碳排放核算指南，编制年度碳排放报告的方法学说明与数据采集要求。',
    source: '安全环保部',
    date: '2026-04-05',
    tags: ['碳排放', '环保法规'],
    ext: 'pdf',
  },
  {
    id: 5010,
    spaceId: 50,
    title: '工业废水深度处理与回用技术规范',
    summary: '规范钢铁企业工业废水深度处理工艺流程，包括混凝沉淀、超滤膜和反渗透等关键工序的运行参数与水质标准。',
    source: '安全环保部',
    date: '2026-03-28',
    tags: ['废水处理', '固废管理'],
    ext: 'docx',
  },
  {
    id: 5012,
    spaceId: 12,
    title: '热轧产线板形异常处置案例汇编',
    summary: '汇总热轧产线近两年的典型板形异常案例，覆盖辊缝设定偏差、冷却不均和来料波动等问题的处置经验。',
    source: '轧钢事业部',
    date: '2026-04-14',
    tags: ['热轧', '板形控制', '典型案例'],
    ext: 'pdf',
  },
  {
    id: 5013,
    spaceId: 25,
    title: '主传动减速机故障诊断案例复盘',
    summary: '围绕减速机异响、温升和振动异常，整理多起现场维修案例，形成故障诊断与备件更换的标准化复盘模板。',
    source: '设备工程部',
    date: '2026-04-12',
    tags: ['减速机', '故障诊断', '典型案例'],
    ext: 'pdf',
  },
  {
    id: 5014,
    spaceId: 35,
    title: '煤气区域违章作业事故案例警示',
    summary: '整理煤气区域作业过程中发生的违章操作案例，分析作业许可、监护缺失和现场隔离不到位带来的风险。',
    source: '安全环保部',
    date: '2026-04-09',
    tags: ['安全巡检', '事故分析', '典型案例'],
    ext: 'pdf',
  },
  {
    id: 5015,
    spaceId: 40,
    title: '客户质量异议处理案例集',
    summary: '选取汽车板和家电板典型质量异议案例，归纳表面缺陷追溯、责任判定和纠正措施的处理路径。',
    source: '质量管理部',
    date: '2026-04-07',
    tags: ['质量异议', '持续改进', '典型案例'],
    ext: 'docx',
  },
];

// ======================= AI Responses =======================

export const AI_RESPONSES: Record<string, string> = {
  '振动纹': `关于振动纹排查，以下是常见思路：

1. **频谱分析定位振源**：通过振动传感器采集精轧机各机架的振动信号，进行FFT频谱分析，确定振动主频与机架转速的关系，区分强迫振动与自激振动。
2. **轧辊状态检查**：检查工作辊和支撑辊的磨损情况、辊面粗糙度及辊型曲线，确认是否存在偏心或局部磨损导致的周期性激振。
3. **轴承座与牌坊检查**：测量轴承座与牌坊窗口间隙，检查压下螺丝与垫板配合精度，排除机械松动引起的振动放大。
4. **AGC系统参数排查**：检查液压AGC响应频率设置是否合理，避免控制系统与机械系统产生共振，必要时降低AGC增益或调整滤波参数。
5. **轧制工艺匹配**：核查轧制速度、压下量分配和张力设定是否在合理范围内，不当的工艺参数可能激发系统固有振动。`,

  '设备': `关于设备管理，以下是核心要点：

1. **预防维修体系**：建立设备分级预防维修制度，根据设备重要度和故障后果确定A/B/C级维护策略，A级设备实施状态监测维修。
2. **点检管理标准化**：推行设备点检定修制，明确日常点检、专业点检和精密点检的内容、周期和判定标准，确保早期发现潜在故障。
3. **故障诊断技术应用**：综合运用振动分析、油液分析、红外热成像和超声检测等技术手段，实现故障精准定位与趋势预警。
4. **备件管理优化**：建立关键备件安全库存模型，结合设备可靠性数据和供应周期制定差异化备件策略，平衡库存成本与停机风险。
5. **设备全生命周期管理**：从设备选型、安装调试、运行维护到报废更新，建立完整的数据档案和费用追踪体系。`,

  '质量': `关于质量管理，以下是关键方向：

1. **质量检测标准化**：严格执行国标和客户标准，关键质量参数实施在线自动检测与SPC统计过程控制，异常及时报警处理。
2. **质量异议闭环管理**：建立质量异议快速响应机制，48小时内完成初步原因分析，制定纠正预防措施并跟踪验证效果。
3. **工艺质量关联分析**：利用大数据分析冶炼成分、轧制参数与产品性能之间的映射关系，优化工艺窗口，减少质量波动。
4. **体系审核与持续改进**：定期开展内部审核和管理评审，运用PDCA循环持续改进质量管理体系，确保满足IATF 16949要求。
5. **供应链质量协同**：加强对上游原料和下游客户的质量信息共享，建立供应商质量评价体系和客户满意度反馈机制。`,

  '安全': `关于安全管理，以下是重点措施：

1. **安全巡检制度化**：建立分级安全巡检体系，重点区域（煤气区域、高温作业区、有限空间）每班必检，一般区域每日巡检并做好记录。
2. **事故案例学习**：定期组织典型事故案例学习，通过事故树分析和原因链追溯，举一反三完善安全管理制度和操作规程。
3. **应急预案演练**：每季度至少开展一次综合应急演练，每月开展专项演练（煤气泄漏、火灾、机械伤害等），检验预案可操作性。
4. **特种作业管控**：特种作业人员100%持证上岗，定期开展技能复审和安全再教育，动火作业、受限空间作业严格执行审批制度。
5. **安全文化建设**：推行全员安全观察与报告制度，鼓励隐患上报，营造"人人管安全"的企业安全文化氛围。`,

  '能源': `关于能源管理，以下是核心策略：

1. **煤气综合利用**：优化高炉煤气、转炉煤气和焦炉煤气的管网调度，减少放散损耗，提升自发电比例，综合利用率目标≥97%。
2. **余热余能回收**：挖掘烧结矿显热、转炉烟气余热、加热炉烟气余热等资源，通过余热锅炉和热管换热器回收利用，降低外购能源消耗。
3. **电力负荷优化**：利用分时电价差异，合理安排大功率设备运行时段，推行电力需求侧管理，年节约电费目标500万元以上。
4. **能源管理信息系统**：建设覆盖全厂的能源管理信息系统（EMS），实现能源数据实时采集、平衡分析和异常预警。
5. **节能技术推广**：持续推进变频调速、高效电机、LED照明等成熟节能技术的应用，每年完成节能项目不少于10项。`,

  '冷轧': `关于冷轧工艺，以下是核心知识：

1. **酸洗工艺控制**：严格控制酸洗线盐酸浓度（120-180g/L）、温度（75-85℃）和带钢运行速度的匹配关系，避免欠酸洗导致氧化铁皮残留或过酸洗造成表面粗糙。
2. **轧制润滑与板形**：合理选择轧制油品种和浓度，优化乳化液过滤精度和温度控制，确保润滑条件稳定，减少板面缺陷和热划伤。
3. **连续退火工艺**：根据钢种和产品要求制定退火温度曲线，重点控制加热段均热温度、缓冷和快冷速率，确保再结晶充分且力学性能达标。
4. **镀锌层质量控制**：控制锌锅温度（455-465℃）、铝含量（0.18-0.22%）和气刀参数，确保镀层均匀、附着力良好、锌花形态满足要求。
5. **板面缺陷管理**：建立缺陷在线检测（表面检测仪）和离线判定相结合的质量管控体系，对辊印、划伤、锈斑等典型缺陷建立标准样板库。`,

  default: `感谢您的提问。以下是一些通用建议：

1. **知识检索**：建议使用语义搜索功能，输入关键词或自然语言描述，系统将智能匹配最相关的技术文档和案例。
2. **文档浏览**：您可以通过知识域分类或空间目录快速定位所需文档，支持按时间、标签和文件类型筛选。
3. **案例学习**：推荐浏览"典型案例"专区，汇集了设备故障处理、质量改进和安全事故分析等实践经验。
4. **知识贡献**：欢迎您将工作中的技术总结、操作经验上传至对应知识空间，促进团队知识共享与传承。
5. **反馈建议**：如有任何使用问题或功能建议，请通过平台反馈入口提交，我们将持续优化平台体验。`,
};

// ======================= Helper functions =======================

const META_TAGS = ['最新精选', '典型案例'];

export function queryFiles(params: {
  q?: string;
  tag?: string;
  sids?: number[];
  ext?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}): { data: FileItem[]; total: number; page: number; pageSize: number } {
  const { q, tag, sids, ext, sort, page = 1, pageSize = 10 } = params;
  let result = [...FILES];

  if (q) {
    const kw = q.toLowerCase();
    result = result.filter(
      (f) =>
        f.title.toLowerCase().includes(kw) ||
        f.summary.toLowerCase().includes(kw) ||
        f.tags.some((t) => t.toLowerCase().includes(kw)),
    );
  }
  if (tag) result = result.filter((f) => f.tags.includes(tag));
  if (sids && sids.length) result = result.filter((f) => sids.includes(f.spaceId));
  if (ext) result = result.filter((f) => f.ext === ext);

  if (sort === 'oldest') {
    result.sort((a, b) => a.date.localeCompare(b.date));
  } else {
    result.sort((a, b) => b.date.localeCompare(a.date));
  }

  const total = result.length;
  const start = (page - 1) * pageSize;
  return { data: result.slice(start, start + pageSize), total, page, pageSize };
}

export function spaceFiles(params: {
  sid: number;
  ext?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
}): { data: FileItem[]; total: number; page: number; pageSize: number } {
  const { sid, ext, tag, page = 1, pageSize = 10 } = params;
  let result = FILES.filter((f) => f.spaceId === sid);

  if (ext) result = result.filter((f) => f.ext === ext);
  if (tag) result = result.filter((f) => f.tags.includes(tag));

  result.sort((a, b) => b.date.localeCompare(a.date));

  const total = result.length;
  const start = (page - 1) * pageSize;
  return { data: result.slice(start, start + pageSize), total, page, pageSize };
}

export function getFileDetail(fid: number): FileDetail | null {
  const file = FILES.find((f) => f.id === fid);
  if (!file) return null;
  const space = SPACES.find((s) => s.id === file.spaceId);
  return {
    ...file,
    space: space ? { id: space.id, name: space.name } : { id: file.spaceId, name: '未知空间' },
  };
}

export function getRelatedFiles(fid: number, limit = 5): FileItem[] {
  const file = FILES.find((f) => f.id === fid);
  if (!file) return [];

  const contentTags = file.tags.filter((t) => !META_TAGS.includes(t));
  if (!contentTags.length) return [];

  const scored = FILES.filter((f) => f.id !== fid)
    .map((f) => {
      const overlap = f.tags.filter((t) => contentTags.includes(t) && !META_TAGS.includes(t)).length;
      return { file: f, score: overlap };
    })
    .filter((s) => s.score > 0);

  scored.sort((a, b) => b.score - a.score || b.file.date.localeCompare(a.file.date));

  return scored.slice(0, limit).map((s) => s.file);
}

export function getAIResponse(q: string): string {
  const lower = q.toLowerCase();
  for (const key of Object.keys(AI_RESPONSES)) {
    if (key !== 'default' && lower.includes(key)) return AI_RESPONSES[key];
  }
  return AI_RESPONSES['default'];
}

export function allTags(): string[] {
  const set = new Set<string>();
  for (const tags of Object.values(SPACE_TAGS)) {
    for (const t of tags) {
      if (!META_TAGS.includes(t.name)) set.add(t.name);
    }
  }
  return [...set].sort();
}

export function formatDate(d: string): string {
  return d.slice(0, 10);
}

export function getTagColor(name: string): 'blue' | 'amber' | 'green' | 'red' {
  const colors: ('blue' | 'amber' | 'green' | 'red')[] = ['blue', 'amber', 'green', 'red'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}
