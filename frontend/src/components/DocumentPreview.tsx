import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import * as mammoth from 'mammoth';
import { marked } from 'marked';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import * as XLSX from 'xlsx';
import type { FileChunkItem } from '../api/content';
import type { ResolvedFilePreview } from '../utils/filePreview';
import s from './DocumentPreview.module.css';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface Props {
  chunks: FileChunkItem[];
  onPreviewFailure: () => void;
  preview: ResolvedFilePreview;
  title: string;
}

function sanitizeHtml(value: string): string {
  return DOMPurify.sanitize(value, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['iframe', 'object', 'embed', 'script', 'style'],
  });
}

function decodeTextBuffer(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8').decode(buffer);
  if (!utf8.includes('\ufffd')) return utf8;
  try {
    return new TextDecoder('gb18030').decode(buffer);
  } catch {
    return utf8;
  }
}

function LoadingState({ label }: { label: string }) {
  return <div className={s.state}>{label}</div>;
}

function FallbackState({ reason }: { reason: string }) {
  return (
    <div className={s.state}>
      <strong>暂不支持在线预览</strong>
      <span>{reason}</span>
    </div>
  );
}

function ChunkFallbackPreview({ chunks, reason }: { chunks: FileChunkItem[]; reason: string }) {
  if (!chunks.length) return <FallbackState reason={reason || '当前文件没有可展示的正文分段内容。'} />;
  return (
    <div className={s.scrollSurface}>
      <div className={s.textContent}>
        {chunks.map((chunk) => (
          <section key={chunk.chunkIndex} className={s.textBlock}>
            <h3 className={s.textTitle}>第 {chunk.chunkIndex + 1} 段</h3>
            <pre className={s.textBody}>{chunk.text}</pre>
          </section>
        ))}
      </div>
    </div>
  );
}

function ImagePreview({ title, viewerUrl, onPreviewFailure }: { title: string; viewerUrl: string; onPreviewFailure: () => void }) {
  return (
    <div className={s.imageSurface}>
      <img
        className={s.image}
        src={viewerUrl}
        alt={`${title} 预览`}
        onError={onPreviewFailure}
      />
    </div>
  );
}

