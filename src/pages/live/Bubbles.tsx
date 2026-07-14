import { useEffect, useState } from 'react';
import type { LabCount } from '../../lib/counts.ts';

interface Props {
  data: LabCount[];
  onSelect: (labId: number) => void;
}

interface Node {
  labId: number;
  name: string;
  color: string;
  count: number;
  x: number;
  y: number;
  r: number;
}

const W = 1000;
const H = 620;

/** Packed bubbles — circle area grows with selection count. d3 dynamic import. */
export default function Bubbles({ data, onSelect }: Props) {
  const [nodes, setNodes] = useState<Node[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { pack, hierarchy } = await import('d3-hierarchy');
      // baseline keeps zero-count labs visible but small
      const root = hierarchy<{ children: LabCount[] } | LabCount>({ children: data } as {
        children: LabCount[];
      })
        .sum((d) => ('count' in d ? d.count + 0.35 : 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
      const layout = pack<{ children: LabCount[] } | LabCount>().size([W, H]).padding(6);
      const packed = layout(root);
      if (!alive) return;
      setNodes(
        packed.leaves().map((leaf) => {
          const d = leaf.data as LabCount;
          return {
            labId: d.lab.id,
            name: d.lab.name,
            color: d.group?.color ?? 'var(--group-0)',
            count: d.count,
            x: leaf.x,
            y: leaf.y,
            r: leaf.r,
          };
        }),
      );
    })();
    return () => {
      alive = false;
    };
  }, [data]);

  return (
    <svg className="bubbles" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Popularity bubbles">
      {nodes.map((n) => (
        <g
          key={n.labId}
          className="bubbles__node"
          transform={`translate(${n.x},${n.y})`}
          onClick={() => onSelect(n.labId)}
        >
          <circle r={n.r} fill={n.color} fillOpacity={0.85} stroke={n.color} strokeWidth={1.5} />
          {n.r > 34 && (
            <text className="bubbles__count" textAnchor="middle" dy="-0.1em">
              {n.count}
            </text>
          )}
          {n.r > 52 && (
            <foreignObject x={-n.r + 6} y={6} width={n.r * 2 - 12} height={n.r}>
              <span className="bubbles__label">{n.name}</span>
            </foreignObject>
          )}
        </g>
      ))}
    </svg>
  );
}
