import type { LabCount } from '../../lib/counts.ts';

interface Props {
  data: LabCount[];
  max: number;
  onSelect: (labId: number) => void;
}

/** Horizontal bars ranked by count; widths animate via CSS transition. */
export default function BarRace({ data, max, onSelect }: Props) {
  return (
    <div className="bars">
      {data.map((d) => (
        <button
          key={d.lab.id}
          className="bars__row"
          style={{ ['--group' as string]: d.group?.color ?? 'var(--group-0)' }}
          onClick={() => onSelect(d.lab.id)}
        >
          <span className="bars__label">{d.lab.name}</span>
          <span className="bars__track">
            <span className="bars__fill" style={{ width: `${max ? (d.count / max) * 100 : 0}%` }}>
              <span className="bars__value">{d.count}</span>
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
