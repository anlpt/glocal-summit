import { useEffect, useState } from 'react';
import type { Participant as P } from '../../types.ts';
import { useSummit, isVotingOpen } from '../../hooks/useSummit.ts';
import LoginForm from './LoginForm.tsx';
import UnitPicker from './UnitPicker.tsx';
import './participant.css';

const CURRENT_KEY = 'gs_current_participant';

export default function Participant() {
  const { groups, labs, participants, selections, settings, loading } = useSummit();
  const [current, setCurrent] = useState<P | null>(null);

  // Restore session
  useEffect(() => {
    const raw = localStorage.getItem(CURRENT_KEY);
    if (!raw || participants.length === 0) return;
    try {
      const id = (JSON.parse(raw) as { id: number }).id;
      const found = participants.find((p) => p.id === id);
      if (found) setCurrent(found);
    } catch {
      /* ignore */
    }
  }, [participants]);

  function handleLogin(p: P) {
    localStorage.setItem(CURRENT_KEY, JSON.stringify({ id: p.id }));
    setCurrent(p);
  }

  function handleSwitchUser() {
    localStorage.removeItem(CURRENT_KEY);
    setCurrent(null);
  }

  const votingOpen = isVotingOpen(settings);
  const heroTitle = settings.hero_title || 'Choose your research units';
  const heroSubtitle = settings.hero_subtitle || 'RTD Glocal Summit 2026';
  const instructions = settings.instructions || '';

  if (loading) {
    return (
      <div className="page participant">
        <p className="eyebrow">Loading…</p>
      </div>
    );
  }

  const myLabIds = current
    ? selections.filter((s) => s.participant_id === current.id).map((s) => s.lab_id)
    : [];

  return (
    <div className="page participant">
      <header className="participant__hero">
        <p className="eyebrow">{heroSubtitle}</p>
        <h1 className="participant__title">{heroTitle}</h1>
        {instructions && <p className="participant__lead">{instructions}</p>}
      </header>

      {current ? (
        <UnitPicker
          key={current.id}
          participant={current}
          groups={groups}
          labs={labs}
          initialLabIds={myLabIds}
          votingOpen={votingOpen}
          onSaved={() => undefined}
          onSwitchUser={handleSwitchUser}
        />
      ) : (
        <LoginForm subtitle="Sign in with your invited email to begin." onLogin={handleLogin} />
      )}
    </div>
  );
}
