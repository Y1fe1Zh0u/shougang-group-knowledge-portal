export interface WikiReference {
  title: string;
  format: string;
  date: string;
}

export interface WikiEntry {
  id: string;
  name: string;
  /** 业务域：研发 / 设备 / 质量 / 安全 / 采购 / 人员 等 */
  domain: string;
  /** 类型分类标签，如 "词条" 或 "知识产品（制造类）" */
  kind: string;
  editor: string;
  editorDept: string;
  updatedAt: string;
  paragraphs: string[];
  applications: { title: string; desc: string }[];
  references: WikiReference[];
}

export const WIKI_ENTRIES: WikiEntry[] = [
  {
    id: 'irkg',
    name: '智能轧制工艺知识图谱',
    domain: '研发',
    kind: '知识产品（制造类）',
    editor: '张志远',
    editorDept: '工艺研究院',
    updatedAt: '2026-04-22',
    paragraphs: [
      '智能轧制工艺知识图谱（IRKG）以热轧、冷轧两条主线工艺为骨架，融合工艺参数、设备状态、质量缺陷、操作规程与典型案例，构建可被检索、推理与可视化的钢铁制造领域知识图谱。',
      '其核心价值在于：当现场出现质量异常时，可通过缺陷节点反向推理上游工艺参数与设备状态的可疑组合，把过去依赖老师傅经验的归因过程转化为可解释的图查询路径。',
    ],
    applications: [
      {
        title: '质量异常归因',
        desc: '由缺陷节点反向遍历至工艺参数与设备状态节点，按经验权重排序并附带历史相似案例。',
      },
      {
        title: '工艺规程辅助检索',
        desc: '将文字规程结构化为可点击的步骤—参数—风险—处置图，便于新进员工快速理解。',
      },
      {
        title: '设备—工艺协同优化',
        desc: '结合设备健康度评分，提示当前轧机状态下推荐的拉速、辊缝、张力组合上下限。',
      },
    ],
    references: [
      { title: '连铸坯表面振动纹排查指引 (V2.1)', format: 'PDF', date: '2026-03-15' },
      { title: '连铸结晶器铜板抛光工艺规范 (V3.2)', format: 'PDF', date: '2026-04-18' },
      { title: 'Q345B 板坯热轧 R 角裂纹案例总结', format: 'DOCX', date: '2026-04-21' },
      { title: '轧机液压系统压力波动诊断手册', format: 'PDF', date: '2026-01-09' },
      { title: '2025 年度典型质量异议归因白皮书', format: 'PDF', date: '2026-01-22' },
    ],
  },
  {
    id: 'scrm',
    name: '智慧供应链风险预警（制造物流）',
    domain: '采购',
    kind: '知识产品（制造类）',
    editor: '李文博',
    editorDept: '供应链管理部',
    updatedAt: '2026-04-15',
    paragraphs: [
      '智慧供应链风险预警以原料、备件、外协运输三类节点为支点，结合到货周期、价格波动、合规风险等维度的实时数据，对潜在断链事件提前发出分级预警。',
      '该知识产品同时作为现场采购员与计划员之间的共享语义层：双方对同一术语、同一风险等级、同一处置预案保持一致认知，减少口头沟通歧义。',
    ],
    applications: [
      { title: '到货预警', desc: '聚合 ERP 与运输商数据，按物料关键度推送到货延迟提醒。' },
      { title: '价格波动跟踪', desc: '对比月度市场价与合同价，超出阈值自动生成议价建议。' },
      { title: '替代物料推荐', desc: '基于历史替代成功案例，给出工艺等效性评分与备选清单。' },
    ],
    references: [
      { title: '关键原料供应商分级管理办法', format: 'PDF', date: '2026-03-02' },
      { title: '废钢到货检验规程', format: 'PDF', date: '2025-11-19' },
      { title: '运输商月度履约红黑榜', format: 'XLSX', date: '2026-04-01' },
    ],
  },
  {
    id: 'pdm',
    name: '预测性维护',
    domain: '设备',
    kind: '词条',
    editor: '王俊豪',
    editorDept: '设备管理部',
    updatedAt: '2026-04-10',
    paragraphs: [
      '预测性维护（Predictive Maintenance, PdM）依托设备振动、温度、电流等多源信号的时序建模，估算关键部件剩余使用寿命，从而把"按时间间隔保养"演进为"按状态保养"。',
      '相对于事后维修与定期点检，预测性维护可以减少非计划停机损失、延长备件实际使用寿命，但对数据采集质量与故障样本积累有较高门槛。',
    ],
    applications: [
      { title: '关键轴承剩余寿命估算', desc: '基于振动谱与温升趋势预测断裂风险，提前安排换辊。' },
      { title: '电机绝缘退化监测', desc: '结合 PD 检测与负载谱，识别绕组老化早期迹象。' },
    ],
    references: [
      { title: 'ISO 17359 状态监测与诊断', format: 'PDF', date: '2024-08-12' },
      { title: '主电机维护实操手册', format: 'PDF', date: '2025-09-30' },
    ],
  },
  {
    id: 'spc',
    name: '统计过程控制（SPC）',
    domain: '质量',
    kind: '词条',
    editor: '赵晓萌',
    editorDept: '质量保障部',
    updatedAt: '2026-03-28',
    paragraphs: [
      '统计过程控制（Statistical Process Control, SPC）通过控制图监测过程关键质量特性，区分共因变差与特殊原因变差，识别过程是否处于受控状态。',
      '在轧线场景下，SPC 通常用于厚度公差、表面缺陷率等指标的连续监控，与 6σ 改进项目协同使用。',
    ],
    applications: [
      { title: '厚度公差控制', desc: '使用 X̄-R 控制图实时监测每卷板厚波动，超限即触发复检。' },
      { title: '表面缺陷率监控', desc: '按班次统计缺陷率 p 图，识别工艺漂移。' },
    ],
    references: [
      { title: 'AIAG SPC 第二版（中文译本）', format: 'PDF', date: '2024-05-10' },
      { title: '冷轧表面缺陷代码与判级规则', format: 'PDF', date: '2025-12-05' },
    ],
  },
  {
    id: 'bf-gas-safety',
    name: '高炉煤气放散安全管控',
    domain: '安全',
    kind: '词条',
    editor: '马志刚',
    editorDept: '安全环保部',
    updatedAt: '2026-04-05',
    paragraphs: [
      '高炉煤气放散安全管控围绕煤气含氧量、放散塔点火可靠性、风险作业票审批三条主线，覆盖从工艺生产到日常巡检的关键管控点。',
      '其核心目标是杜绝煤气燃爆与中毒事故，要求各岗位严格执行进入煤气区域的"四查"流程并使用便携式检测仪。',
    ],
    applications: [
      { title: '煤气区域作业准入', desc: '按 GB 6222 要求执行氧含量与一氧化碳检测，作业票闭环管理。' },
      { title: '放散塔点火失败应急', desc: '按预案启动备用点火与现场警戒，防止可燃气体扩散。' },
    ],
    references: [
      { title: 'GB 6222 工业企业煤气安全规程', format: 'PDF', date: '2023-06-01' },
      { title: '煤气区域作业票模板', format: 'DOCX', date: '2025-10-12' },
    ],
  },
];

export interface WikiListItem {
  id: string;
  name: string;
  domain: string;
  kind: string;
}

export const WIKI_LIST_ITEMS: WikiListItem[] = WIKI_ENTRIES.map((entry) => ({
  id: entry.id,
  name: entry.name,
  domain: entry.domain,
  kind: entry.kind,
}));

export function getWikiEntry(id: string | undefined): WikiEntry | undefined {
  if (!id) return undefined;
  return WIKI_ENTRIES.find((entry) => entry.id === id);
}