function HtmlPreview({
  sourceUrl,
  onPreviewFailure,
}: {
  sourceUrl: string;
  onPreviewFailure: () => void;
}) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setHtml('');
    void (async () => {
      try {
        const response = await fetch(sourceUrl);
        if (!response.ok) throw new Error('HTML 预览请求失败');
        const buffer = await response.arrayBuffer();
        if (!active) return;
        setHtml(sanitizeHtml(decodeTextBuffer(buffer)));
      } catch {
        if (!active) return;
        onPreviewFailure();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [onPreviewFailure, sourceUrl]);

  if (loading) return <LoadingState label="正在加载 HTML 预览..." />;
  return <div className={s.richContent} dangerouslySetInnerHTML={{ __html: html }} />;
}

function MarkdownPreview({
  sourceUrl,
  onPreviewFailure,
}: {
  sourceUrl: string;
  onPreviewFailure: () => void;
}) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setHtml('');
    void (async () => {
      try {
        const response = await fetch(sourceUrl);
        if (!response.ok) throw new Error('Markdown 预览请求失败');
        const buffer = await response.arrayBuffer();
        const rendered = marked.parse(decodeTextBuffer(buffer));
        if (!active) return;
        setHtml(sanitizeHtml(typeof rendered === 'string' ? rendered : ''));
      } catch {
        if (!active) return;
        onPreviewFailure();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [onPreviewFailure, sourceUrl]);

  if (loading) return <LoadingState label="正在加载 Markdown 预览..." />;
  return <div className={s.richContent} dangerouslySetInnerHTML={{ __html: html }} />;
}

function TextPreview({
  sourceUrl,
  onPreviewFailure,
}: {
  sourceUrl: string;
  onPreviewFailure: () => void;
}) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setContent('');
    void (async () => {
      try {
        const response = await fetch(sourceUrl);
        if (!response.ok) throw new Error('文本预览请求失败');
        const buffer = await response.arrayBuffer();
        if (!active) return;
        setContent(decodeTextBuffer(buffer));
      } catch {
        if (!active) return;
        onPreviewFailure();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [onPreviewFailure, sourceUrl]);

  if (loading) return <LoadingState label="正在加载文本预览..." />;
  return (
    <div className={s.scrollSurface}>
      <div className={s.textContent}>
        <pre className={s.textBody}>{content}</pre>
      </div>
    </div>
  );
}

function DocxPreview({
  sourceUrl,
  onPreviewFailure,
}: {
  sourceUrl: string;
  onPreviewFailure: () => void;
}) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setHtml('');
    void (async () => {
      try {
        const response = await fetch(sourceUrl);
        if (!response.ok) throw new Error('DOCX 预览请求失败');
        const buffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        if (!active) return;
        setHtml(sanitizeHtml(result.value));
      } catch {
        if (!active) return;
        onPreviewFailure();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [onPreviewFailure, sourceUrl]);

  if (loading) return <LoadingState label="正在加载 DOCX 预览..." />;
  return <div className={s.richContent} dangerouslySetInnerHTML={{ __html: html }} />;
}

function SpreadsheetPreview({
  sourceUrl,
  onPreviewFailure,
}: {
  sourceUrl: string;
  onPreviewFailure: () => void;
}) {
  const workbookRef = useRef<XLSX.WorkBook | null>(null);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');

  useEffect(() => {
    let active = true;
    workbookRef.current = null;
    setLoading(true);
    setSheetNames([]);
    setSelectedSheet('');
    setHtml('');
    void (async () => {
      try {
        const response = await fetch(sourceUrl);
        if (!response.ok) throw new Error('表格预览请求失败');
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { dense: true });
        const nextSheetNames = workbook.SheetNames;
        if (!active || !nextSheetNames.length) return;
        workbookRef.current = workbook;
        setSheetNames(nextSheetNames);
        setSelectedSheet(nextSheetNames[0]);
      } catch {
        if (!active) return;
        onPreviewFailure();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      workbookRef.current = null;
    };
  }, [onPreviewFailure, sourceUrl]);

  useEffect(() => {
    if (!selectedSheet || !workbookRef.current) return;
    const worksheet = workbookRef.current.Sheets[selectedSheet];
    if (!worksheet) {
      setHtml('');
      return;
    }
    setHtml(sanitizeHtml(XLSX.utils.sheet_to_html(worksheet)));
  }, [selectedSheet]);

  if (loading) return <LoadingState label="正在加载表格预览..." />;
  return (
    <div className={s.scrollSurface}>
      {sheetNames.length > 1 && (
        <div className={s.sheetTabs}>
          {sheetNames.map((sheetName) => (
            <button
              key={sheetName}
              type="button"
              className={`${s.sheetTab} ${sheetName === selectedSheet ? s.sheetTabActive : ''}`}
              onClick={() => setSelectedSheet(sheetName)}
            >
              {sheetName}
            </button>
          ))}
        </div>
      )}
      <div className={s.sheetContent} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function PdfPreview({
  sourceUrl,
  onPreviewFailure,
}: {
  sourceUrl: string;
  onPreviewFailure: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const container = containerRef.current;
    let loadingTask: ReturnType<typeof getDocument> | null = null;
    if (!container) return undefined;

    container.innerHTML = '';
    setLoading(true);

    void (async () => {
      try {
        loadingTask = getDocument(sourceUrl);
        const pdfDocument = await loadingTask.promise;
        if (!active) return;
        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          const page = await pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.25 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Canvas 初始化失败');

          canvas.width = Math.ceil(viewport.width * window.devicePixelRatio);
          canvas.height = Math.ceil(viewport.height * window.devicePixelRatio);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

          const pageSection = document.createElement('section');
          pageSection.className = s.pdfPage;

          const pageLabel = document.createElement('div');
          pageLabel.className = s.pageLabel;
          pageLabel.textContent = `第 ${pageNumber} 页`;

          pageSection.appendChild(pageLabel);
          pageSection.appendChild(canvas);
          container.appendChild(pageSection);

          await page.render({ canvas, canvasContext: context, viewport }).promise;
        }
      } catch {
        if (!active) return;
        onPreviewFailure();
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      container.innerHTML = '';
      if (loadingTask) void loadingTask.destroy();
    };
  }, [onPreviewFailure, sourceUrl]);

  return (
    <div className={s.scrollSurface}>
      {loading ? <LoadingState label="正在加载 PDF 预览..." /> : null}
      <div ref={containerRef} className={s.pdfDocument} />
    </div>
  );
}

export default function DocumentPreview({ chunks, onPreviewFailure, preview, title }: Props) {
  if (preview.mode === 'chunks') {
    return <ChunkFallbackPreview chunks={chunks} reason={preview.reason} />;
  }

  if (preview.mode === 'unsupported') {
    return <FallbackState reason={preview.reason} />;
  }

  if (!preview.viewerUrl) {
    return <FallbackState reason={preview.reason || '当前文件缺少可用的预览资源。'} />;
  }

  switch (preview.mode) {
    case 'pdf':
      return <PdfPreview sourceUrl={preview.viewerUrl} onPreviewFailure={onPreviewFailure} />;
    case 'docx':
      return <DocxPreview sourceUrl={preview.viewerUrl} onPreviewFailure={onPreviewFailure} />;
    case 'spreadsheet':
      return <SpreadsheetPreview sourceUrl={preview.viewerUrl} onPreviewFailure={onPreviewFailure} />;
    case 'markdown':
      return <MarkdownPreview sourceUrl={preview.viewerUrl} onPreviewFailure={onPreviewFailure} />;
    case 'html':
      return <HtmlPreview sourceUrl={preview.viewerUrl} onPreviewFailure={onPreviewFailure} />;
    case 'text':
      return <TextPreview sourceUrl={preview.viewerUrl} onPreviewFailure={onPreviewFailure} />;
    case 'image':
      return <ImagePreview title={title} viewerUrl={preview.viewerUrl} onPreviewFailure={onPreviewFailure} />;
    default:
      return <ChunkFallbackPreview chunks={chunks} reason={preview.reason} />;
  }
}
