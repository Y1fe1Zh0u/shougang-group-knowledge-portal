import test from 'node:test';
import assert from 'node:assert/strict';
import { createDomainDraft, isSelectedDomainColor, validateDomainDraft } from '../src/utils/adminDomains';

test('createDomainDraft maps existing domain values to editable strings', () => {
  const draft = createDomainDraft({
    name: '轧线',
    space_ids: [12],
    color: '#059669',
    bg: '#d1fae5',
    icon: 'Factory',
    background_image: '/rolling-domain-bg.jpg',
    enabled: false,
  });

  assert.deepEqual(draft, {
    name: '轧线',
    spaceId: '12',
    icon: 'Factory',
    backgroundImage: '/rolling-domain-bg.jpg',
    color: '#059669',
    bg: '#d1fae5',
    enabled: false,
    publicLabel: '公共知识',
    publicFolderIds: [],
    professionalLabel: '专业知识',
    professionalFolderIds: [],
  });
});

test('validateDomainDraft returns a domain config for valid input', () => {
  const result = validateDomainDraft({
    name: '冷轧',
    spaceId: '18',
    icon: 'Snowflake',
    backgroundImage: '/cold-domain-bg.jpg',
    color: '#6366f1',
    bg: '#ede9fe',
    enabled: true,
    publicLabel: '制度知识',
    publicFolderIds: [101],
    professionalLabel: '专业资料',
    professionalFolderIds: [102, 103],
  }, [
    { id: 18, name: '冷轧技术手册', file_count: 10, tag_count: 0, enabled: true },
  ]);

  assert.deepEqual(result, {
    domain: {
      name: '冷轧',
      space_ids: [18],
      icon: 'Snowflake',
      background_image: '/cold-domain-bg.jpg',
      color: '#6366f1',
      bg: '#ede9fe',
      enabled: true,
      public_label: '制度知识',
      public_folder_ids: [101],
      public_count: 0,
      professional_label: '专业资料',
      professional_folder_ids: [102, 103],
      professional_count: 0,
    },
  });
});

test('validateDomainDraft accepts empty spaceId as unbound (treated as 待补绑定)', () => {
  const result = validateDomainDraft({
    name: '能源',
    spaceId: '',
    icon: 'Zap',
    backgroundImage: '/energy-domain-bg.jpg',
    color: '#d97706',
    bg: '#fef3c7',
    enabled: true,
    publicLabel: '',
    publicFolderIds: [],
    professionalLabel: '',
    professionalFolderIds: [],
  }, []);

  assert.deepEqual(result, {
    domain: {
      name: '能源',
      space_ids: [],
      icon: 'Zap',
      background_image: '/energy-domain-bg.jpg',
      color: '#d97706',
      bg: '#fef3c7',
      enabled: true,
      public_label: '公共知识',
      public_folder_ids: [],
      public_count: 0,
      professional_label: '专业知识',
      professional_folder_ids: [],
      professional_count: 0,
    },
  });
});

test('validateDomainDraft still rejects unknown spaces', () => {
  const unknown = validateDomainDraft({
    name: '能源',
    spaceId: '30',
    icon: 'Zap',
    backgroundImage: '',
    color: '#d97706',
    bg: '#fef3c7',
    enabled: true,
    publicLabel: '公共知识',
    publicFolderIds: [],
    professionalLabel: '专业知识',
    professionalFolderIds: [],
  }, [
    { id: 12, name: '轧线技术案例库', file_count: 10, tag_count: 0, enabled: true },
  ]);

  assert.equal(unknown.error, '绑定空间不存在');
});

test('isSelectedDomainColor matches preset color pairs exactly', () => {
  assert.equal(
    isSelectedDomainColor(
      { color: '#2563eb', bg: '#eff6ff' },
      { color: '#2563eb', bg: '#eff6ff' },
    ),
    true,
  );
  assert.equal(
    isSelectedDomainColor(
      { color: '#2563eb', bg: '#eff6ff' },
      { color: '#059669', bg: '#d1fae5' },
    ),
    false,
  );
});
