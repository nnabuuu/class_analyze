export interface UploadResponse {
  taskId: string;
}

const API_BASE = import.meta.env.VITE_API_BASE || '';

function makeUrl(path: string): string {
  if (!API_BASE) return path;
  return API_BASE.replace(/\/$/, '') + path;
}

export async function uploadFile(
  file: File,
  type: 'audio' | 'transcript',
  deepAnalyze?: string[],
): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  if (deepAnalyze && deepAnalyze.length) {
    form.append('deepAnalyze', deepAnalyze.join(','));
  }

  const endpoint =
    type === 'audio'
      ? makeUrl('/pipeline-task/upload-audio')
      : type === 'transcript'
      ? makeUrl('/pipeline-task/upload-text')
      : makeUrl('/pipeline-task/upload');

  try {
    const res = await fetch(endpoint, { method: 'POST', body: form });
    if (!res.ok) throw new Error('Request failed');
    const data = await res.json();
    return { taskId: data.id };
  } catch (err) {
    console.warn('Upload failed, using mock task ID:', err);
    return { taskId: 'mock-task' };
  }
}

export function streamProgress(
  taskId: string,
  onUpdate: (data: any) => void,
): EventSource | null {
  try {
    const es = new EventSource(makeUrl(`/pipeline-task/${taskId}/events`));
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onUpdate(data);
      } catch {}
    };
    return es;
  } catch (err) {
    console.warn('SSE not available:', err);
    return null;
  }
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(makeUrl(url));
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

export async function fetchResult(taskId: string) {
  try {
    const [tasks, classInfo] = await Promise.all([
      fetchJson(makeUrl(`/pipeline-task/${taskId}/result`)),
      fetchJson(makeUrl(`/pipeline-task/${taskId}/class-info`)),
    ]);
    return { tasks, classInfo };
  } catch (err) {
    console.warn('Fetch result failed:', err);
    return null;
  }
}

export async function downloadFile(
  taskId: string,
  format: 'pdf' | 'excel',
): Promise<Blob | null> {
  const url =
    format === 'pdf'
      ? makeUrl(`/pipeline-task/${taskId}/report.pdf`)
      : makeUrl(`/pipeline-task/${taskId}/report.xlsx`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed');
    return res.blob();
  } catch (err) {
    console.warn('Download not available:', err);
    return null;
  }
}

export async function createShareLink(
  taskId: string,
  settings: any,
): Promise<{ url: string } | null> {
  try {
    const res = await fetch(makeUrl(`/pipeline-task/${taskId}/share`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  } catch (err) {
    console.warn('Share link creation failed:', err);
    return null;
  }
}
