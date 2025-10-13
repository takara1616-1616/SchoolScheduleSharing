import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// テストユーザーの認証情報
const TEST_CREDENTIALS = {
  student: {
    email: 'test-student@example.com',
    password: 'test1234',
  },
  teacher: {
    email: 'test-teacher@example.com',
    password: 'test1234',
  },
};

export function LoginScreen() {
  const navigate = useNavigate();

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

  const handleTestLogin = async (role: 'student' | 'teacher') => {
    const credentials = TEST_CREDENTIALS[role];

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      toast.success(`テストユーザー（${role === 'student' ? '生徒' : '教師'}）としてログインしました`);
      navigate('/home');
    } catch (error: any) {
      console.error("Error signing in with test account:", error);
      toast.error("テストログインに失敗しました。Supabaseにテストユーザーを作成してください。");
    }
  };

  const handleTeacherLogin = () => {
    // 先生ログインのロジックをここに実装
    alert("先生ログインはまだ実装されていません。");
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

          {/* 開発モード用テストログイン */}
          {import.meta.env.DEV && (
            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                🔧 開発モード用テストログイン
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleTestLogin('student')}
                  variant="outline"
                  className="w-full h-10 rounded-xl text-sm"
                >
                  👨‍🎓 生徒
                </Button>
                <Button
                  onClick={() => handleTestLogin('teacher')}
                  variant="outline"
                  className="w-full h-10 rounded-xl text-sm"
                >
                  👨‍🏫 教師
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                test-student@example.com / test-teacher@example.com
              </p>
            </div>
          )}
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
    </div>
  );
}
