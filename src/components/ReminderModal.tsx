import { X, Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReminderModalProps {
  open: boolean;
  onClose: () => void;
  announcementId: number;
  announcementTitle: string;
  dueDate?: string;
  noticeType?: 'assignment' | 'test' | 'general_notice';
}

interface ReminderOption {
  id: string;
  label: string;
  description: string;
  calculateTime: (dueDate: Date) => Date;
}

const reminderOptions: ReminderOption[] = [
  {
    id: "1day",
    label: "1日前",
    description: "提出期限の1日前 9:00",
    calculateTime: (dueDate: Date) => {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      reminderDate.setHours(9, 0, 0, 0);
      return reminderDate;
    },
  },
  {
    id: "morning",
    label: "当日の朝",
    description: "提出日の朝 8:00",
    calculateTime: (dueDate: Date) => {
      const reminderDate = new Date(dueDate);
      reminderDate.setHours(8, 0, 0, 0);
      return reminderDate;
    },
  },
  {
    id: "1hour",
    label: "1時間前",
    description: "提出期限の1時間前",
    calculateTime: (dueDate: Date) => {
      const reminderDate = new Date(dueDate);
      reminderDate.setHours(reminderDate.getHours() - 1);
      return reminderDate;
    },
  },
];

export function ReminderModal({
  open,
  onClose,
  announcementId,
  announcementTitle,
  dueDate,
  noticeType,
}: ReminderModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingReminders, setExistingReminders] = useState<any[]>([]);

  // カスタム設定用のステート
  const [customDate, setCustomDate] = useState<string>(""); // "YYYY-MM-DD" 形式
  const [customTime, setCustomTime] = useState<string>(""); // "HH:mm" 形式

  console.log("Current selected option:", selected);

  useEffect(() => {
    if (open && announcementId) {
      fetchExistingReminders();
    }
  }, [open, announcementId]);

  // Utility function to get numeric user_id from users table by email
  const getUserIdByEmail = async (userEmail: string | undefined): Promise<number | null> => {
    if (!userEmail) {
      console.error("No email provided");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user_id:", error);
        return null;
      }

      if (!data) {
        console.error("User not found in users table for email:", userEmail);
        return null;
      }

      return data.id;
    } catch (err) {
      console.error("Exception in getUserIdByEmail:", err);
      return null;
    }
  };

  const fetchExistingReminders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const userId = await getUserIdByEmail(user.email);
      if (!userId) return;

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('announcement_id', announcementId)
        .eq('user_id', userId);

      if (error) throw error;
      setExistingReminders(data || []);
    } catch (err) {
      console.error("Error fetching reminders:", err);
    }
  };

  const handleSave = async () => {
    if (!selected) {
      toast.error("通知予定オプションを選択してください");
      return;
    }

    // カスタム設定の場合のバリデーション
    if (selected === "custom") {
      if (!customDate) {
        toast.error("日付を選択してください");
        return;
      }
      if (!customTime) {
        toast.error("時刻を入力してください");
        return;
      }
    } else {
      // 固定オプションの場合のバリデーション
      if (!dueDate) {
        toast.error("提出期限が設定されていません");
        return;
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("ユーザー情報が取得できません");
      return;
    }

    setLoading(true);

    try {
      const userId = await getUserIdByEmail(user.email);
      if (!userId) {
        toast.error("ユーザー情報の取得に失敗しました");
        return;
      }

      let reminderDateTime: Date;

      if (selected === "custom") {
        // カスタム設定の場合
        const [hours, minutes] = customTime.split(':').map(Number);
        // customDate は "YYYY-MM-DD" 形式の文字列
        // new Date(customDate) で Date オブジェクトを作成
        const selectedDateObj = new Date(customDate);
        reminderDateTime = new Date(
          selectedDateObj.getFullYear(),
          selectedDateObj.getMonth(),
          selectedDateObj.getDate(),
          hours,
          minutes,
          0,
          0
        );
      } else {
        // 固定オプションの場合
        const option = reminderOptions.find(opt => opt.id === selected);
        if (!option) throw new Error("Invalid option");

        // dueDateObj はローカルタイムゾーンの午前0時
        const dateStr = dueDate ? dueDate.split('T')[0] : ""; // dueDateがundefinedの場合を考慮
        const [year, month, day] = dateStr.split('-').map(Number);
        const dueDateObj = new Date(year, month - 1, day);

        reminderDateTime = option.calculateTime(dueDateObj);
      }

      // ローカルタイムゾーンの時刻をUTCに変換してからtoISOString()
      const offset = reminderDateTime.getTimezoneOffset() * 60 * 1000; // ミリ秒単位に変換
      const utcReminderDateTime = new Date(reminderDateTime.getTime() - offset);

      console.log("Attempting to insert reminder:", {
        user_id: userId,
        announcement_id: announcementId,
        remind_at: utcReminderDateTime.toISOString(),
      });

      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: userId,
          announcement_id: announcementId,
          remind_at: utcReminderDateTime.toISOString(),
        })
        .select();

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log("Successfully inserted reminder:", data);

      toast.success("通知予定を設定しました");
      setSelected(null);
      setCustomDate(""); // カスタム設定をリセット
      setCustomTime("");        // カスタム設定をリセット
      fetchExistingReminders();
      onClose();
    } catch (err: any) {
      console.error("Error saving reminder:", err);
      toast.error("通知予定の設定に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReminder = async (reminderId: number) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;

      toast.success("通知予定を削除しました");
      fetchExistingReminders();
    } catch (err: any) {
      console.error("Error deleting reminder:", err);
      toast.error("通知予定の削除に失敗しました");
    }
  };

  const formatReminderTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-0 gap-0" aria-describedby="reminder-description">
        <>
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl" style={{ fontWeight: 600 }}>
                通知予定設定
              </DialogTitle>
              
            </div>
            <DialogDescription id="reminder-description" className="text-sm text-muted-foreground mt-2">
              提出期限の通知タイミングを選択してください
            </DialogDescription>
          </DialogHeader>

          {/* Existing Reminders */}
          {existingReminders.length > 0 && (
            <div className="px-6 pb-4 space-y-2">
              <p className="text-sm text-muted-foreground">設定済み通知予定</p>
              <div className="space-y-2">
                {existingReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="text-sm">
                      {formatReminderTime(reminder.remind_at)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReminder(reminder.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-6 pb-6 space-y-3">
            {reminderOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selected === option.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      selected === option.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selected === option.id && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-base mb-1" style={{ fontWeight: 500 }}>
                      {option.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {/* カスタム設定オプション */}
            <button
              onClick={() => setSelected("custom")}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selected === "custom"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    selected === "custom"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {selected === "custom" && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-base mb-1" style={{ fontWeight: 500 }}>
                    カスタム設定
                  </p>
                  <p className="text-sm text-muted-foreground">
                    任意の日時を設定
                  </p>
                  {selected === "custom" && (
                    <div className="mt-4 space-y-3">
                      {/* 日付入力 */}
                      <Label htmlFor="custom-date">日付</Label>
                      <Input
                        id="custom-date"
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full"
                      />

                      {/* 時刻入力 */}
                      <Label htmlFor="custom-time">時刻</Label>
                      <Input
                        id="custom-time"
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>

          <div className="p-6 pt-0 space-y-3">
            <Button
              onClick={handleSave}
              disabled={!selected || loading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
            >
              <Bell className="mr-2 h-5 w-5" />
              {loading ? "設定中..." : "設定する"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full h-12 rounded-xl"
              disabled={loading}
            >
              キャンセル
            </Button>

          </div>
        </>
      </DialogContent>
    </Dialog>
  );
}
