import { ChevronLeft, Filter, CheckSquare, Clock, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { SUBJECT_COLORS } from "@/constants/colors";

interface Assignment {
  id: number;
  subject: string;
  subjectColor: string;
  subsubject?: string;
  title: string;
  description: string;
  deadline: string;
  type: "assignment" | "test";
  isUrgent: boolean;
  isCompleted: boolean;
  daysUntilDue?: number;
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

export function AssignmentsScreen() {
  const navigate = useNavigate();
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "assignment" | "test">("all");
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
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
      // ANNOUNCEMENTSテーブルからデータを取得（提出物とテストのみ）
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          description,
          type,
          due_date,
          subjects ( name ),
          subsubjects ( name )
        `)
        .in('type', ['assignment', 'test'])
        .order('due_date', { ascending: true });

      if (announcementsError) throw announcementsError;

      // SUBMISSIONSテーブルから完了状態を取得
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('announcement_id, status')
        .eq('user_id', userId);

      if (submissionsError) throw submissionsError;

      const submissionsMap = new Map(
        submissionsData?.map((s: any) => [s.announcement_id, s.status]) || []
      );

      const now = new Date();

      const assignments: Assignment[] = (announcementsData || []).map((item: any) => {
        // ISO形式の日付をローカル時刻として解釈（タイムゾーンのずれを防ぐ）
        let dueDate: Date | null = null;
        let daysUntilDue: number | null = null;
        if (item.due_date) {
          const dateStr = item.due_date.split('T')[0]; // "2025-01-15"
          const [year, month, day] = dateStr.split('-').map(Number);
          dueDate = new Date(year, month - 1, day);
          daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
        const isUrgent = daysUntilDue !== null && daysUntilDue > 0 && daysUntilDue <= 3;

        const subjectName = (Array.isArray(item.subjects) ? (item.subjects as any)[0]?.name : (item.subjects as any)?.name) || "";
        const subsubjectName = (Array.isArray(item.subsubjects) ? (item.subsubjects as any)[0]?.name : (item.subsubjects as any)?.name) || "";

        console.log("AssignmentsScreen - Subject mapping:", {
          subjectName,
          hasColor: !!SUBJECT_COLORS[subjectName],
          color: SUBJECT_COLORS[subjectName]
        });

        return {
          id: item.id,
          subject: subjectName,
          subjectColor: SUBJECT_COLORS[subjectName] || SUBJECT_COLORS["その他"] || "#7B9FE8",
          subsubject: subsubjectName,
          title: item.title,
          description: item.description || "",
          deadline: dueDate ? dueDate.toLocaleDateString('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          }) : "",
          type: item.type as 'assignment' | 'test',
          isUrgent,
          isCompleted: submissionsMap.get(item.id) === 'submitted',
          daysUntilDue: daysUntilDue || undefined,
        };
      });

      setPendingAssignments(assignments.filter(a => !a.isCompleted));
      setCompletedAssignments(assignments.filter(a => a.isCompleted));

      // Fetch all subjects from subjects table ordered by ID
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('name')
        .order('id', { ascending: true });

      if (subjectsError) {
        console.error("Error fetching subjects:", subjectsError);
      } else {
        const subjects = (subjectsData || []).map((s: any) => s.name);
        setAvailableSubjects(subjects);
      }
    } catch (err: any) {
      console.error("Error fetching assignments:", err);
      toast.error("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (assignmentId: number, currentStatus: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Get numeric user_id from users table by email
      const userId = await getUserIdByEmail(user.email);
      if (!userId) {
        toast.error("ユーザー情報の取得に失敗しました");
        return;
      }

      const newStatus = currentStatus ? 'pending' : 'submitted';

      const { error } = await supabase
        .from('submissions')
        .upsert({
          announcement_id: assignmentId,
          user_id: userId,
          status: newStatus,
          submitted_at: newStatus === 'submitted' ? new Date().toISOString() : null,
          submission_method: 'unknown',
        }, { onConflict: 'announcement_id,user_id' });

      if (error) {
        console.error("Error updating submission status:", error);
        toast.error("提出状況の更新に失敗しました");
      } else {
        toast.success(newStatus === 'submitted' ? "完了にしました" : "未完了に変更しました");
        fetchAssignments();
      }
    } catch (err) {
      console.error("Error in handleToggleComplete:", err);
      toast.error("提出状況の更新に失敗しました");
    }
  };

  const applyFilters = (assignments: Assignment[]) => {
    let filtered = assignments;

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(a => a.type === typeFilter);
    }

    // Subject filter
    if (subjectFilter) {
      filtered = filtered.filter(a => a.subject === subjectFilter);
    }

    return filtered;
  };

  const filteredPendingAssignments = applyFilters(pendingAssignments);
  const filteredCompletedAssignments = applyFilters(completedAssignments);

  const clearFilters = () => {
    setTypeFilter("all");
    setSubjectFilter(null);
  };

  const hasActiveFilters = typeFilter !== "all" || subjectFilter !== null;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
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
            提出物・テスト
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full relative"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="h-5 w-5" />
            {hasActiveFilters && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></div>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="pending" className="w-full">
          <div className="bg-white border-b border-border px-4">
            <TabsList className="w-full bg-transparent">
              <TabsTrigger
                value="pending"
                className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <Clock className="h-4 w-4 mr-2" />
                未提出 ({filteredPendingAssignments.length})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                完了 ({filteredCompletedAssignments.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100vh-160px)]">
            <TabsContent value="pending" className="p-4 space-y-3 m-0">
              {filteredPendingAssignments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {hasActiveFilters ? "フィルターに一致する項目がありません" : "未提出の項目がありません"}
                  </p>
                </div>
              ) : (
                filteredPendingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-1 h-20 rounded-full"
                      style={{ backgroundColor: assignment.subjectColor }}
                    ></div>
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => navigate(`/detail/${assignment.id}`)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-sm px-2 py-0.5 rounded-md text-white"
                          style={{
                            backgroundColor: assignment.subjectColor,
                            fontWeight: 500,
                          }}
                        >
                          {assignment.subject}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {assignment.title}
                        </span>
                      </div>
                      <p className="text-sm mb-2 whitespace-pre-line">
                        {assignment.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          期限: {assignment.deadline}
                        </div>
                        {assignment.type === "test" && (
                          <Badge
                            variant="outline"
                            className="text-xs rounded-md border-[#7B9FE8] text-[#7B9FE8]"
                          >
                            テスト
                          </Badge>
                        )}
                        {assignment.isUrgent && (
                          <Badge variant="destructive" className="text-xs rounded-md">
                            締切間近
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(assignment.id, assignment.isCompleted);
                      }}
                    >
                      <CheckSquare className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              )))}
            </TabsContent>

            <TabsContent value="completed" className="p-4 space-y-3 m-0">
              {filteredCompletedAssignments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {hasActiveFilters ? "フィルターに一致する項目がありません" : "完了した項目がありません"}
                  </p>
                </div>
              ) : (
                filteredCompletedAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-border opacity-75"
                  onClick={() => navigate(`/detail/${assignment.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-1 h-20 rounded-full"
                      style={{ backgroundColor: assignment.subjectColor }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-sm px-2 py-0.5 rounded-md text-white"
                          style={{
                            backgroundColor: assignment.subjectColor,
                            fontWeight: 500,
                          }}
                        >
                          {assignment.subject}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {assignment.title}
                        </span>
                      </div>
                      <p className="text-sm mb-2 whitespace-pre-line line-through text-muted-foreground">
                        {assignment.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs rounded-md bg-green-500">
                          完了
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {assignment.deadline}
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  </div>
                </div>
              )))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Filter Sheet */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <SheetContent side="right" className="w-[90%] sm:max-w-md p-0">
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl" style={{ fontWeight: 600 }}>
                フィルター
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setIsFilterOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SheetDescription className="text-sm text-muted-foreground mt-2">
              表示する項目を絞り込みます
            </SheetDescription>
          </SheetHeader>

          <div className="px-6 pb-6 space-y-6">
            {/* Type Filter */}
            <div>
              <p className="text-sm mb-3" style={{ fontWeight: 500 }}>種類</p>
              <div className="space-y-2">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    typeFilter === "all"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 bg-white"
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setTypeFilter("assignment")}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    typeFilter === "assignment"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 bg-white"
                  }`}
                >
                  提出物のみ
                </button>
                <button
                  onClick={() => setTypeFilter("test")}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    typeFilter === "test"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 bg-white"
                  }`}
                >
                  テストのみ
                </button>
              </div>
            </div>

            {/* Subject Filter */}
            <div>
              <p className="text-sm mb-3" style={{ fontWeight: 500 }}>教科</p>
              <div className="space-y-2">
                <button
                  onClick={() => setSubjectFilter(null)}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    subjectFilter === null
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 bg-white"
                  }`}
                >
                  すべて
                </button>
                {availableSubjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSubjectFilter(subject)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      subjectFilter === subject
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 bg-white"
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full h-12 rounded-xl"
                >
                  フィルターをクリア
                </Button>
              )}
              <Button
                onClick={() => setIsFilterOpen(false)}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90"
              >
                適用
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
