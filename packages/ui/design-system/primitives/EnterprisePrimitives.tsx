import type { ReactNode } from 'react';
import { cn } from '../utils/cn.js';
import { ubosTypographyClasses } from '../tokens/typography.js';
import { StatusBadge } from './StatusBadge.js';
import type { UbosStatus } from '../tokens/colors.js';

export const ubosIcons = {
  program: '●', preview: '◐', recording: '●', streaming: '↗', guests: '◎', sources: '▣',
  graphics: '✦', replay: '↶', audio: '♫', automation: '⌘', social: '◌', analytics: '▥',
  alerts: '!', moderation: '✓', publishing: '↗', more: '•••', maximize: '⛶', collapse: '⌄',
} as const;
export type UbosIconName = keyof typeof ubosIcons;
export function UbosIcon({ name, label }: { name: UbosIconName; label?: string }) {
  return <span aria-label={label} aria-hidden={label ? undefined : true} className="inline-flex w-[var(--ubos-icon-md)] justify-center">{ubosIcons[name]}</span>;
}

export function EmptyState({ title = 'Nothing to show', description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div className="flex min-h-28 flex-col items-center justify-center gap-1 rounded-ubos-md border border-dashed border-ubos-border-subtle bg-ubos-carbon/60 p-ubos-4 text-center">
    <b className={ubosTypographyClasses.panel}>{title}</b>{description ? <p className={ubosTypographyClasses.caption}>{description}</p> : null}{action}
  </div>;
}

export function EnterpriseCard({ children, selected, status, className, onClick, label }: { children: ReactNode; selected?: boolean; status?: UbosStatus; className?: string; onClick?: () => void; label?: string }) {
  const content = <div className={cn('rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-ubos-3 shadow-ubos-panel transition duration-ubos-fast hover:border-ubos-border-strong hover:bg-ubos-slate', selected && 'border-ubos-selection-border bg-ubos-selection-muted shadow-ubos-selection-glow', className)}>{status ? <div className="mb-ubos-2"><StatusBadge variant={status} dot>{status}</StatusBadge></div> : null}{children}</div>;
  return onClick ? <button type="button" aria-label={label} aria-pressed={selected} onClick={onClick} className="block w-full text-left">{content}</button> : content;
}

export function EnterpriseListRow({ primary, secondary, status, actions, selected = false, onClick }: { primary: ReactNode; secondary?: ReactNode; status?: UbosStatus; actions?: ReactNode; selected?: boolean; onClick?: () => void }) {
  const content = <><div className="min-w-0 flex-1"><div className={ubosTypographyClasses.panel}>{primary}</div>{secondary ? <div className={cn(ubosTypographyClasses.caption, 'mt-0.5')}>{secondary}</div> : null}</div>{status ? <StatusBadge variant={status}>{status}</StatusBadge> : null}{actions}</>;
  const cls = cn('flex items-center gap-ubos-2 border-b border-ubos-border-subtle px-ubos-3 py-ubos-2 last:border-b-0 hover:bg-ubos-slate', selected && 'bg-ubos-selection-muted');
  return onClick ? <button type="button" className={cn(cls, 'w-full text-left')} onClick={onClick} aria-pressed={selected}>{content}</button> : <div className={cls}>{content}</div>;
}

export function EnterpriseTable({ columns, children, empty }: { columns: string[]; children?: ReactNode; empty?: ReactNode }) {
  return <div className="overflow-x-auto rounded-ubos-md border border-ubos-border-subtle"><table className="w-full text-left"><thead className="bg-ubos-carbon"><tr>{columns.map((column) => <th key={column} scope="col" className={cn(ubosTypographyClasses.metadata, 'px-ubos-3 py-ubos-2')}>{column}</th>)}</tr></thead><tbody className={ubosTypographyClasses.body}>{children ?? <tr><td colSpan={columns.length} className="p-ubos-3">{empty ?? <EmptyState />}</td></tr>}</tbody></table></div>;
}
