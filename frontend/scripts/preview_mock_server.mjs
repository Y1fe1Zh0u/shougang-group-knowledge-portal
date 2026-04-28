#!/usr/bin/env node
import http from 'node:http';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const DEFAULT_PORT = Number(process.env.PREVIEW_MOCK_PORT || 8011);
const SPACE_ID = 9001;

const files = [
  {
    id: 1001,
    title: 'Preview Smoke PDF',
    ext: 'pdf',
    mode: 'pdf',
    summary: 'PDF viewer smoke case. The mock intentionally serves bytes from the preview proxy.',
  },
  {
    id: 1002,
    title: 'Preview Smoke DOCX',
    ext: 'docx',
    mode: 'docx',
    summary: 'DOCX viewer smoke case rendered through mammoth.',
  },
  {
    id: 1003,
    title: 'Preview Smoke XLSX',
    ext: 'xlsx',
    mode: 'spreadsheet',
    summary: 'Spreadsheet viewer smoke case with multiple cells.',
  },
  {
    id: 1004,
    title: 'Preview Smoke CSV',
    ext: 'csv',
    mode: 'spreadsheet',
    summary: 'CSV viewer smoke case parsed by the spreadsheet viewer.',
  },
  {
    id: 1005,
    title: 'Preview Smoke Markdown',
    ext: 'md',
    mode: 'markdown',
    summary: 'Markdown viewer smoke case.',
  },
  {
    id: 1006,
    title: 'Preview Smoke HTML',
    ext: 'html',
    mode: 'html',
    summary: 'HTML viewer smoke case with sanitization.',
  },
  {
    id: 1007,
    title: 'Preview Smoke Text',
    ext: 'txt',
    mode: 'text',
    summary: 'Plain text viewer smoke case.',
  },
  {
    id: 1008,
    title: 'Preview Smoke Image',
    ext: 'svg',
    mode: 'image',
    summary: 'Image viewer smoke case served through the preview proxy.',
  },
  {
    id: 1009,
    title: 'Preview Smoke Unsupported PPTX',
    ext: 'pptx',
    mode: 'unsupported',
    summary: 'Unsupported mode smoke case.',
  },
  {
    id: 1010,
    title: 'Preview Smoke Chunks Fallback',
    ext: 'bin',
    mode: 'chunks',
    summary: 'Chunks fallback smoke case.',
  },
];

