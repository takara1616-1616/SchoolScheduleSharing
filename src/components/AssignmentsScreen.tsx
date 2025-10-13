import { ChevronLeft, Filter, CheckSquare, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

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

export function AssignmentsScreen() {
  const navigate = useNavigate();
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

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
      // ANNOUNCEMENTSテーブルからデータを取得
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
        .order('due_date', { ascending: true });

      if (announcementsError) throw announcementsError;

      // SUBMISSIONSテーブルから完了状態を取得
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('announcement_id, status')
        .eq('user_id', user.id);

      if (submissionsError) throw submissionsError;

      const submissionsMap = new Map(
        submissionsData?.map((s: any) => [s.announcement_id, s.status]) || []
      );

      const now = new Date();
      const subjectColors: { [key: string]: string } = {
        "国語": "#FF9F9F",
        "数学": "#7B9FE8",
        "英語": "#FFD6A5",
        "理科": "#A8E8D8",
        "社会": "#B8A8E8",
        "保健体育": "#FFA8C8",
        "芸術": "#FFB8E8",
        "家庭": "#FFE8A8",
        "情報": "#C8D8FF",
      };

      const assignments: Assignment[] = (announcementsData || []).map((item: any) => {
        const dueDate = item.due_date ? new Date(item.due_date) : null;
        const daysUntilDue = dueDate
          ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const isUrgent = daysUntilDue !== null && daysUntilDue > 0 && daysUntilDue <= 3;

        const subjectName = (Array.isArray(item.subjects) ? (item.subjects as any)[0]?.name : (item.subjects as any)?.name) || "";
        const subsubjectName = (Array.isArray(item.subsubjects) ? (item.subsubjects as any)[0]?.name : (item.subsubjects as any)?.name) || "";

        return {
          id: item.id,
          subject: subjectName,
          subjectColor: subjectColors[subjectName] || "#7B9FE8",
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

    const newStatus = currentStatus ? 'pending' : 'submitted';

    const { error } = await supabase
      .from('submissions')
      .upsert({
        announcement_id: assignmentId,
        user_id: user.id,
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
  };

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
          <Button variant="ghost" size="icon" className="rounded-full">
            <Filter className="h-5 w-5" />
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
                未提出 ({pendingAssignments.length})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                完了 ({completedAssignments.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100vh-160px)]">
            <TabsContent value="pending" className="p-4 space-y-3 m-0">
              {pendingAssignments.map((assignment) => (
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
              ))}
            </TabsContent>

            <TabsContent value="completed" className="p-4 space-y-3 m-0">
              {completedAssignments.map((assignment) => (
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
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
