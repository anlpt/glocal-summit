import { useState } from 'react';
import { useSummit } from '../../hooks/useSummit.ts';
import { hasSupabase } from '../../lib/db.ts';
import AdminLogin from './AdminLogin.tsx';
import OverviewPanel from './panels/OverviewPanel.tsx';
import GroupsLabsPanel from './panels/GroupsLabsPanel.tsx';
import ParticipantsPanel from './panels/ParticipantsPanel.tsx';
import SelectionsPanel from './panels/SelectionsPanel.tsx';
import './admin.css';

type Tab = 'overview' | 'groups' | 'participants' | 'selections';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'groups', label: 'Groups & Units' },
  { id: 'participants', label: 'Participants' },
  { id: 'selections', label: 'Selections' },
];

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('gs_admin') === 'ok');
  const [tab, setTab] = useState<Tab>('overview');
  const summit = useSummit();

  if (!authed) return <AdminLogin onAuthed={() => setAuthed(true)} />;

  function signOut() {
    sessionStorage.removeItem('gs_admin');
    setAuthed(false);
  }

  return (
    <div className="admin">
      <div className="admin__inner">
        <header className="admin__head">
          <div>
            <p className="eyebrow">Control room</p>
            <h1 className="admin__title">Summit admin</h1>
          </div>
          <div className="admin__head-right">
            <span className={'admin__mode' + (hasSupabase ? ' is-live' : '')}>
              {hasSupabase ? 'Supabase · live' : 'Offline · local data'}
            </span>
            <button className="btn btn--ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>

        <nav className="admin__tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={'admin__tab' + (tab === t.id ? ' is-on' : '')}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {summit.error && <p className="admin__error">{summit.error}</p>}

        <div className="admin__body">
          {tab === 'overview' && <OverviewPanel summit={summit} />}
          {tab === 'groups' && <GroupsLabsPanel summit={summit} />}
          {tab === 'participants' && <ParticipantsPanel summit={summit} />}
          {tab === 'selections' && <SelectionsPanel summit={summit} />}
        </div>
      </div>
    </div>
  );
}
