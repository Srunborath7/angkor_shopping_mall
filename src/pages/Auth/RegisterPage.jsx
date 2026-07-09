import React from 'react';

export default function RegisterPage({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  roleId,
  setRoleId,
  roles,
  onSubmit,
  loading,
  onNavigate
}) {
  return (
    <form onSubmit={onSubmit} style={styles.form}>
      <h3 style={styles.modeTitle}>Create New Account</h3>

      <div className="input-group">
        <label>Full Name</label>
        <input
          type="text"
          className="input-control"
          placeholder="Dara Srun"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="input-group">
        <label>Email Address</label>
        <input
          type="email"
          className="input-control"
          placeholder="dara@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="input-group">
        <label>Phone Number</label>
        <input
          type="tel"
          className="input-control"
          placeholder="0974242291"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <div className="input-group">
        <label>Password</label>
        <input
          type="password"
          className="input-control"
          placeholder="Minimum 5 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="input-group">
        <label>Select User Role</label>
        <select
          className="input-control"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        >
          {roles.map((r) => (
            <option key={r.id || r._id} value={r.id || r._id}>
              {r.name} ({r.description})
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
        {loading ? <div className="spinner"></div> : 'Register Account'}
      </button>

      <div style={styles.footerLinks}>
        <span>Already have an account?</span>
        <button type="button" style={styles.footerLinkBtn} onClick={() => onNavigate('login')}>
          Sign In
        </button>
      </div>
    </form>
  );
}

const styles = {
  form: {
    textAlign: 'left',
  },
  modeTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    marginBottom: '20px',
    textAlign: 'center',
    color: 'var(--text-primary)',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '1rem',
    marginTop: '10px',
  },
  footerLinks: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  footerLinkBtn: {
    background: 'none',
    border: 'none',
    fontWeight: '600',
    color: 'hsl(var(--primary))',
    cursor: 'pointer',
  },
};
