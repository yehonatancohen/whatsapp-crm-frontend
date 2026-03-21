import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

const URL_REGEX = /https?:\/\/[^\s<>"']+/i;

function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}

function useLinkPreview(url: string | null) {
  return useQuery({
    queryKey: ['link-preview', url],
    queryFn: async () => {
      const { data } = await api.get('/utils/link-preview', { params: { url } });
      return data as { title: string | null; description: string | null; image: string | null; siteName: string | null; url: string };
    },
    enabled: !!url,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    retry: false,
  });
}

function resolveSpintaxPreview(text: string): string {
  return text.replace(/\{([^{}]+)\}/g, (_match, group: string) => {
    const options = group.split('|');
    return options[Math.floor(Math.random() * options.length)];
  });
}

function formatWhatsApp(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: *text*
  html = html.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');
  // Italic: _text_
  html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  // Strikethrough: ~text~
  html = html.replace(/~([^~\n]+)~/g, '<del>$1</del>');
  // URLs
  html = html.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<span class="underline text-blue-600 dark:text-blue-400">$1</span>',
  );
  // Newlines
  html = html.replace(/\n/g, '<br/>');

  return html;
}

export function WhatsAppPreview({ text }: { text: string }) {
  const resolved = useMemo(() => resolveSpintaxPreview(text), [text]);
  const formatted = useMemo(() => formatWhatsApp(resolved), [resolved]);
  const url = useMemo(() => extractFirstUrl(resolved), [resolved]);
  const { data: ogData } = useLinkPreview(url);

  const domain = url ? new URL(url).hostname.replace(/^www\./, '') : '';

  return (
    <div className="flex justify-end mt-2">
      <div
        className="max-w-[85%] rounded-lg overflow-hidden bg-[#dcf8c6] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100 shadow-sm"
        dir="auto"
      >
        {/* OG Link Preview Card */}
        {ogData && (ogData.image || ogData.title) && (
          <div className="bg-[#d1f4c0] dark:bg-[#004a3d] border-b border-black/5">
            {ogData.image && (
              <img
                src={ogData.image}
                alt={ogData.title || ''}
                className="w-full max-h-40 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="px-3 py-2">
              {ogData.title && (
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{ogData.title}</p>
              )}
              {ogData.description && (
                <p className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">{ogData.description}</p>
              )}
              <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">{domain}</p>
            </div>
          </div>
        )}

        {/* Message text */}
        <div className="px-3 py-2 text-sm">
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400">12:00</span>
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
