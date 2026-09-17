'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, RefreshCw, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_UPLOAD = 25 * 1024 * 1024;

interface ImagePickerProps {
  value: string;
  onValue: (url: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function ImagePicker({ value, onValue, label, className, disabled }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_UPLOAD) {
      setError('Image is over 25 MB — please use a smaller file');
      return;
    }
    setBusy(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      if (res.status === 401) {
        throw new Error('Sign in required — uploads are admin-only');
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      onValue((data as { url: string }).url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className="group relative w-20 h-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40 disabled:cursor-not-allowed"
        aria-label={label ? `Replace image: ${label}` : 'Replace image'}
      >
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center bg-muted/60">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </span>
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label ?? 'preview'}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-muted-foreground/70">
            <ImagePlus className="w-5 h-5" />
          </span>
        )}
      </button>
      <div className="min-w-0 flex-1">
        {label ? (
          <p className="text-xs font-medium truncate">{label}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Replace
          </Button>
          {disabled ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Lock className="w-3 h-3" /> Sign in required
            </span>
          ) : null}
        </div>
        {error ? <p className="mt-1 text-[11px] text-destructive">{error}</p> : null}
        {value ? <p className="mt-1 text-[11px] text-muted-foreground truncate">{value}</p> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}