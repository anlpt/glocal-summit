import { useState } from 'react';
import type { Participant } from '../../types.ts';
import { db } from '../../lib/db.ts';

interface LoginFormProps {
  subtitle: string;
  onLogin: (participant: Participant, typed: { name: string; country: string }) => void;
}

export default function LoginForm({ subtitle, onLogin }: LoginFormProps) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const match = await db.findParticipantByEmail(email);
      if (!match) {
        setError(
          "We couldn't find that email on the invited list. Please use the email your invitation was sent to, or contact the organizers.",
        );
        return;
      }
      onLogin(match, { name: name.trim(), country: country.trim() });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
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
        <span className="field__label">Invited email</span>
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
    </form>
  );
}
