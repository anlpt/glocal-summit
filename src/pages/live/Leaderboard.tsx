import type { LabCount } from '../../lib/counts.ts';

interface Props {
  data: LabCount[];
  max: number;
  onSelect: (labId: number) => void;
}

/** Ranked list of units with a value bar. No external deps. */
export default function Leaderboard({ data, max, onSelect }: Props) {
  return (
    <ol className="board">
      {data.map((d, i) => (
        <li key={d.lab.id}>
          <button
            className="board__row"
            style={{ ['--group' as string]: d.group?.color ?? 'var(--group-0)' }}
            onClick={() => onSelect(d.lab.id)}
          >
            <span className="board__rank">{i + 1}</span>
            <span className="board__name">{d.lab.name}</span>
            <span className="board__track">
              <span
                className="board__fill"
                style={{ width: `${max ? (d.count / max) * 100 : 0}%` }}
              />
            </span>
            <span className="board__count">{d.count}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
