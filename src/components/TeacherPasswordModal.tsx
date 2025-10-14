import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface TeacherPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// 環境変数からパスワードを取得、デフォルトは "teacher2024"
const TEACHER_PASSWORD = import.meta.env.VITE_TEACHER_PASSWORD || "teacher2024";

export function TeacherPasswordModal({ open, onClose, onSuccess }: TeacherPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // パスワード検証
    if (password === TEACHER_PASSWORD) {
      // 成功時
      setPassword("");
      setIsLoading(false);
      onSuccess();
    } else {
      // 失敗時
      setError("パスワードが正しくありません");
      setIsLoading(false);
      setPassword("");
    }
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock className="h-5 w-5 text-primary" />
            先生ページへのアクセス
          </DialogTitle>
          <DialogDescription>
            先生専用ページにアクセスするには、パスワードを入力してください。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teacher-password">パスワード</Label>
              <Input
                id="teacher-password"
                type="password"
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="rounded-xl"
                autoFocus
                disabled={isLoading}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              ℹ️ デフォルトパスワード: <code className="bg-muted px-1.5 py-0.5 rounded">teacher2024</code>
              <br />
              環境変数 <code className="bg-muted px-1.5 py-0.5 rounded">VITE_TEACHER_PASSWORD</code> で変更可能
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-xl"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !password}
              className="rounded-xl bg-primary hover:bg-primary/90"
            >
              {isLoading ? "確認中..." : "確認"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
