import { ChevronLeft, Calendar, Bell, Paperclip, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { ReminderModal } from "./ReminderModal";
import { SUBJECT_COLORS } from "@/constants/colors";

interface AnnouncementDetail {
  id: number;
  type: 'assignment' | 'test';
  title: string;
  description: string;
  due_date: string;
  submission_method?: string;
  subject: string;
  subjectColor: string;
  subsubject?: string;
  teacher: string;
  isCompleted: boolean;
  isUrgent: boolean;
  daysUntilDue?: number;
}

export function DetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (id) {
      fetchAnnouncementDetail(parseInt(id));
    }
  }, [id]);

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

  const fetchAnnouncementDetail = async (announcementId: number) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    try {
      // Get numeric user_id from users table by email
      const userId = await getUserIdByEmail(user.email);
      if (!userId) {
        toast.error("ユーザー情報の取得に失敗しました");
        navigate('/');
        return;
      }

      // ANNOUNCEMENTSテーブルから詳細データを取得
      const { data: announcementData, error: announcementError } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          description,
          type,
          due_date,
          submission_method,
          teacher_name,
          subjects ( name ),
          subsubjects ( name )
        `)
        .eq('id', announcementId)
        .single();

      if (announcementError) throw announcementError;

      // SUBMISSIONSテーブルから完了状態を取得
      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('status')
        .eq('announcement_id', announcementId)
        .eq('user_id', userId)
        .single();

      if (submissionError && submissionError.code !== 'PGRST116') {
        console.error("Error fetching submission:", submissionError);
      }

      const now = new Date();
      // ISO形式の日付をローカル時刻として解釈（タイムゾーンのずれを防ぐ）
      let dueDate: Date | null = null;
      let daysUntilDue: number | null = null;
      if (announcementData.due_date) {
        const dateStr = announcementData.due_date.split('T')[0]; // "2025-01-15"
        const [year, month, day] = dateStr.split('-').map(Number);
        dueDate = new Date(year, month - 1, day);
        daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
      const isUrgent = daysUntilDue !== null && daysUntilDue > 0 && daysUntilDue <= 3;

      const subjectName = (Array.isArray(announcementData.subjects) ? (announcementData.subjects as any)[0]?.name : (announcementData.subjects as any)?.name) || "";
      const subsubjectName = (Array.isArray(announcementData.subsubjects) ? (announcementData.subsubjects as any)[0]?.name : (announcementData.subsubjects as any)?.name) || "";
      const teacherName = announcementData.teacher_name || "";

      console.log("DetailScreen - Subject mapping:", {
        subjectName,
        hasColor: !!SUBJECT_COLORS[subjectName],
        color: SUBJECT_COLORS[subjectName]
      });

      setAnnouncement({
        id: announcementData.id,
        type: announcementData.type as 'assignment' | 'test',
        title: announcementData.title,
        description: announcementData.description || "",
        due_date: announcementData.due_date || "",
        submission_method: announcementData.submission_method,
        subject: subjectName,
        subjectColor: SUBJECT_COLORS[subjectName] || SUBJECT_COLORS["その他"] || "#7B9FE8",
        subsubject: subsubjectName,
        teacher: teacherName,
        isCompleted: submissionData?.status === 'submitted',
        isUrgent: isUrgent,
        daysUntilDue: daysUntilDue || undefined,
      });
    } catch (err: any) {
      console.error("Error fetching announcement detail:", err);
      toast.error("詳細情報の取得に失敗しました");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!announcement) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Get numeric user_id from users table by email
      const userId = await getUserIdByEmail(user.email);
      if (!userId) {
        toast.error("ユーザー情報の取得に失敗しました");
        return;
      }

      const newStatus = announcement.isCompleted ? 'pending' : 'submitted';

      const { error } = await supabase
        .from('submissions')
        .upsert({
          announcement_id: announcement.id,
          user_id: userId,
          status: newStatus,
          submitted_at: newStatus === 'submitted' ? new Date().toISOString() : null,
          submission_method: 'unknown',
        }, { onConflict: 'announcement_id,user_id' });

      if (error) {
        console.error("Error updating submission status:", error);
        toast.error("提出状況の更新に失敗しました");
      } else {
        setAnnouncement(prev => prev ? { ...prev, isCompleted: !prev.isCompleted } : null);
        toast.success(newStatus === 'submitted' ? "完了にしました" : "未完了に変更しました");
      }
    } catch (err) {
      console.error("Error in handleToggleComplete:", err);
      toast.error("エラーが発生しました");
    }
  };

  const formatDeadline = (dateString: string) => {
    if (!dateString) return "";
    // ISO形式の日付をローカル時刻として解釈（タイムゾーンのずれを防ぐ）
    const dateStr = dateString.split('T')[0]; // "2025-01-15"
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (!announcement) {
    return <div className="min-h-screen flex items-center justify-center">データが見つかりません</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl" style={{ fontWeight: 600 }}>
            詳細
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Subject Badge */}
        <div className="flex items-center gap-2">
          <span
            className="text-sm px-3 py-1 rounded-lg text-white"
            style={{ backgroundColor: announcement.subjectColor, fontWeight: 500 }}
          >
            {announcement.subject}
          </span>
          {announcement.subsubject && (
            <span className="text-sm text-muted-foreground">{announcement.subsubject}</span>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
          <div
            className="h-2"
            style={{
              background: `linear-gradient(90deg, ${announcement.subjectColor} 0%, ${announcement.subjectColor}CC 100%)`,
            }}
          ></div>

          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <h2 className="text-2xl mb-2" style={{ fontWeight: 600 }}>
                {announcement.title}
              </h2>
              <p className="text-muted-foreground">
                {announcement.description}
              </p>
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    {announcement.type === 'assignment' ? '提出期限' : '試験日'}
                  </p>
                  <p className="text-base" style={{ fontWeight: 500 }}>
                    {formatDeadline(announcement.due_date)}
                  </p>
                  {announcement.isUrgent && announcement.daysUntilDue !== undefined && (
                    <Badge variant="destructive" className="mt-2 rounded-md">
                      締切まであと{announcement.daysUntilDue}日
                    </Badge>
                  )}
                </div>
              </div>

              {announcement.submission_method && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Paperclip className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">提出方法</p>
                      <p className="text-base" style={{ fontWeight: 500 }}>
                        📤 {announcement.submission_method}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">リマインダー</p>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => setIsReminderOpen(true)}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    リマインダーを設定
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">メモ</p>
              <textarea
                className="w-full h-24 p-3 bg-muted rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="メモを入力..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {announcement.type === 'assignment' && (
            <Button
              className={`w-full h-12 rounded-xl ${
                announcement.isCompleted
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-primary hover:bg-primary/90"
              }`}
              onClick={handleToggleComplete}
            >
              <Check className="mr-2 h-5 w-5" />
              {announcement.isCompleted ? "完了済み" : "完了にする"}
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl"
            onClick={() => navigate(-1)}
          >
            戻る
          </Button>
        </div>
      </div>

      {/* Reminder Modal */}
      <ReminderModal
        open={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        announcementId={announcement.id}
        announcementTitle={announcement.title}
        dueDate={announcement.due_date}
      />
    </div>
  );
}
