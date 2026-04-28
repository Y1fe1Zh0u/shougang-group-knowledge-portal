export type CourseTagType = 'domain' | 'level' | 'gray';

export interface CourseTag {
  type: CourseTagType;
  label: string;
}

export type CourseChapterState = 'done' | 'current' | 'todo';

export interface CourseChapter {
  title: string;
  duration: string;
  state: CourseChapterState;
}

export interface CourseInstructor {
  name: string;
  org: string;
}

export interface CourseDetail {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  durationSeconds: number;
  updatedAt: string;
  tags: CourseTag[];
  instructor: CourseInstructor;
  description: string[];
  chapters: CourseChapter[];
}

export interface CourseListItem {
  id: string;
  title: string;
  duration: string;
  hot?: boolean;
  domain?: string;
}

export const COURSE_LIST_ITEMS: CourseListItem[] = [
  { id: '1', title: '设备全寿命周期管理培训（下）', duration: '2.5h', hot: true },
  { id: '2', title: '安全生产标准化建设与实践', duration: '1.8h', hot: true },
  { id: '3', title: '钢铁行业碳达峰与智慧能源规划', duration: '2h', domain: '能源' },
  { id: '4', title: '数字化采购供应链协同课程', duration: '1.5h', domain: '采购' },
  { id: '5', title: '高强钢质量缺陷图谱及工艺控制', duration: '2.2h', domain: '质量' },
];

