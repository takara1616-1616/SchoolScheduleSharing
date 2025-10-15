import { List, Calendar, FileCheck, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { SUBJECT_COLORS } from "../constants/colors";
import { toast } from "sonner";

interface Assignment {
  id: number;
  subject: string;
  subjectColor: string;
  title: string;
  teacher: string;
  description: string;
  deadline: string;
  deadlineDate: Date;
  isSubmitted: boolean;
  submittedDate?: string;
  submission_method: string;
}

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

export function HistoryScreen() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "submitted" | "unsubmitted">("all");
  const [userId, setUserId] = useState<number | null>(null);

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][today.getDay()];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    try {
      // Get numeric user_id from users table by email
      const userIdValue = await getUserIdByEmail(user.email);
      if (!userIdValue) {
        toast.error("ユーザー情報の取得に失敗しました");
        navigate('/');
        return;
      }
      setUserId(userIdValue);

      // Fetch all assignments (assignments only, not tests)
      const now = new Date();
      const { data: announcementsData, error: announcementsError } = await supabase
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
        .eq('type', 'assignment')
        .order('due_date', { ascending: false }); // Most recent first

      if (announcementsError) throw announcementsError;

      const fetchedAssignments: Assignment[] = [];

      for (const announcement of announcementsData as any[]) {
        const subjectName = (Array.isArray(announcement.subjects)
          ? announcement.subjects[0]?.name
          : announcement.subjects?.name) || "";
        const subsubjectName = (Array.isArray(announcement.subsubjects)
          ? announcement.subsubjects[0]?.name
          : announcement.subsubjects?.name) || "";
        const teacherName = announcement.teacher_name || "";
        const displaySubject = subsubjectName ? `${subjectName} (${subsubjectName})` : subjectName;

        console.log("HistoryScreen - Subject mapping:", {
          subjectName,
          hasColor: !!SUBJECT_COLORS[subjectName],
          color: SUBJECT_COLORS[subjectName]
        });

        const subjectColor = SUBJECT_COLORS[subjectName] || SUBJECT_COLORS["その他"] || "#7B9FE8";

        // ISO形式の日付をローカル時刻として解釈（タイムゾーンのずれを防ぐ）
        const dateStr = announcement.due_date.split('T')[0]; // "2025-01-15"
        const [year, month, day] = dateStr.split('-').map(Number);
        const deadlineDate = new Date(year, month - 1, day);
        const deadlineFormatted = deadlineDate.toLocaleDateString('ja-JP', {
          month: 'long',
          day: 'numeric',
          weekday: 'short'
        });

        // Check submission status
        const { data: submissionData, error: submissionError } = await supabase
          .from('submissions')
          .select('status, submitted_at')
          .eq('announcement_id', announcement.id)
          .eq('user_id', userIdValue)
          .maybeSingle();

        if (submissionError && submissionError.code !== 'PGRST116') {
          console.error("Error fetching submission:", submissionError);
        }

        const isSubmitted = submissionData?.status === 'submitted';
        const submittedDate = submissionData?.submitted_at
          ? new Date(submissionData.submitted_at).toLocaleDateString('ja-JP', {
              month: 'long',
              day: 'numeric'
            })
          : undefined;

        // 提出履歴に表示するのは: 提出済み、または期限が過ぎたもの
        const isPastDeadline = deadlineDate < now;
        if (isSubmitted || isPastDeadline) {
          fetchedAssignments.push({
            id: announcement.id,
            subject: displaySubject,
            subjectColor: subjectColor,
            title: announcement.title,
            teacher: teacherName,
            description: announcement.description,
            deadline: deadlineFormatted,
            deadlineDate: deadlineDate,
            isSubmitted: isSubmitted,
            submittedDate: submittedDate,
            submission_method: announcement.submission_method,
          });
        }
      }

      setAssignments(fetchedAssignments);
    } catch (err: any) {
      console.error("Error fetching history:", err);
      toast.error("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === "submitted") return assignment.isSubmitted;
    if (filter === "unsubmitted") return !assignment.isSubmitted;
    return true;
  });

  const submittedCount = assignments.filter((a) => a.isSubmitted).length;
  const unsubmittedCount = assignments.filter((a) => !a.isSubmitted).length;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-center max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-xl text-[#7B9FE8]" style={{ fontWeight: 600 }}>
              提出履歴
            </h1>
            <p className="text-xs text-muted-foreground">
              {dateStr}({dayOfWeek})
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="w-full max-w-full px-4 py-4 space-y-4">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`bg-white rounded-xl p-3 border text-center transition-all hover:shadow-md ${
                filter === "all" ? "border-primary border-2 shadow-sm" : "border-border"
              }`}
            >
              <div className="text-2xl" style={{ fontWeight: 600 }}>
                {assignments.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">全課題</div>
            </button>
            <button
              onClick={() => setFilter("submitted")}
              className={`bg-green-50 rounded-xl p-3 border text-center transition-all hover:shadow-md ${
                filter === "submitted" ? "border-green-500 border-2 shadow-sm" : "border-green-200"
              }`}
            >
              <div className="text-2xl text-green-600" style={{ fontWeight: 600 }}>
                {submittedCount}
              </div>
              <div className="text-xs text-green-600 mt-1">提出済み</div>
            </button>
            <button
              onClick={() => setFilter("unsubmitted")}
              className={`bg-red-50 rounded-xl p-3 border text-center transition-all hover:shadow-md ${
                filter === "unsubmitted" ? "border-destructive border-2 shadow-sm" : "border-red-200"
              }`}
            >
              <div className="text-2xl text-destructive" style={{ fontWeight: 600 }}>
                {unsubmittedCount}
              </div>
              <div className="text-xs text-destructive mt-1">未提出</div>
            </button>
          </div>

          {/* Assignments List */}
          <div className="space-y-3">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-12">
                <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">課題がありません</p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={`rounded-2xl p-4 shadow-sm w-full max-w-full cursor-pointer hover:shadow-md transition-shadow ${
                    assignment.isSubmitted
                      ? "border border-border bg-white"
                      : "border-2 border-red-200 bg-red-50"
                  }`}
                  onClick={() => navigate(`/detail/${assignment.id}`)}
                >
                  <div className="flex gap-3 w-full max-w-full min-w-0">
                    {/* Left Color Bar */}
                    <div
                      className="w-1 rounded-full shrink-0"
                      style={{ backgroundColor: assignment.subjectColor }}
                    ></div>

                    {/* Card Content */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      {/* Top: Deadline */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg text-foreground shrink-0" style={{ fontWeight: 600 }}>
                            {assignment.deadline}
                          </span>
                          {assignment.isSubmitted ? (
                            <Badge className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-green-500 hover:bg-green-500">
                              提出済み
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="text-xs px-2 py-0.5 rounded-full shrink-0"
                            >
                              未提出
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Middle: Subject, Description, Teacher */}
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span
                          className="text-sm px-2.5 py-1 rounded-lg text-white whitespace-nowrap shrink-0"
                          style={{ backgroundColor: assignment.subjectColor, fontWeight: 500 }}
                        >
                          {assignment.subject}
                        </span>
                        <span className="text-base break-words" style={{ fontWeight: 500 }}>
                          {assignment.description}
                        </span>
                        {assignment.teacher && (
                          <span className="text-base text-muted-foreground whitespace-nowrap">
                            {assignment.teacher}
                          </span>
                        )}
                      </div>

                      {/* Submission Method */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="whitespace-nowrap">📤 {assignment.submission_method}</span>
                      </div>

                      {/* Submitted Date */}
                      {assignment.isSubmitted && assignment.submittedDate && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Check className="h-4 w-4" />
                          <span>{assignment.submittedDate} 提出</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Status Icon */}
                    <div className="shrink-0 self-start">
                      {assignment.isSubmitted ? (
                        <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-red-100 border-2 border-destructive flex items-center justify-center">
                          <X className="w-5 h-5 text-destructive" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => navigate("/home")}
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-2 gap-1"
            >
              <List className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">お知らせ</span>
            </Button>
            <Button
              onClick={() => navigate("/calendar")}
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-2 gap-1"
            >
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">スケジュール</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col h-auto py-2 gap-1">
              <FileCheck className="h-5 w-5 text-primary" />
              <span className="text-xs text-primary">履歴</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
