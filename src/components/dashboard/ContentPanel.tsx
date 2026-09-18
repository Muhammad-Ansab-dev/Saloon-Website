'use client';
// ─────────────────────────────────────────────────────────────
// ContentPanel — Dashboard "Content" tab. Lets the admin edit the text
// of the homepage hero (each slide's accent line, title and description)
// and save it straight into the site_texts collection. The public hero
// reads these live via /api/content. Hero IMAGES stay in the Media tab.
// Loads GET /api/admin/siteTexts, saves the full set with PUT
// /api/admin/siteTexts (superadmin-only; the middleware + [col] route
// enforce that server-side).
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonPanel } from '@/components/dashboard/Skeleton';
import { HERO_SLIDES, SITE_TEXT_DEFAULTS } from '@/data/salonData';

interface TextRow {
  key: string;
  value: string;
}

type LoadState = 'loading' | 'ok' | 'denied';

const FIELDS: { key: keyof { accent: string; title: string; description: string }; label: string }[] = [
  { key: 'accent', label: 'Accent line' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
];

const inputCls =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-black';
const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500 mb-1.5';

export function ContentPanel() {
  const [rows, setRows] = useState<TextRow[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const res = await fetch('/api/admin/siteTexts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data.items) ? data.items : []);
      setLoadState('ok');
      setDirty(false);
    } catch {
      setLoadState('denied');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const valueOf = useCallback(
    (key: string) => rows.find((r) => r.key === key)?.value ?? SITE_TEXT_DEFAULTS[key] ?? '',
    [rows]
  );

  const setValue = (key: string, value: string) => {
    setRows((prev) => {
      const existing = prev.find((r) => r.key === key);
      if (existing) return prev.map((r) => (r.key === key ? { ...r, value } : r));
      return [...prev, { key, value }];
    });
    setDirty(true);
    setSaveMsg('');
    setSaveError('');
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSaveMsg('');
    setSaveError('');
    try {
      const res = await fetch('/api/admin/siteTexts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rows }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Save failed (${res.status})`);
      }
      setDirty(false);
      setSaveMsg('Hero text saved — it is live on the homepage now.');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const totalSlides = useMemo(() => HERO_SLIDES.length, []);

  if (loadState === 'loading') {
    return <SkeletonPanel className="w-full" />;
  }

  if (loadState === 'denied') {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <Lock className="w-6 h-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Content editing is admin-only. Sign in to change the hero text.
        </p>
        <Link
          href="/dashboard/login?next=%2Fdashboard"
          className={cn(buttonVariants({ size: 'sm' }))}
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 gap-4">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide">Hero section text</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Homepage slides — save once and the change is live. Slide images live in the Media tab.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveError && (
            <span className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-xs text-destructive">
              {saveError}
            </span>
          )}
          {saveMsg && (
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-600">
              {saveMsg}
            </span>
          )}
          <Button type="button" size="sm" onClick={save} disabled={!dirty || saving}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {dirty ? 'Save changes' : 'Saved'}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
        {Array.from({ length: totalSlides }, (_, i) => {
          const n = i + 1;
          const slide = HERO_SLIDES[i];
          const liveTitle = valueOf(`hero.${n}.title`) || slide.title;
          return (
            <Card key={`slide-${n}`}>
              <CardHeader className="shrink-0 pb-3">
                <CardTitle className="text-sm">
                  Slide {n} — {liveTitle}
                </CardTitle>
                <CardDescription>
                  accent /hero.{n}.accent · title /hero.{n}.title · description /hero.{n}.description
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FIELDS.map((field) => {
                  const key = `hero.${n}.${field.key}`;
                  return (
                    <label key={key} className="block">
                      <span className={labelCls}>{field.label}</span>
                      {field.key === 'description' ? (
                        <textarea
                          rows={3}
                          value={valueOf(key)}
                          onChange={(e) => setValue(key, e.target.value)}
                          placeholder={SITE_TEXT_DEFAULTS[key] ?? ''}
                          className={`${inputCls} resize-y`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={valueOf(key)}
                          onChange={(e) => setValue(key, e.target.value)}
                          placeholder={SITE_TEXT_DEFAULTS[key] ?? ''}
                          className={inputCls}
                        />
                      )}
                    </label>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}