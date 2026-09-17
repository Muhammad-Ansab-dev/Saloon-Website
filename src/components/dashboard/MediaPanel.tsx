'use client';
// ─────────────────────────────────────────────────────────────
// MediaPanel — Dashboard "Media" tab. Manages every image slot on the
// public site: named site_images (hero / home sections / service
// categories / testimonial avatars / branches) plus per-service and
// per-stylist images and the gallery. Reads /api/content and writes
// through /api/admin/*; uploads go via ImagePicker → /api/admin/upload.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Lock, Plus, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImagePicker } from './ImagePicker';
import {
  SITE_IMAGES_DEFAULTS,
  SERVICE_IMAGE_BY_ID,
  STYLIST_IMAGE_BY_ID,
} from '@/data/salonData';

interface SiteImageRow {
  key: string;
  value: string;
}
interface ServiceRow {
  id: string;
  name: string;
  image?: string;
}
interface StylistRow {
  id: string;
  name: string;
  image?: string;
}
interface GalleryRow {
  image: string;
  alt: string;
  caption: string;
  category: string;
}

interface MediaData {
  siteImages: SiteImageRow[];
  services: ServiceRow[];
  stylists: StylistRow[];
  gallery: GalleryRow[];
}

const SITE_GROUPS: { title: string; description: string; keys: string[] }[] = [
  {
    title: 'Hero',
    description: 'Rotating slides on the homepage',
    keys: ['hero.1', 'hero.2', 'hero.3', 'hero.4'],
  },
  {
    title: 'Home sections',
    description: 'Decorative imagery around the homepage',
    keys: ['about', 'visitUs'],
  },
  {
    title: 'Service categories',
    description: 'Cards on the /services landing grid',
    keys: Object.keys(SITE_IMAGES_DEFAULTS).filter((k) => k.startsWith('category.')),
  },
  {
    title: 'Testimonial avatars',
    description: 'Client photos in the homepage testimonial flow',
    keys: Array.from({ length: 9 }, (_, i) => `testimonial.${i + 1}`),
  },
  {
    title: 'Branches',
    description: 'Salon locations on the /contact page',
    keys: ['branch.zurich', 'branch.paris'],
  },
];

function slotLabel(key: string): string {
  if (key.startsWith('hero.')) return `Slide ${key.split('.')[1]}`;
  if (key.startsWith('category.')) return key.split('.').slice(1).join('.');
  if (key.startsWith('testimonial.')) return `Client ${key.split('.')[1]}`;
  if (key === 'branch.zurich') return 'Zurich';
  if (key === 'branch.paris') return 'Paris';
  if (key === 'about') return 'About';
  if (key === 'visitUs') return 'Visit us';
  return key;
}

function GroupCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col min-h-0">
      <CardHeader className="shrink-0 pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {children}
      </CardContent>
    </Card>
  );
}

