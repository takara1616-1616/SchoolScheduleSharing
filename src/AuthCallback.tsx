import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const ensureUserExists = async (userEmail: string | undefined, userName: string | undefined) => {
      if (!userEmail) {
        console.error('No email provided, cannot create user');
        return;
      }

      try {
        // Check if user exists by email
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();

        if (existingUser) {
          console.log('User already exists in users table (email:', userEmail, ')');
          return;
        }

        // User doesn't exist, create new user
        const defaultName = userName || userEmail.split('@')[0] || 'ユーザー';

        const { error: insertError } = await supabase
          .from('users')
          .insert({
            email: userEmail,
            name: defaultName,
            ms_account_id: null, // Not used anymore
          });

        if (insertError) {
          console.error('Error creating user:', insertError);
          throw insertError;
        }
        console.log('New user created in users table with email:', userEmail);
      } catch (err) {
        console.error('Error in ensureUserExists:', err);
        throw err;
      }
    };

    const handleAuthChange = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        try {
          // Ensure user exists in users table before redirecting
          await ensureUserExists(
            session.user.email,
            session.user.user_metadata?.name || session.user.user_metadata?.full_name
          );
          // 認証成功後、ホーム画面などにリダイレクト
          navigate('/home');
        } catch (err) {
          console.error('Failed to ensure user exists:', err);
          // Still navigate even if user creation fails
          navigate('/home');
        }
      } else {
        // 認証失敗またはセッションがない場合、ログイン画面にリダイレクト
        navigate('/');
      }
    };

    handleAuthChange();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          await ensureUserExists(
            session.user.email,
            session.user.user_metadata?.name || session.user.user_metadata?.full_name
          );
          navigate('/home');
        } catch (err) {
          console.error('Failed to ensure user exists:', err);
          navigate('/home');
        }
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
