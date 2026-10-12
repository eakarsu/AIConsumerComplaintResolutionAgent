import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { apiFetch } from '../api.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoAvailable, setDemoAvailable] = useState(false);
  const nav = useNavigate();
  const { login, demoLogin } = useAuth();

  useEffect(() => {
    apiFetch('/api/auth/demo-status').then((data) => setDemoAvailable(Boolean(data.available))).catch(() => setDemoAvailable(false));
  }, []);

  async function onDemoLogin() {
    setErr('');
    setBusy(true);
    try {
      await demoLogin();
      nav('/');
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email, password);
      nav('/');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <h2>Sign in</h2>
      <p className="muted">Access your complaint resolution agent tools.</p>
      <form onSubmit={onSubmit}>
        <div className="form-row">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {err && <div className="error">{err}</div>}
        <button
          type="button"
          onClick={onDemoLogin}
          disabled={busy || !demoAvailable}
          aria-label="Log In as Demo"
          style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
        >
          {demoAvailable ? 'Log In as Demo' : 'Demo login unavailable'}
        </button>
        <button className="primary" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
