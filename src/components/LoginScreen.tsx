import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { Mail } from "lucide-react";
import { TeacherPasswordModal } from "./TeacherPasswordModal";

export function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTeacherPasswordModalOpen, setIsTeacherPasswordModalOpen] = useState(false);

  const handleMicrosoftLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure' as any,
      options: {
        redirectTo: window.location.origin + '/auth/callback',
        scopes: 'email',
      },
    });

    if (error) {
      console.error("Error signing in with Microsoft:", error);
      alert("Microsoftでのサインイン中にエラーが発生しました。");
    }
  };

  const ensureUserInUsersTable = async (userEmail: string | undefined, userName: string | undefined) => {
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
        console.error('Error creating user in users table:', insertError);
        throw insertError;
      }
      console.log('User created in users table with email:', userEmail);
    } catch (err) {
      console.error('Error in ensureUserInUsersTable:', err);
      throw err;
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("メールアドレスとパスワードを入力してください");
      return;
    }

    setLoading(true);
    try {
      console.log("Attempting to sign in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("Sign in successful, user:", data.user?.id);

      // Ensure user exists in users table
      if (data.user) {
        console.log("Ensuring user exists in users table...");
        await ensureUserInUsersTable(
          data.user.email,
          data.user.user_metadata?.name || data.user.user_metadata?.full_name
        );
        console.log("User table check complete");
      }

      toast.success("ログインしました");
      navigate('/home');
    } catch (error: any) {
      console.error("Error signing in:", error);
      toast.error(error.message || "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("メールアドレスとパスワードを入力してください");
      return;
    }

    if (password.length < 6) {
      toast.error("パスワードは6文字以上にしてください");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Ensure user exists in users table
        await ensureUserInUsersTable(
          data.user.email,
          data.user.user_metadata?.name || data.user.user_metadata?.full_name
        );

        toast.success("アカウントを作成しました");
        navigate('/home');
      } else {
        toast.info("確認メールを送信しました。メールを確認してください。");
      }
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast.error(error.message || "アカウント作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherLogin = () => {
    setIsTeacherPasswordModalOpen(true);
  };

  const handleTeacherPasswordSuccess = () => {
    setIsTeacherPasswordModalOpen(false);
    toast.success("先生ページにアクセスします");
    navigate('/teacher');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F0FF] to-[#F5F0FF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-2 text-[#7B9FE8]" style={{ fontWeight: 600 }}>
            せいと手帳
          </h1>
          <p className="text-sm text-muted-foreground">学校生活をスマートに管理</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
          <Button
            onClick={handleMicrosoftLogin}
            className="w-full h-12 bg-white hover:bg-gray-50 text-foreground border border-border rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="flex gap-0.5">
                <div className="w-3 h-3 bg-[#F25022] rounded-sm"></div>
                <div className="w-3 h-3 bg-[#7FBA00] rounded-sm"></div>
              </div>
              <div className="flex gap-0.5">
                <div className="w-3 h-3 bg-[#00A4EF] rounded-sm"></div>
                <div className="w-3 h-3 bg-[#FFB900] rounded-sm"></div>
              </div>
              <span className="ml-2">Microsoftでサインイン</span>
            </div>
          </Button>

          {/* Email Sign In/Up Form */}
          <div className="space-y-4 pt-4 border-t border-border">
            <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@school.jp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-[#7B9FE8] hover:bg-[#6A8DD7] text-white rounded-xl"
                disabled={loading}
              >
                <Mail className="w-4 h-4 mr-2" />
                {loading ? "処理中..." : isSignUp ? "アカウント作成" : "メールでサインイン"}
              </Button>
            </form>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-[#7B9FE8] hover:underline w-full text-center"
              disabled={loading}
            >
              {isSignUp ? "すでにアカウントをお持ちの方はこちら" : "新規アカウント作成はこちら"}
            </button>
          </div>
        </div>

        <button
          onClick={handleTeacherLogin}
          className="text-xs text-center text-muted-foreground mt-4 w-full hover:text-foreground transition-colors"
        >
          🔑先生ログイン
        </button>

        <p className="text-xs text-center text-muted-foreground mt-6">
          利用することで、利用規約とプライバシーポリシーに同意したものとみなされます
        </p>
      </div>

      <TeacherPasswordModal
        open={isTeacherPasswordModalOpen}
        onClose={() => setIsTeacherPasswordModalOpen(false)}
        onSuccess={handleTeacherPasswordSuccess}
      />
    </div>
  );
}
