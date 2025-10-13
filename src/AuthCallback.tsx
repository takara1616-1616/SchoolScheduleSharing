import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthChange = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // 認証成功後、ホーム画面などにリダイレクト
        navigate('/home'); // 例: ホーム画面にリダイレクト
      } else {
        // 認証失敗またはセッションがない場合、ログイン画面にリダイレクト
        navigate('/');
      }
    };

    handleAuthChange();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/home');
      } else {
        navigate('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div>
      <p>認証情報を処理中...</p>
    </div>
  );
}