const assetFactories = {
  1001: () => ({ contentType: 'application/octet-stream', body: createPdf() }),
  1002: () => ({ contentType: 'application/octet-stream', body: createDocx() }),
  1003: () => ({ contentType: 'application/octet-stream', body: createXlsx() }),
  1004: () => ({ contentType: 'text/csv; charset=utf-8', body: Buffer.from('Area,Value,Owner\nRolling,42,Team A\nCold Mill,17,Team B\n', 'utf8') }),
  1005: () => ({ contentType: 'text/markdown; charset=utf-8', body: Buffer.from('# Markdown preview\n\n- item one\n- item two\n\n**Smoke test passed.**\n', 'utf8') }),
  1006: () => ({ contentType: 'text/html; charset=utf-8', body: Buffer.from('<article><h1>HTML preview</h1><p>This paragraph should render.</p><script>window.__bad = true</script></article>', 'utf8') }),
  1007: () => ({ contentType: 'text/plain; charset=utf-8', body: Buffer.from('Plain text preview\nLine 2\nLine 3\n', 'utf8') }),
  1008: () => ({ contentType: 'application/octet-stream', body: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="720" height="360" viewBox="0 0 720 360"><rect width="720" height="360" fill="#f8fafc"/><rect x="48" y="48" width="624" height="264" rx="18" fill="#0f766e"/><text x="360" y="185" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="#fff">Image Preview</text><text x="360" y="226" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#ccfbf1">served through mock preview/content</text></svg>', 'utf8') }),
};

const portalConfig = {
  spaces: [
    { id: SPACE_ID, name: '本地预览 Mock 空间', file_count: files.length, tag_count: 2, enabled: true },
  ],
  domains: [
    {
      name: '预览测试',
      space_ids: [SPACE_ID],
      color: '#0f766e',
      bg: '#ccfbf1',
      icon: 'FileText',
      background_image: '',
      enabled: true,
    },
  ],
  sections: [
    {
      title: '预览测试 · 全格式',
      tag: '预览测试',
      link: '/space/9001',
      icon: 'FileText',
      color: '#0f766e',
      bg: '#ccfbf1',
      enabled: true,
    },
  ],
  qa: {
    knowledge_space_ids: [SPACE_ID],
    panel_title: '本地 mock 问答',
    welcome_message: '本地预览 mock 已启动。',
    hot_questions: ['PDF 是否可预览？', 'DOCX 是否可预览？', '表格是否可预览？'],
    ai_search_system_prompt: '',
    qa_system_prompt: '',
    selected_model: '',
  },
  recommendation: {
    provider: 'mock',
    home_strategy: 'mock',
    detail_strategy: 'mock',
  },
  display: {
    home: { section_page_size: 6, hot_tags_count: 8, qa_hot_count: 3, domain_count: 1, spaces_count: 1, apps_count: 0 },
    list: { page_size: 20, visible_tag_count: 3 },
    search: { page_size: 20, visible_tag_count: 3 },
    detail: { related_files_count: 4, visible_tag_count: 3 },
  },
  apps: [],
};

function toFileItem(file) {
  return {
    id: file.id,
    space_id: SPACE_ID,
    title: file.title,
    summary: file.summary,
    source: '本地预览 Mock 空间',
    updated_at: '2026-04-28T12:00:00',
    tags: ['预览测试', file.ext.toUpperCase()],
    file_ext: file.ext,
  };
}

function responseOk(data) {
  return {
    status_code: 200,
    status_message: 'SUCCESS',
    data,
  };
}

function sendJson(res, data, statusCode = 200) {
  const body = Buffer.from(JSON.stringify(data), 'utf8');
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': body.length,
    'cache-control': 'no-store',
  });
  res.end(body);
}

function sendBytes(res, body, contentType) {
  res.writeHead(200, {
    'content-type': contentType,
    'content-length': body.length,
    'cache-control': 'no-store',
  });
  res.end(body);
}

function sendNotFound(res) {
  sendJson(res, { detail: 'NOT_FOUND', status_message: 'NOT_FOUND' }, 404);
}

function createPreviewManifest(file) {
  if (file.mode === 'unsupported') {
    return {
      mode: 'unsupported',
      download_url: '',
      viewer_url: '',
      source_kind: 'none',
      reason: '本地 mock：该类型按不支持在线预览处理。',
      supports_chunks_fallback: false,
    };
  }
  if (file.mode === 'chunks') {
    return {
      mode: 'chunks',
      download_url: '',
      viewer_url: '',
      source_kind: 'none',
      reason: '本地 mock：没有可直接预览资源，回退到正文分段。',
      supports_chunks_fallback: true,
    };
  }
  return {
    mode: file.mode,
    download_url: `/api/v1/knowledge/space/${SPACE_ID}/files/${file.id}/preview/content?source_kind=original_url`,
    viewer_url: `/api/v1/knowledge/space/${SPACE_ID}/files/${file.id}/preview/content?source_kind=original_url`,
    source_kind: 'original_url',
    reason: '',
    supports_chunks_fallback: true,
  };
}

