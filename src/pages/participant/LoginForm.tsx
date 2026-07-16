import { useState } from 'react';
import type { Participant } from '../../types.ts';
import { db } from '../../lib/db.ts';

interface LoginFormProps {
  subtitle: string;
  allowRegistration: boolean;
  onLogin: (participant: Participant, typed: { name: string; country: string }) => void;
}

export default function LoginForm({ subtitle, allowRegistration, onLogin }: LoginFormProps) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const match = await db.findParticipantByEmail(email);
      if (match) {
        onLogin(match, { name: name.trim(), country: country.trim() });
        return;
      }
      // Not on the invited list.
      if (!allowRegistration) {
        setError(
          "We couldn't find that email on the invited list. Please use the email your invitation was sent to, or contact the organizers.",
        );
        return;
      }
      // Offer registration.
      setMode('register');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !org.trim()) {
      setError('Please fill in your name, email, and organization.');
      return;
    }
    setBusy(true);
    try {
      // Guard against a race: if the email now exists, just log in.
      const existing = await db.findParticipantByEmail(email);
      if (existing) {
        onLogin(existing, { name: name.trim(), country: country.trim() });
        return;
      }
      await db.saveParticipant({
        id: 0,
        stt: '',
        title: title.trim(),
        name: name.trim(),
        country: country.trim(),
        org: org.trim(),
        org_logo_url: null,
        role: '',
        email: email.trim().toLowerCase(),
        coordinator: '',
        group_id: null,
        self_registered: true,
      });
      const created = await db.findParticipantByEmail(email);
      if (!created) throw new Error('Could not create your registration. Please try again.');
      onLogin(created, { name: name.trim(), country: country.trim() });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (mode === 'register') {
    return (
      <form className="login" onSubmit={handleRegister} noValidate>
        <p className="login__subtitle">
          You're not on the invited list yet — register below to join and select your research units.
        </p>
        <label className="field">
          <span className="field__label">Full name</span>
          <input
            className="field__input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            required
          />
        </label>
        <label className="field">
          <span className="field__label">Email</span>
          <input
            className="field__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@institution.edu"
            autoComplete="email"
            required
          />
        </label>
        <label className="field">
          <span className="field__label">Organization</span>
          <input
            className="field__input"
            type="text"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="University / institution"
            autoComplete="organization"
            required
          />
        </label>
        <div className="field__grid">
          <label className="field">
            <span className="field__label">Country</span>
            <input
              className="field__input"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Your country"
              autoComplete="country-name"
            />
          </label>
          <label className="field">
            <span className="field__label">Title / position (optional)</span>
            <input
              className="field__input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Professor, Researcher"
            />
          </label>
        </div>
        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}
        <div className="login__actions">
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? 'Registering…' : 'Register & join'}
          </button>
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Back
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="login" onSubmit={handleSubmit} noValidate>
      <p className="login__subtitle">{subtitle}</p>
      <label className="field">
        <span className="field__label">Full name</span>
        <input
          className="field__input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          required
        />
      </label>
      <label className="field">
        <span className="field__label">Country</span>
        <input
          className="field__input"
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Your country"
          autoComplete="country-name"
          required
        />
      </label>
      <label className="field">
        <span className="field__label">Email</span>
        <input
          className="field__input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@institution.edu"
          autoComplete="email"
          required
        />
      </label>
      {error && (
        <p className="login__error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn--primary" type="submit" disabled={busy}>
        {busy ? 'Checking…' : 'Continue'}
      </button>
      {allowRegistration && (
        <p className="login__hint">
          Not on the invited list? Enter your email and continue to register.
        </p>
      )}
    </form>
  );
}
