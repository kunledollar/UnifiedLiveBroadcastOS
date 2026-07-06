'use client';

import { useState } from 'react';
import type { LowerThirdTemplate } from '@ubos/shared';
import { validateLowerThirdTemplate } from '@ubos/shared';
import { BroadcastButton, BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { GraphicsEmptyState } from './GraphicsEmptyState';
import { graphicsAnimationPresets, graphicsAnimationSpeeds, createDefaultLowerThirdTemplate } from './graphics-utils';

export function LowerThirdDesigner({
  template: initialTemplate,
  onSaveTemplate,
  onSendToPreview,
  onTakeLive,
}: {
  template?: LowerThirdTemplate;
  onSaveTemplate?: (template: LowerThirdTemplate) => void;
  onSendToPreview?: (template: LowerThirdTemplate) => void;
  onTakeLive?: (template: LowerThirdTemplate) => void;
}) {
  const [template, setTemplate] = useState<LowerThirdTemplate>(
    initialTemplate ?? createDefaultLowerThirdTemplate(),
  );
  const issues = validateLowerThirdTemplate(template);

  const update = (patch: Partial<LowerThirdTemplate>) =>
    setTemplate((current) => ({ ...current, ...patch }));
  const style = template.style as Record<string, string | number | boolean | Record<string, boolean> | undefined>;
  const updateStyle = (key: string, value: string | number | boolean) =>
    setTemplate((current) => ({ ...current, style: { ...current.style, [key]: value } }));
  const animationSpeed = Object.entries(graphicsAnimationSpeeds).find(([, duration]) => duration === template.animation.durationMs)?.[0] ?? 'custom';

  return (
    <BroadcastPanel variant="inset" padding={false} className="flex min-h-0 flex-col border-0 shadow-none">
      <header className="shrink-0 border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>Lower Third Designer</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>Metadata editor · CSS animation runtime keeps DOM handles separate</p>
      </header>
      <div className="ubos-scroll min-h-0 flex-1 space-y-ubos-2 overflow-y-auto p-ubos-2">

        <label className="block space-y-1">
          <span className="text-ubos-metadata text-ubos-fg-muted">Template Name</span>
          <input
            value={template.name}
            onChange={(event) => update({ name: event.target.value })}
            className="w-full rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1 text-ubos-caption text-ubos-fg-primary"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-ubos-metadata text-ubos-fg-muted">Title</span>
          <input
            value={template.title}
            onChange={(event) => update({ title: event.target.value })}
            className="w-full rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1 text-ubos-caption text-ubos-fg-primary"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-ubos-metadata text-ubos-fg-muted">Subtitle</span>
          <input
            value={template.subtitle}
            onChange={(event) => update({ subtitle: event.target.value })}
            className="w-full rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1 text-ubos-caption text-ubos-fg-primary"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-ubos-metadata text-ubos-fg-muted">Role</span>
          <input
            value={template.role}
            onChange={(event) => update({ role: event.target.value })}
            className="w-full rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1 text-ubos-caption text-ubos-fg-primary"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-ubos-metadata text-ubos-fg-muted">Organization</span>
          <input
            value={template.organization}
            onChange={(event) => update({ organization: event.target.value })}
            className="w-full rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1 text-ubos-caption text-ubos-fg-primary"
          />
        </label>

        {['location', 'company', 'backgroundColor', 'accentColor', 'font'].map((field) => (
          <label key={field} className="block space-y-1">
            <span className="text-ubos-metadata text-ubos-fg-muted">{field.replace(/([A-Z])/g, ' $1')}</span>
            <input
              value={String(style[field] ?? '')}
              onChange={(event) => updateStyle(field, event.target.value)}
              className="w-full rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1 text-ubos-caption text-ubos-fg-primary"
            />
          </label>
        ))}
        {['size', 'opacity', 'padding'].map((field) => (
          <label key={field} className="block space-y-1">
            <span className="text-ubos-metadata text-ubos-fg-muted">{field}</span>
            <input
              type="number"
              step={field === 'opacity' ? 0.01 : 1}
              value={Number(style[field] ?? 0)}
              onChange={(event) => updateStyle(field, Number(event.target.value) || 0)}
              className="w-full rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1 text-ubos-caption text-ubos-fg-primary"
            />
          </label>
        ))}
        <div className="grid grid-cols-2 gap-ubos-2">
          <label className="block space-y-1">
            <span className="text-ubos-metadata text-ubos-fg-muted">Animation</span>
            <select
              value={String((template.animation as { preset?: string }).preset ?? template.animation.type)}
              onChange={(event) => update({ animation: { ...template.animation, type: event.target.value === 'fade' ? 'fade' : event.target.value === 'cut' ? 'cut' : event.target.value === 'none' ? 'none' : 'slide', preset: event.target.value } as LowerThirdTemplate['animation'] })}
              className="w-full rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1 text-ubos-caption text-ubos-fg-primary"
            >
              {graphicsAnimationPresets.map((preset) => <option key={preset} value={preset}>{preset}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-ubos-metadata text-ubos-fg-muted">Speed</span>
            <select
              value={animationSpeed}
              onChange={(event) => update({ animation: { ...template.animation, durationMs: graphicsAnimationSpeeds[event.target.value as keyof typeof graphicsAnimationSpeeds] } })}
              className="w-full rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1 text-ubos-caption text-ubos-fg-primary"
            >
              {Object.keys(graphicsAnimationSpeeds).map((speed) => <option key={speed} value={speed}>{speed}</option>)}
            </select>
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-ubos-metadata text-ubos-fg-muted">Duration (ms)</span>
          <input
            type="number"
            value={template.durationMs}
            onChange={(event) => update({ durationMs: Number(event.target.value) || 0 })}
            className="w-full rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1 text-ubos-caption text-ubos-fg-primary"
          />
        </label>

        <div className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-carbon p-ubos-2">
          <p className="text-ubos-metadata text-ubos-fg-muted">Preview (metadata only)</p>
          <p className="text-ubos-section text-ubos-fg-primary">{template.title || '—'}</p>
          <p className="text-ubos-caption text-ubos-fg-secondary">{template.subtitle || '—'}</p>
          <p className="text-ubos-metadata text-ubos-fg-muted">
            {template.role} · {template.organization}
          </p>
          <StatusBadge variant="neutral" className="mt-2">
            Lower third preview
          </StatusBadge>
        </div>

        {issues.length ? (
          <div className="space-y-1">
            {issues.map((issue) => (
              <StatusBadge key={issue.code} variant="warning">
                {issue.message}
              </StatusBadge>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1">
          <BroadcastButton size="sm" variant="ghost" onClick={() => onSaveTemplate?.(template)}>
            Save Template
          </BroadcastButton>
          <BroadcastButton size="sm" variant="secondary" onClick={() => onSendToPreview?.(template)}>
            Send to Preview
          </BroadcastButton>
          <BroadcastButton size="sm" variant="primary" onClick={() => onTakeLive?.(template)}>
            Take Live
          </BroadcastButton>
        </div>
      </div>
    </BroadcastPanel>
  );
}
