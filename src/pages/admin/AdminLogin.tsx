import { useState } from 'react';

interface Props {
  onAuthed: () => void;
}

// NOTE: Client-side gate for a low-sensitivity event tool (see design §5/§8).
const ADMIN_USER = 'admin';
const ADMIN_PASS = '123';

export default function AdminLogin({ onAuthed }: Props) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (user.trim() === ADMIN_USER && pass === ADMIN_PASS) {
      sessionStorage.setItem('gs_admin', 'ok');
      onAuthed();
    } else {
      setError(true);
    }
  }

  return (
    <div className="page admin">
      <form className="login" onSubmit={submit} style={{ marginTop: 'var(--space-5)' }}>
        <p className="eyebrow">Admin</p>
        <p className="login__subtitle">Sign in to manage the summit.</p>
        <label className="field">
          <span className="field__label">Username</span>
          <input
            className="field__input"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="field">
          <span className="field__label">Password</span>
          <input
            className="field__input"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p className="login__error" role="alert">
            Incorrect username or password.
          </p>
        )}
        <button className="btn btn--primary" type="submit">
          Enter
        </button>
      </form>
    </div>
  );
}