function handleRequest(req, res) {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
      'access-control-allow-headers': 'content-type',
    });
    res.end();
    return;
  }

  if (pathname === '/health') {
    sendJson(res, responseOk({ service: 'preview-mock-backend', status: 'ok' }));
    return;
  }

  if (pathname === '/api/v1/admin/config') {
    sendJson(res, responseOk(portalConfig));
    return;
  }

  if (pathname === '/api/v1/auth/logout' && req.method === 'POST') {
    sendJson(res, responseOk({ ok: true }));
    return;
  }

  if (pathname === '/api/v1/knowledge/spaces') {
    sendJson(res, responseOk({ data: [{ id: SPACE_ID, name: '本地预览 Mock 空间', description: '本地预览渲染器测试数据', file_count: files.length }], total: 1 }));
    return;
  }

  if (pathname === '/api/v1/knowledge/tags' || pathname === `/api/v1/knowledge/space/${SPACE_ID}/tags`) {
    sendJson(res, responseOk(['预览测试', 'PDF', 'DOCX', 'XLSX', 'CSV', 'MD', 'HTML', 'TXT', 'SVG']));
    return;
  }

  if (pathname === '/api/v1/knowledge/files' || pathname === `/api/v1/knowledge/space/${SPACE_ID}/files`) {
    const fileExt = url.searchParams.get('file_ext') || '';
    const filtered = fileExt ? files.filter((file) => file.ext === fileExt) : files;
    sendJson(res, responseOk({ data: filtered.map(toFileItem), total: filtered.length, page: 1, page_size: 20 }));
    return;
  }

  const fileRoute = pathname.match(new RegExp(`^/api/v1/knowledge/space/${SPACE_ID}/files/(\\d+)(?:/(preview|preview/content|chunks|related))?$`));
  if (!fileRoute) {
    sendNotFound(res);
    return;
  }

  const fileId = Number(fileRoute[1]);
  const action = fileRoute[2] || 'detail';
  const file = files.find((item) => item.id === fileId);
  if (!file) {
    sendNotFound(res);
    return;
  }

  if (action === 'detail') {
    sendJson(res, responseOk({ ...toFileItem(file), space: { id: SPACE_ID, name: '本地预览 Mock 空间' } }));
    return;
  }

  if (action === 'preview') {
    sendJson(res, responseOk(createPreviewManifest(file)));
    return;
  }

  if (action === 'preview/content') {
    const factory = assetFactories[file.id];
    if (!factory) {
      sendNotFound(res);
      return;
    }
    const asset = factory();
    sendBytes(res, asset.body, asset.contentType);
    return;
  }

  if (action === 'chunks') {
    sendJson(res, responseOk([
      { chunk_index: 0, text: `${file.title} 的 mock 正文分段。` },
      { chunk_index: 1, text: '如果某个 viewer 加载失败，详情页会回退到这里。' },
    ]));
    return;
  }

  if (action === 'related') {
    sendJson(res, responseOk({ data: files.filter((item) => item.id !== file.id).slice(0, 4).map(toFileItem), total: Math.max(0, files.length - 1) }));
    return;
  }

  sendNotFound(res);
}

export function createPreviewMockServer() {
  return http.createServer(handleRequest);
}

export function startPreviewMockServer({ port = DEFAULT_PORT } = {}) {
  const server = createPreviewMockServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`Preview mock API listening at http://127.0.0.1:${port}`);
    console.log(`Open a sample detail page through Vite: /space/${SPACE_ID}/file/1001`);
  });
  return server;
}

function createPdf() {
  const stream = 'BT\n/F1 28 Tf\n72 720 Td\n(Preview PDF smoke test) Tj\n0 -42 Td\n/F1 16 Tf\n(PDF.js should render this page without loading an .mjs worker.) Tj\nET\n';
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];
  let content = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(content, 'utf8'));
    content += object;
  }
  const xrefOffset = Buffer.byteLength(content, 'utf8');
  content += `xref\n0 ${objects.length + 1}\n`;
  content += '0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) {
    content += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  content += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(content, 'utf8');
}

function createDocx() {
  return createZip([
    {
      name: '[Content_Types].xml',
      data: Buffer.from('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>', 'utf8'),
    },
    {
      name: '_rels/.rels',
      data: Buffer.from('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>', 'utf8'),
    },
    {
      name: 'word/document.xml',
      data: Buffer.from('<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>DOCX preview smoke test</w:t></w:r></w:p><w:p><w:r><w:t>Mammoth should render this paragraph locally.</w:t></w:r></w:p></w:body></w:document>', 'utf8'),
    },
  ]);
}

function createXlsx() {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Area', 'Value', 'Owner'],
    ['Rolling', 42, 'Team A'],
    ['Cold Mill', 17, 'Team B'],
    ['Energy', 28, 'Team C'],
  ]);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Smoke');
  return Buffer.from(XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }));
}

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const data = Buffer.from(entry.data);
    const checksum = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + data.length;
  }

  const centralStart = offset;
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  startPreviewMockServer();
}
