import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AdminLoginCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, completeOryLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(searchParams.get('error_description') || oauthError);
      setProcessing(false);
      return;
    }

    const code = searchParams.get('code');
    if (!code) {
      setError('Kode otorisasi tidak ditemukan');
      setProcessing(false);
      return;
    }

    completeOryLogin(code, searchParams.get('state')).then(({ error: err }) => {
      if (err) {
        setError(err);
        setProcessing(false);
      } else {
        navigate('/admin', { replace: true });
      }
    });
  }, [searchParams, completeOryLogin, navigate]);

  useEffect(() => {
    if (!loading && user && !processing) {
      navigate('/admin', { replace: true });
    }
  }, [user, loading, processing, navigate]);

  return (
    <div className="admin-theme min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        {error ? (
          <>
            <p className="text-destructive font-medium">{error}</p>
            <a href="/admin/login" className="text-sm text-primary underline">Kembali ke login</a>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Menyelesaikan login SSO...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLoginCallback;
