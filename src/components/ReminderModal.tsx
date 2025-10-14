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

interface ReminderModalProps {
  open: boolean;
  onClose: () => void;
  announcementId: number;
  announcementTitle: string;
  dueDate?: string;
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
}: ReminderModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingReminders, setExistingReminders] = useState<any[]>([]);

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
      toast.error("リマインダーオプションを選択してください");
      return;
    }

    if (!dueDate) {
      toast.error("提出期限が設定されていません");
      return;
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

      const option = reminderOptions.find(opt => opt.id === selected);
      if (!option) throw new Error("Invalid option");

      const dueDateObj = new Date(dueDate);
      const reminderDateTime = option.calculateTime(dueDateObj);

      const { error } = await supabase
        .from('reminders')
        .insert({
          user_id: userId,
          announcement_id: announcementId,
          remind_at: reminderDateTime.toISOString(),
        });

      if (error) throw error;

      toast.success("リマインダーを設定しました");
      setSelected(null);
      fetchExistingReminders();
      onClose();
    } catch (err: any) {
      console.error("Error saving reminder:", err);
      toast.error("リマインダーの設定に失敗しました");
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

      toast.success("リマインダーを削除しました");
      fetchExistingReminders();
    } catch (err: any) {
      console.error("Error deleting reminder:", err);
      toast.error("リマインダーの削除に失敗しました");
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
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl" style={{ fontWeight: 600 }}>
              リマインダー設定
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <DialogDescription id="reminder-description" className="text-sm text-muted-foreground mt-2">
            提出期限の通知タイミングを選択してください
          </DialogDescription>
        </DialogHeader>

        {/* Existing Reminders */}
        {existingReminders.length > 0 && (
          <div className="px-6 pb-4 space-y-2">
            <p className="text-sm text-muted-foreground">設定済みリマインダー</p>
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
      </DialogContent>
    </Dialog>
  );
}
