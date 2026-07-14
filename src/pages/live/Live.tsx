import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSummit } from '../../hooks/useSummit.ts';
import { labCounts, participantsById } from '../../lib/counts.ts';
import Leaderboard from './Leaderboard.tsx';
import BarRace from './BarRace.tsx';
import Logo from '../../components/ui/Logo.tsx';
import './live.css';

const Bubbles = lazy(() => import('./Bubbles.tsx'));
const Treemap = lazy(() => import('./Treemap.tsx'));

type Style = 'bubbles' | 'bars' | 'treemap' | 'board';
const STYLES: { id: Style; label: string }[] = [
  { id: 'bubbles', label: 'Bubbles' },
  { id: 'bars', label: 'Bar race' },
  { id: 'treemap', label: 'Treemap' },
  { id: 'board', label: 'Leaderboard' },
];

export default function Live() {
  const { groups, labs, participants, selections, settings, loading } = useSummit();
  const [style, setStyle] = useState<Style>('bubbles');
  const [selectedLab, setSelectedLab] = useState<number | null>(null);

  const counts = useMemo(
    () => labCounts(labs, groups, selections),
    [labs, groups, selections],
  );
  const max = counts[0]?.count ?? 0;
  const totalVotes = selections.length;
  const voters = new Set(selections.map((s) => s.participant_id)).size;
  const pById = useMemo(() => participantsById(participants), [participants]);

  const detail = selectedLab != null ? counts.find((c) => c.lab.id === selectedLab) : null;

  // Apply the admin's default style once, when settings first arrive.
  const defaultApplied = useRef(false);
  useEffect(() => {
    if (defaultApplied.current || !settings.live_default_style) return;
    defaultApplied.current = true;
    setStyle(settings.live_default_style as Style);
  }, [settings.live_default_style]);

  if (loading) {
    return (
      <div className="page">
        <p className="eyebrow">Loading…</p>
      </div>
    );
  }

  return (
    <div className="live">
      <div className="live__inner">
        <header className="live__head">
          <div>
            <p className="eyebrow">Live · {settings.hero_subtitle || 'RTD Glocal Summit'}</p>
            <h1 className="live__title">Research unit popularity</h1>
          </div>
          <div className="live__stats">
            <span className="live__stat">
              <b>{totalVotes}</b> selections
            </span>
            <span className="live__stat">
              <b>{voters}</b> / {participants.length} voted
            </span>
          </div>
        </header>

        <div className="live__toolbar">
          <div className="live__switch" role="tablist" aria-label="Visualization style">
            {STYLES.map((s) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={style === s.id}
                className={'live__switch-btn' + (style === s.id ? ' is-on' : '')}
                onClick={() => setStyle(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <ul className="live__legend">
            {groups.map((g) => (
              <li key={g.id}>
                <span className="live__legend-dot" style={{ background: g.color }} />
                {g.name.split(/\s*-\s*/)[0]}
              </li>
            ))}
          </ul>
        </div>

        <div className="live__stage">
          <Suspense fallback={<div className="live__loading">Rendering…</div>}>
            {style === 'bubbles' && <Bubbles data={counts} onSelect={setSelectedLab} />}
            {style === 'treemap' && <Treemap data={counts} onSelect={setSelectedLab} />}
          </Suspense>
          {style === 'bars' && <BarRace data={counts} max={max} onSelect={setSelectedLab} />}
          {style === 'board' && <Leaderboard data={counts} max={max} onSelect={setSelectedLab} />}
        </div>
      </div>

      {detail && (
        <aside className="detail" onClick={() => setSelectedLab(null)}>
          <div className="detail__panel" onClick={(e) => e.stopPropagation()}>
            <header className="detail__head" style={{ ['--group' as string]: detail.group?.color }}>
              <div>
                <p className="detail__group">{detail.group?.name ?? 'Unit'}</p>
                <h2 className="detail__title">{detail.lab.name}</h2>
              </div>
              <button className="btn btn--ghost" onClick={() => setSelectedLab(null)}>
                Close
              </button>
            </header>
            <p className="detail__count">
              {detail.count} {detail.count === 1 ? 'person' : 'people'} chose this unit
            </p>
            <ul className="detail__people">
              {detail.participantIds.map((id) => {
                const p = pById.get(id);
                if (!p) return null;
                return (
                  <li key={id} className="person">
                    <Logo org={p.org} src={p.org_logo_url} size={44} />
                    <div className="person__info">
                      <span className="person__name">
                        {p.title} {p.name}
                      </span>
                      <span className="person__meta">
                        {p.email} · {p.country || p.org}
                      </span>
                    </div>
                  </li>
                );
              })}
              {detail.count === 0 && <li className="detail__empty">No selections yet.</li>}
            </ul>
          </div>
        </aside>
      )}
    </div>
  );
}