export const COURSE_DETAILS: Record<string, CourseDetail> = {
  '1': {
    id: '1',
    title: '设备全寿命周期管理培训（下）',
    subtitle: 'Equipment Lifecycle Management · Part II',
    duration: '02:30:00',
    durationSeconds: 9000,
    updatedAt: '2026-04-12',
    tags: [
      { type: 'domain', label: '设备' },
      { type: 'level', label: '中级' },
      { type: 'gray', label: '岗位赋能' },
    ],
    instructor: { name: '王海涛', org: '设备管理部' },
    description: [
      '本课程围绕钢铁企业设备全寿命周期管理体系展开，结合首钢实际生产场景，系统讲解从设备选型、安装调试、运行维护到报废更新各阶段的关键管理动作与决策方法。',
      '本节（下）聚焦于设备运行中后期的诊断、维修策略与备件管理，并结合典型故障案例进行复盘分析。',
    ],
    chapters: [
      { title: '课程导引：从生命周期到资产价值', duration: '08:32', state: 'done' },
      { title: '设备状态监测体系框架搭建', duration: '21:45', state: 'done' },
      { title: '振动诊断：频谱与轨迹分析实战', duration: '18:24', state: 'current' },
      { title: '温度与油液监测：参数选型与阈值', duration: '15:08', state: 'todo' },
      { title: '预防性 vs 预测性维修的切换边界', duration: '19:32', state: 'todo' },
      { title: '备件 ABC 分类与安全库存计算', duration: '22:16', state: 'todo' },
      { title: 'LCC 报废评估模型与决策案例', duration: '14:48', state: 'todo' },
      { title: '故障复盘：5# 加热炉燃烧器异响', duration: '19:44', state: 'todo' },
    ],
  },
  '2': {
    id: '2',
    title: '安全生产标准化建设与实践',
    subtitle: 'Safety Production Standardization',
    duration: '01:48:00',
    durationSeconds: 6480,
    updatedAt: '2026-03-28',
    tags: [
      { type: 'domain', label: '安全' },
      { type: 'gray', label: '岗位赋能' },
    ],
    instructor: { name: '赵建国', org: '安全监察部' },
    description: [
      '聚焦钢铁企业安全生产标准化体系建设的关键路径，结合近年事故案例，讲解风险分级管控与隐患排查双重预防机制的落地方法。',
    ],
    chapters: [
      { title: '安全生产标准化基础与体系结构', duration: '12:08', state: 'done' },
      { title: '风险分级管控方法论', duration: '18:42', state: 'current' },
      { title: 'JHA 工作危险分析实战', duration: '15:30', state: 'todo' },
      { title: '隐患排查治理闭环', duration: '14:18', state: 'todo' },
      { title: '应急演练设计与评估', duration: '16:12', state: 'todo' },
      { title: '典型事故案例复盘', duration: '22:30', state: 'todo' },
    ],
  },
  '3': {
    id: '3',
    title: '钢铁行业碳达峰与智慧能源规划',
    subtitle: 'Carbon Peak & Smart Energy Planning',
    duration: '02:00:00',
    durationSeconds: 7200,
    updatedAt: '2026-04-02',
    tags: [
      { type: 'domain', label: '能源' },
      { type: 'gray', label: '前沿' },
    ],
    instructor: { name: '陈博士', org: '能源中心' },
    description: [
      '系统讲解钢铁行业碳达峰路径，结合首钢能源中心建设实践，介绍智慧能源管理与碳资产运营。',
    ],
    chapters: [
      { title: '行业碳排放现状与对标分析', duration: '18:00', state: 'current' },
      { title: '工艺低碳化技术路线图', duration: '24:32', state: 'todo' },
      { title: '智慧能源管理平台架构', duration: '21:18', state: 'todo' },
      { title: '碳资产管理与碳交易实务', duration: '19:24', state: 'todo' },
      { title: '首钢能源中心案例剖析', duration: '17:08', state: 'todo' },
    ],
  },
  '4': {
    id: '4',
    title: '数字化采购供应链协同课程',
    subtitle: 'Digital Procurement & Supply Chain',
    duration: '01:30:00',
    durationSeconds: 5400,
    updatedAt: '2026-03-19',
    tags: [
      { type: 'domain', label: '采购' },
      { type: 'gray', label: '岗位赋能' },
    ],
    instructor: { name: '孙经理', org: '供应链中心' },
    description: [
      '面向采购岗，讲解数字化采购全流程协同方法，覆盖寻源、合同、订单、对账各环节。',
    ],
    chapters: [
      { title: '数字化采购整体框架', duration: '10:32', state: 'current' },
      { title: '战略寻源与品类策略', duration: '16:08', state: 'todo' },
      { title: 'SRM 系统建设要点', duration: '18:42', state: 'todo' },
      { title: '合同订单协同流程', duration: '14:24', state: 'todo' },
      { title: '供应商画像与绩效', duration: '12:08', state: 'todo' },
    ],
  },
  '5': {
    id: '5',
    title: '高强钢质量缺陷图谱及工艺控制',
    subtitle: 'High-Strength Steel Defect Atlas & Process Control',
    duration: '02:12:00',
    durationSeconds: 7920,
    updatedAt: '2026-04-08',
    tags: [
      { type: 'domain', label: '质量' },
      { type: 'level', label: '高级' },
    ],
    instructor: { name: '刘工程师', org: '质量管理部' },
    description: [
      '结合首钢高强钢生产实际，系统梳理常见表面与内部缺陷图谱，并对应给出工艺控制要点。',
    ],
    chapters: [
      { title: '高强钢成分与组织基础', duration: '14:32', state: 'done' },
      { title: '表面缺陷图谱（一）：氧化、压痕', duration: '18:48', state: 'current' },
      { title: '表面缺陷图谱（二）：裂纹、夹杂', duration: '21:16', state: 'todo' },
      { title: '内部缺陷的检测方法', duration: '17:42', state: 'todo' },
      { title: '连铸工艺关键参数', duration: '20:08', state: 'todo' },
      { title: '轧制与退火工艺控制', duration: '19:34', state: 'todo' },
      { title: '综合案例与改进方向', duration: '15:00', state: 'todo' },
    ],
  },
};

export function getCourseDetail(id: string | undefined): CourseDetail {
  if (id && COURSE_DETAILS[id]) return COURSE_DETAILS[id];
  return COURSE_DETAILS['1'];
}
