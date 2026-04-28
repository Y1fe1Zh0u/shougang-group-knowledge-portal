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