export function MediaPanel() {
  const [data, setData] = useState<MediaData | null>(null);
  const [auth, setAuth] = useState<'loading' | 'ok' | 'denied'>('loading');
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    setSaveError('');
    setAuth('loading');
    try {
      const [si, sv, st, ga] = await Promise.all([
        fetch('/api/admin/siteImages').then((r) => (r.ok ? r.json() : Promise.reject(r))),
        fetch('/api/admin/services').then((r) => (r.ok ? r.json() : Promise.reject(r))),
        fetch('/api/admin/stylists').then((r) => (r.ok ? r.json() : Promise.reject(r))),
        fetch('/api/admin/gallery').then((r) => (r.ok ? r.json() : Promise.reject(r))),
      ]);
      setData({
        siteImages: si.items ?? [],
        services: sv.items ?? [],
        stylists: st.items ?? [],
        gallery: ga.items ?? [],
      });
      setAuth('ok');
    } catch {
      setAuth('denied');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function persist(col: string, items: unknown[]) {
    try {
      const res = await fetch(`/api/admin/${col}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Save failed (${res.status})`);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save changes');
    }
  }

  function setSiteImage(key: string, value: string) {
    if (!data) return;
    const next: MediaData = {
      ...data,
      siteImages: (() => {
        const existing = data.siteImages.find((r) => r.key === key);
        if (existing) return data.siteImages.map((r) => (r.key === key ? { ...r, value } : r));
        return [...data.siteImages, { key, value }];
      })(),
    };
    setData(next);
    void persist('siteImages', next.siteImages);
  }

  function setServiceImage(id: string, value: string) {
    if (!data) return;
    const next: MediaData = {
      ...data,
      services: data.services.map((s) => (s.id === id ? { ...s, image: value } : s)),
    };
    setData(next);
    void persist('services', next.services);
  }

  function setStylistImage(id: string, value: string) {
    if (!data) return;
    const next: MediaData = {
      ...data,
      stylists: data.stylists.map((s) => (s.id === id ? { ...s, image: value } : s)),
    };
    setData(next);
    void persist('stylists', next.stylists);
  }

  function setGalleryImage(index: number, value: string) {
    if (!data) return;
    const next: MediaData = {
      ...data,
      gallery: data.gallery.map((g, i) => (i === index ? { ...g, image: value } : g)),
    };
    setData(next);
    void persist('gallery', next.gallery);
  }

  function addGalleryItem() {
    if (!data) return;
    const next: MediaData = {
      ...data,
      gallery: [...data.gallery, { image: '', alt: 'Gallery image', caption: '', category: 'SALON' }],
    };
    setData(next);
    void persist('gallery', next.gallery);
  }

  function deleteGalleryItem(index: number) {
    if (!data) return;
    const next: MediaData = {
      ...data,
      gallery: data.gallery.filter((_, i) => i !== index),
    };
    setData(next);
    void persist('gallery', next.gallery);
  }

  if (auth === 'loading') {
    return (
      <div className="col-span-4 col-start-2 row-start-2 row-span-6 flex min-h-0 items-center justify-center rounded-xl border border-border bg-card">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (auth !== 'ok') {
    return (
      <div className="col-span-4 col-start-2 row-start-2 row-span-6 flex min-h-0 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <Lock className="w-6 h-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          The media library is admin-only. Sign in to upload and replace images.
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

  if (!data) return null;

  const readOnly = auth !== 'ok';

  return (
    <div className="col-span-4 col-start-2 row-start-2 row-span-6 flex min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
        {saveError ? (
          <p className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            {saveError}
          </p>
        ) : null}

        {SITE_GROUPS.map((group) => (
          <GroupCard key={group.title} title={group.title} description={group.description}>
            {group.keys.map((key) => (
              <ImagePicker
                key={key}
                label={slotLabel(key)}
                value={data.siteImages.find((r) => r.key === key)?.value ?? SITE_IMAGES_DEFAULTS[key] ?? ''}
                onValue={(url) => setSiteImage(key, url)}
                disabled={readOnly}
              />
            ))}
          </GroupCard>
        ))}

        <GroupCard title="Service images" description="Photos shown next to each service across the site">
          {data.services.map((s) => (
            <ImagePicker
              key={s.id}
              label={s.name}
              value={s.image || SERVICE_IMAGE_BY_ID[s.id] || ''}
              onValue={(url) => setServiceImage(s.id, url)}
              disabled={readOnly}
            />
          ))}
        </GroupCard>

        <GroupCard title="Stylist photos" description="Team headshots on the About page and homepage">
          {data.stylists.map((s) => (
            <ImagePicker
              key={s.id}
              label={s.name}
              value={s.image || STYLIST_IMAGE_BY_ID[s.id] || ''}
              onValue={(url) => setStylistImage(s.id, url)}
              disabled={readOnly}
            />
          ))}
        </GroupCard>

        <GroupCard title="Gallery" description="Collection images (managed for future use)">
          {data.gallery.map((g, i) => (
            <div key={i} className="flex items-start gap-3">
              <ImagePicker
                label={g.caption || `Gallery item ${i + 1}`}
                value={g.image}
                onValue={(url) => setGalleryImage(i, url)}
                disabled={readOnly}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="mt-14 shrink-0 h-8 w-8"
                disabled={readOnly}
                onClick={() => deleteGalleryItem(i)}
                aria-label="Delete gallery item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={readOnly}
            onClick={addGalleryItem}
            className="justify-self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            Add image
          </Button>
        </GroupCard>
      </div>
    </div>
  );
}