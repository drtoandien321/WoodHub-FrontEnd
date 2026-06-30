import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Smile, Paperclip, Send } from '../suppliers/icons.jsx';

/*
 * ChatInput — ô nhập tin (sticky bottom).
 * - Enter để gửi, Shift+Enter xuống dòng. Không gửi tin rỗng.
 * - Emoji/đính kèm: để UI nhưng disabled (chưa có logic — đúng yêu cầu giữ nhẹ).
 * - autoFocus: tự focus khi mở drawer trên desktop.
 */
export default function ChatInput({ onSend, disabled, autoFocus }) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (autoFocus && !disabled) ref.current?.focus();
  }, [autoFocus, disabled]);

  // Tự co giãn chiều cao textarea theo nội dung (tối đa ~5 dòng).
  const autosize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
    if (ref.current) ref.current.style.height = 'auto';
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-end gap-1.5 border-t border-base-300 bg-base-100 p-2.5">
      <button type="button" disabled aria-label={t('chat.emoji')} className="btn btn-ghost btn-sm btn-circle text-base-content/40">
        <Smile width={18} height={18} />
      </button>
      <button type="button" disabled aria-label={t('chat.attach')} className="btn btn-ghost btn-sm btn-circle text-base-content/40">
        <Paperclip width={18} height={18} />
      </button>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        disabled={disabled}
        onChange={(e) => { setValue(e.target.value); autosize(e.target); }}
        onKeyDown={onKeyDown}
        placeholder={t('chat.placeholder')}
        className="textarea textarea-bordered min-h-0 flex-1 resize-none rounded-2xl py-2 text-sm leading-relaxed focus:outline-none disabled:opacity-60"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label={t('chat.send')}
        className="btn btn-primary btn-sm btn-circle shrink-0 disabled:opacity-40"
      >
        <Send width={16} height={16} />
      </button>
    </div>
  );
}
