import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import bgnLogo from '@/assets/sidak-bgn-logo.png';
import bgnSsoLogo from '@/assets/bgn-logo.png';
import { TurnstileWidget, isTurnstileEnabled } from '@/components/shared/TurnstileWidget';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const navigate = useNavigate();
  const { signIn, signInWithOry, user, authMode, oryEnabled } = useAuth();
  const { toast } = useToast();

  if (user) {
    navigate('/admin');
    return null;
  }

  const showLocal = authMode === 'local' || authMode === 'both';
  const showOry = oryEnabled && (authMode === 'ory' || authMode === 'both');

  const turnstileRequired = isTurnstileEnabled;
  const turnstileReady = !turnstileRequired || !!turnstileToken;

  const resetTurnstile = () => {
    setTurnstileToken(null);
    setTurnstileKey((k) => k + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileReady) return;
    setLoading(true);
    const { error } = await signIn(email, password, turnstileToken || undefined);
    if (error) {
      resetTurnstile();
      toast({ title: 'Gagal masuk', description: error, variant: 'destructive' });
    } else {
      navigate('/admin');
    }
    setLoading(false);
  };

  const handleSso = async () => {
    if (!turnstileReady) return;
    setSsoLoading(true);
    try {
      await signInWithOry();
    } catch (e) {
      resetTurnstile();
      toast({
        title: 'Gagal',
        description: e instanceof Error ? e.message : 'SSO tidak tersedia',
        variant: 'destructive',
      });
      setSsoLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors';

  return (
    <div className="admin-theme min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-info/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-card rounded-xl shadow-[0_8px_40px_rgba(7,30,73,0.15)] px-8 py-10 border border-border">
        <Link
          to="/"
          className="flex items-center gap-3 mb-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 w-fit"
        >
          <img src={bgnLogo} alt="Logo BGN" className="w-10 h-10 rounded-lg shrink-0" />
          <div>
            <p className="font-bold text-primary text-base leading-tight">Sidak BGN</p>
            <p className="text-sm text-muted-foreground leading-tight mt-0.5">CMS Admin</p>
          </div>
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary tracking-tight">Masuk ke CMS</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Kelola berita dan konten portal BGN</p>
        </div>

        {showLocal && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Username</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin"
                required
                autoComplete="username"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="current-password"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !turnstileReady}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        )}

        {showLocal && showOry && (
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">atau</span>
            </div>
          </div>
        )}

        {showOry && (
          <button
            type="button"
            onClick={handleSso}
            disabled={ssoLoading || !turnstileReady}
            className="w-full flex items-center justify-center gap-2 border border-border text-primary py-3 rounded-lg font-semibold hover:bg-muted transition-colors disabled:opacity-50"
          >
            {ssoLoading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <img src={bgnSsoLogo} alt="Logo BGN" className="w-6 h-6 rounded-full object-cover" />
                Masuk dengan SSO
              </>
            )}
          </button>
        )}

        <div className="mt-6 flex justify-center">
          <TurnstileWidget
            key={turnstileKey}
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
