import React from 'react';

export default function ForgotPasswordPage({
  recoveryMethod,
  setRecoveryMethod,
  recoveryEmail,
  setRecoveryEmail,
  recoveryPhone,
  setRecoveryPhone,
  recoveryStep,
  setRecoveryStep,
  otpCode,
  setOtpCode,
  newPassword,
  setNewPassword,
  onSendOTP,
  onVerifyOTP,
  onResetPassword,
  loading,
  onNavigate
}) {
  return (
    <div style={styles.container}>
      <h3 style={styles.modeTitle}>Recover Password</h3>

      {recoveryStep === 1 && (
        <form onSubmit={onSendOTP}>
          {/* Method selector tabs */}
          <div style={styles.recoveryMethods}>
            <button
              type="button"
              style={{
                ...styles.recoveryMethodTab,
                ...(recoveryMethod === 'email' ? styles.activeRecoveryTab : {})
              }}
              onClick={() => setRecoveryMethod('email')}
            >
              ✉️ Email OTP
            </button>
            <button
              type="button"
              style={{
                ...styles.recoveryMethodTab,
                ...(recoveryMethod === 'telegram' ? styles.activeRecoveryTab : {})
              }}
              onClick={() => setRecoveryMethod('telegram')}
            >
              ✈️ Telegram OTP
            </button>
          </div>

          {recoveryMethod === 'email' ? (
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                className="input-control"
                placeholder="dara@gmail.com"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="input-group">
              <label>Telegram Registered Phone</label>
              <input
                type="tel"
                className="input-control"
                placeholder="0974242291"
                value={recoveryPhone}
                onChange={(e) => setRecoveryPhone(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? <div className="spinner"></div> : 'Send Verification OTP'}
          </button>
        </form>
      )}

      {recoveryStep === 2 && (
        <form onSubmit={onVerifyOTP}>
          <p style={styles.stepDesc}>
            Enter the 6-digit code sent to your{' '}
            <strong>{recoveryMethod === 'email' ? recoveryEmail : `Telegram phone (${recoveryPhone})`}</strong>
          </p>
          
          <div className="input-group">
            <label>OTP Code</label>
            <input
              type="text"
              className="input-control"
              placeholder="Enter 6-digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? <div className="spinner"></div> : 'Verify Code'}
          </button>
        </form>
      )}

      {recoveryStep === 3 && (
        <form onSubmit={onResetPassword}>
          <div className="input-group">
            <label>New Password</label>
            <input
              type="password"
              className="input-control"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? <div className="spinner"></div> : 'Save New Password'}
          </button>
        </form>
      )}

      <div style={styles.footerLinks}>
        <button type="button" style={styles.footerLinkBtn} onClick={() => onNavigate('login')}>
          ⬅️ Back to Login
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    textAlign: 'left',
  },
  modeTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    marginBottom: '20px',
    textAlign: 'center',
    color: 'var(--text-primary)',
  },
  recoveryMethods: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  recoveryMethodTab: {
    flex: 1,
    padding: '10px',
    border: '1px solid var(--border-card)',
    borderRadius: '8px',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  activeRecoveryTab: {
    borderColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary))',
    background: 'hsla(var(--primary), 0.05)',
  },
  stepDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '16px',
    lineHeight: '1.4',
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
