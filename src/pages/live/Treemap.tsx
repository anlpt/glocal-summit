import { useEffect, useState } from 'react';
import type { LabCount } from '../../lib/counts.ts';

interface Props {
  data: LabCount[];
  onSelect: (labId: number) => void;
}

interface Cell {
  labId: number;
  name: string;
  color: string;
  count: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const W = 1000;
const H = 620;

/** Treemap — rectangle area grows with selection count. d3 dynamic import. */
export default function Treemap({ data, onSelect }: Props) {
  const [cells, setCells] = useState<Cell[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { treemap, hierarchy } = await import('d3-hierarchy');
      const root = hierarchy<{ children: LabCount[] } | LabCount>({ children: data } as {
        children: LabCount[];
      })
        .sum((d) => ('count' in d ? d.count + 0.35 : 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
      treemap<{ children: LabCount[] } | LabCount>().size([W, H]).paddingInner(3).round(true)(root);
      if (!alive) return;
      setCells(
        root.leaves().map((leaf) => {
          const d = leaf.data as LabCount;
          const l = leaf as unknown as { x0: number; y0: number; x1: number; y1: number };
          return {
            labId: d.lab.id,
            name: d.lab.name,
            color: d.group?.color ?? 'var(--group-0)',
            count: d.count,
            x0: l.x0,
            y0: l.y0,
            x1: l.x1,
            y1: l.y1,
          };
        }),
      );
    })();
    return () => {
      alive = false;
    };
  }, [data]);

  return (
    <svg className="treemap" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Popularity treemap">
      {cells.map((c) => {
        const w = c.x1 - c.x0;
        const h = c.y1 - c.y0;
        return (
          <g key={c.labId} className="treemap__cell" onClick={() => onSelect(c.labId)}>
            <rect x={c.x0} y={c.y0} width={w} height={h} rx={4} fill={c.color} fillOpacity={0.88} />
            {w > 70 && h > 34 && (
              <foreignObject x={c.x0 + 6} y={c.y0 + 5} width={w - 12} height={h - 10}>
                <span className="treemap__label">
                  <b>{c.count}</b> {c.name}
                </span>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
}
