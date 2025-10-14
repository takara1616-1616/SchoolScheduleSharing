import { Edit, Plus, Check, List, Calendar, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Tables } from "../types/supabase";
import { SUBJECT_COLORS } from "../constants/colors";
import { toast } from "sonner";
import { AddAssignmentModal } from "./AddAssignmentModal";
import { EditAssignmentModal } from "./EditAssignmentModal";
import { AddTestRangeModal } from "./AddTestRangeModal";
import { EditTestRangeModal } from "./EditTestRangeModal";
import { NotificationBadge } from "./NotificationBadge";
import { useNotifications } from "../hooks/useNotifications";

// 仮の型定義 (FigmaのモックデータとSupabaseのER図を統合)
interface AssignmentItem {
  id: number;
  subject: string;
  subjectColor: string;
  title: string;
  teacher?: string;
  description: string;
  deadline: string;
  isUrgent?: boolean;
  isCompleted: boolean;
  submission_method: string;
}

interface TestItem {
  id: number;
  subject: string;
  subjectColor: string;
  title: string;
  description: string;
  deadline: string;
  isCompleted: boolean;
}

export function HomeScreen() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditSelectModalOpen, setIsEditSelectModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
  const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
  const [isEditTestSelectModalOpen, setIsEditTestSelectModalOpen] = useState(false);
  const [isEditTestModalOpen, setIsEditTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestItem | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Fetch notification count
  const { totalCount: notificationCount } = useNotifications(userId);

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][today.getDay()];

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      const id = await getUserIdByEmail(user.email);
      setUserId(id);
    };
    initUser();
    fetchAnnouncements();
  }, [navigate]);

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

  const fetchAnnouncements = async () => {
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
      // ANNOUNCEMENTS, SUBJECTS, SUBSUBJECTS, USERS を結合してデータを取得
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          description,
          type,
          due_date,
          submission_method,
          subjects ( name ),
          subsubjects ( name ),
          users!announcements_created_by_fkey ( name )
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const fetchedAssignments: AssignmentItem[] = [];
      const fetchedTests: TestItem[] = [];

      const now = new Date();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(now.getDate() + 3);

      for (const announcement of data as any[]) {
        const subjectName = (Array.isArray(announcement.subjects) ? announcement.subjects[0]?.name : announcement.subjects?.name) || "";
        const subsubjectName = (Array.isArray(announcement.subsubjects) ? announcement.subsubjects[0]?.name : announcement.subsubjects?.name) || "";
        const teacherName = (Array.isArray(announcement.users) ? announcement.users[0]?.name : announcement.users?.name) || "";
        const displaySubject = subsubjectName ? `${subjectName} (${subsubjectName})` : subjectName;
        const subjectColor = SUBJECT_COLORS[subjectName] || "#7B9FE8"; // 定義された色、またはデフォルト

        let isUrgent = false;
        let deadlineFormatted = "";

        if (announcement.due_date) {
          const dueDate = new Date(announcement.due_date);
          deadlineFormatted = dueDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).replace(/\(.*?\)/g, '($&)');
          if (dueDate > now && dueDate <= threeDaysLater) {
            isUrgent = true;
          }
        }

        if (announcement.type === 'assignment') {
          // SUBMISSIONSテーブルから現在のユーザーの提出状況を取得（numeric user_idを使用）
          const { data: submissionData, error: submissionError } = await supabase
            .from('submissions')
            .select('status')
            .eq('announcement_id', announcement.id)
            .eq('user_id', userId)
            .single();

          if (submissionError && submissionError.code !== 'PGRST116') { // PGRST116はデータがない場合
            console.error("Error fetching submission:", submissionError);
          }

          fetchedAssignments.push({
            id: announcement.id,
            subject: displaySubject,
            subjectColor: subjectColor,
            title: announcement.title,
            teacher: teacherName,
            description: announcement.description,
            deadline: deadlineFormatted,
            isUrgent: isUrgent,
            isCompleted: submissionData?.status === 'submitted', // statusが'submitted'なら完了
            submission_method: announcement.submission_method,
          });
        } else if (announcement.type === 'test') {
          fetchedTests.push({
            id: announcement.id,
            subject: displaySubject,
            subjectColor: subjectColor,
            title: announcement.title,
            description: announcement.description,
            deadline: deadlineFormatted,
            isCompleted: false, // テストの完了状態は別途考慮
          });
        }
      }

      setAssignments(fetchedAssignments);
      setTests(fetchedTests);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      alert("ログアウト中にエラーが発生しました。");
    } else {
      navigate('/');
    }
  };

  const handleAddAssignment = async (assignment: any) => {
    try {
      const userId = await getUserIdByEmail((await supabase.auth.getUser()).data.user?.email);
      if (!userId) {
        toast.error("ユーザー情報の取得に失敗しました");
        return;
      }

      // Parse date string to ISO format
      const dateMatch = assignment.deadline.match(/(\d+)月(\d+)日/);
      let dueDate = null;
      if (dateMatch) {
        const month = parseInt(dateMatch[1]);
        const day = parseInt(dateMatch[2]);
        const year = new Date().getFullYear();
        dueDate = new Date(year, month - 1, day).toISOString();
      }

      // Find subject and subsubject IDs
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', assignment.subject)
        .maybeSingle();

      const { data: subsubjectData } = await supabase
        .from('subsubjects')
        .select('id')
        .eq('name', assignment.course || '')
        .maybeSingle();

      // Insert announcement
      const { error } = await supabase
        .from('announcements')
        .insert({
          subject_id: subjectData?.id || null,
          subsubject_id: subsubjectData?.id || null,
          created_by: userId,
          title: assignment.content || 'タイトルなし',
          description: assignment.content || '',
          type: 'assignment',
          due_date: dueDate,
          submission_method: assignment.submitTo || '',
        });

      if (error) throw error;

      await fetchAnnouncements();
      toast.success("提出物を追加しました");
    } catch (error) {
      console.error('Error adding assignment:', error);
      toast.error("提出物の追加に失敗しました");
    }
  };

  const handleSelectAssignmentToEdit = (assignment: AssignmentItem) => {
    setEditingAssignment(assignment);
    setIsEditModalOpen(true);
  };

  const handleUpdateAssignment = async (assignment: any) => {
    try {
      if (!editingAssignment) return;

      // Parse date string to ISO format
      const dateMatch = assignment.deadline.match(/(\d+)月(\d+)日/);
      let dueDate = null;
      if (dateMatch) {
        const month = parseInt(dateMatch[1]);
        const day = parseInt(dateMatch[2]);
        const year = new Date().getFullYear();
        dueDate = new Date(year, month - 1, day).toISOString();
      }

      const { error } = await supabase
        .from('announcements')
        .update({
          title: assignment.content || 'タイトルなし',
          description: assignment.content || '',
          due_date: dueDate,
          submission_method: assignment.submitTo || '',
        })
        .eq('id', editingAssignment.id);

      if (error) throw error;

      await fetchAnnouncements();
      toast.success("提出物を更新しました");
      setIsEditModalOpen(false);
      setEditingAssignment(null);
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error("提出物の更新に失敗しました");
    }
  };

  const handleToggleAssignment = async (id: number, currentStatus: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Get numeric user_id by email
      const userId = await getUserIdByEmail(user.email);
      if (!userId) {
        toast.error("ユーザー情報の取得に失敗しました");
        return;
      }

      const newStatus = currentStatus ? 'pending' : 'submitted';

      // SUBMISSIONSテーブルを更新または挿入（numeric user_idを使用）
      const { error } = await supabase
        .from('submissions')
        .upsert({
          announcement_id: id,
          user_id: userId,
          status: newStatus,
          submitted_at: newStatus === 'submitted' ? new Date().toISOString() : null,
          submission_method: 'unknown', // 仮の値
        }, { onConflict: 'announcement_id,user_id' });

      if (error) {
        console.error("Error updating submission status:", error);
        toast.error("提出状況の更新中にエラーが発生しました");
      } else {
        setAssignments((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isCompleted: !currentStatus } : item))
        );
        toast.success("提出状況を更新しました");
      }
    } catch (err: any) {
      console.error("Error in handleToggleAssignment:", err);
      toast.error("提出状況の更新中にエラーが発生しました");
    }
  };

  const handleToggleTest = (id: number, currentStatus: boolean) => {
    // テストの完了状態は現在UIに表示されていないため、ここでは何もしない
    // 必要であればSUBMISSIONSテーブルにテストの完了状態を記録するロジックを追加
    console.log(`Test ${id} toggle status: ${!currentStatus}`);
  };

  const handleAddTest = async (testRange: any) => {
    try {
      const userId = await getUserIdByEmail((await supabase.auth.getUser()).data.user?.email);
      if (!userId) {
        toast.error("ユーザー情報の取得に失敗しました");
        return;
      }

      // Parse date string to ISO format
      const dateMatch = testRange.testDate.match(/(\d+)月(\d+)日/);
      let testDate = null;
      if (dateMatch) {
        const month = parseInt(dateMatch[1]);
        const day = parseInt(dateMatch[2]);
        const year = new Date().getFullYear();
        testDate = new Date(year, month - 1, day).toISOString();
      }

      // Find subject and subsubject IDs
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', testRange.subject)
        .maybeSingle();

      const { data: subsubjectData } = await supabase
        .from('subsubjects')
        .select('id')
        .eq('name', testRange.course || '')
        .maybeSingle();

      // Insert announcement
      const { error } = await supabase
        .from('announcements')
        .insert({
          subject_id: subjectData?.id || null,
          subsubject_id: subsubjectData?.id || null,
          created_by: userId,
          title: testRange.content || 'タイトルなし',
          description: testRange.content || '',
          type: 'test',
          due_date: testDate,
          submission_method: '',
        });

      if (error) throw error;

      await fetchAnnouncements();
      toast.success("テスト範囲を追加しました");
    } catch (error) {
      console.error('Error adding test:', error);
      toast.error("テスト範囲の追加に失敗しました");
    }
  };

  const handleSelectTestToEdit = (test: TestItem) => {
    setEditingTest(test);
    setIsEditTestModalOpen(true);
  };

  const handleUpdateTest = async (testRange: any) => {
    try {
      if (!editingTest) return;

      // Parse date string to ISO format
      const dateMatch = testRange.testDate.match(/(\d+)月(\d+)日/);
      let testDate = null;
      if (dateMatch) {
        const month = parseInt(dateMatch[1]);
        const day = parseInt(dateMatch[2]);
        const year = new Date().getFullYear();
        testDate = new Date(year, month - 1, day).toISOString();
      }

      const { error } = await supabase
        .from('announcements')
        .update({
          title: testRange.content || 'タイトルなし',
          description: testRange.content || '',
          due_date: testDate,
        })
        .eq('id', editingTest.id);

      if (error) throw error;

      await fetchAnnouncements();
      toast.success("テスト範囲を更新しました");
      setIsEditTestModalOpen(false);
      setEditingTest(null);
    } catch (error) {
      console.error('Error updating test:', error);
      toast.error("テスト範囲の更新に失敗しました");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">エラー: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 sticky top-0 z-10">
      <div className="flex items-center justify-center max-w-4xl mx-auto">
        <div className="text-center">
        <h1 className="text-xl text-[#7B9FE8]" style={{ fontWeight: 600 }}>
          お知らせ一覧
        </h1>
        <p className="text-xs text-muted-foreground">
          {dateStr}({dayOfWeek})
        </p>
        </div>
      </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
      <div className="w-full max-w-full px-4 py-4 space-y-6 overflow-x-hidden">
        {/* Assignments Section */}
        <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg" style={{ fontWeight: 600 }}>各教科の提出物</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={() => navigate('/assignments')}
          >
            すべて見る
          </Button>
        </div>

        <div className="space-y-3">
          {assignments.length === 0 ? (
          <p className="text-muted-foreground text-center">提出物はありません。</p>
          ) : (
          assignments.map((assignment) => (
            <div
            key={assignment.id}
            className={`rounded-2xl p-4 shadow-sm w-full max-w-full cursor-pointer hover:shadow-md transition-shadow ${
              assignment.isUrgent
              ? "border-2 border-destructive bg-red-50"
              : "border border-border bg-white"
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
              {/* Top: Deadline (Most Prominent) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg text-foreground shrink-0" style={{ fontWeight: 600 }}>
                  {assignment.deadline}
                </span>
                {assignment.isUrgent && (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5 rounded-full shrink-0">
                  締切間近
                  </Badge>
                )}
                </div>
              </div>

              {/* Middle: Subject, Course Name, Teacher */}
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span
                className="text-sm px-2.5 py-1 rounded-lg text-white whitespace-nowrap shrink-0"
                style={{ backgroundColor: assignment.subjectColor, fontWeight: 500 }}
                >
                {assignment.subject}
                </span>
                <span className="text-base break-words" style={{ fontWeight: 500 }}>
                {assignment.title}
                </span>
                {assignment.teacher && (
                <span className="text-base text-muted-foreground whitespace-nowrap">
                  {assignment.teacher}
                </span>
                )}
              </div>

              {/* Content: Description */}
              {assignment.description && (
                <p className="text-base text-foreground break-words" style={{ fontWeight: 500 }}>
                {assignment.description}
                </p>
              )}

              {/* Bottom: Submit Method */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="whitespace-nowrap">📤 {assignment.submission_method}</span>
              </div>
              </div>

              {/* Right: Checkbox */}
              <button
              onClick={() => handleToggleAssignment(assignment.id, assignment.isCompleted)}
              className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 self-start transition-colors ${
                assignment.isCompleted
                ? "bg-green-500 border-green-500"
                : "bg-white border-muted-foreground/30 hover:border-primary"
              }`}
              >
              {assignment.isCompleted && (
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              )}
              </button>
            </div>
            </div>
          ))
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button 
          variant="outline" 
          size="sm" 
          className="rounded-xl"
          onClick={() => setIsAddModalOpen(true)}
          >
          <Plus className="h-4 w-4 mr-1" />
          追加
          </Button>
          <Button 
          variant="outline" 
          size="sm" 
          className="rounded-xl"
          onClick={() => setIsEditSelectModalOpen(true)}
          >
          <Edit className="h-4 w-4 mr-1" />
          編集
          </Button>
        </div>
        </div>

        {/* Test Range Section */}
        <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg" style={{ fontWeight: 600 }}>テスト範囲</h2>
        </div>

        <div className="space-y-3">
          {tests.length === 0 ? (
          <p className="text-muted-foreground text-center">テスト範囲はありません。</p>
          ) : (
          tests.map((test) => (
            <div
            key={test.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-border w-full max-w-full"
            >
            <div className="flex gap-3 w-full max-w-full min-w-0">
              {/* Left Color Bar */}
              <div
              className="w-1 rounded-full shrink-0"
              style={{ backgroundColor: test.subjectColor }}
              ></div>

              {/* Card Content */}
              <div className="flex-1 min-w-0 space-y-2.5">
              {/* Top: Test Date (Most Prominent) */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg text-foreground shrink-0" style={{ fontWeight: 600 }}>
                試験日: {test.deadline}
                </span>
              </div>

              {/* Middle: Subject & Title */}
              <div className="flex items-start gap-2 min-w-0">
                <span
                className="text-sm px-2.5 py-1 rounded-lg text-white whitespace-nowrap shrink-0"
                style={{ backgroundColor: test.subjectColor, fontWeight: 500 }}
                >
                {test.subject}
                </span>
                <div className="flex-1 min-w-0">
                <p className="text-base break-words" style={{ fontWeight: 500 }}>
                  {test.title}
                </p>
                {test.description && (
                  <p className="text-base text-foreground mt-1 break-words whitespace-pre-line" style={{ fontWeight: 500 }}>
                  {test.description}
                  </p>
                )}
                </div>
              </div>
              </div>
            </div>
            </div>
          ))
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button 
          variant="outline" 
          size="sm" 
          className="rounded-xl"
          onClick={() => setIsAddTestModalOpen(true)}
          >
          <Plus className="h-4 w-4 mr-1" />
          追加
          </Button>
          <Button 
          variant="outline" 
          size="sm" 
          className="rounded-xl"
          onClick={() => setIsEditTestSelectModalOpen(true)}
          >
          <Edit className="h-4 w-4 mr-1" />
          編集
          </Button>
        </div>
        </div>
      </div>
      </ScrollArea>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border">
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className="grid grid-cols-4 gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-col h-auto py-2 gap-1"
        >
          <List className="h-5 w-5 text-primary" />
          <span className="text-xs text-primary">お知らせ</span>
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
        <Button
          onClick={() => navigate("/notifications")}
          variant="ghost"
          size="sm"
          className="flex-col h-auto py-2 gap-1"
        >
          <NotificationBadge count={notificationCount} />
          <span className="text-xs text-muted-foreground">通知</span>
        </Button>
        <Button
          onClick={() => navigate("/history")}
          variant="ghost"
          size="sm"
          className="flex-col h-auto py-2 gap-1"
        >
          <FileCheck className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">履歴</span>
        </Button>
        </div>
      </div>
      </div>

      {/* Modals */}
      <AddAssignmentModal
      open={isAddModalOpen}
      onClose={() => setIsAddModalOpen(false)}
      onSave={handleAddAssignment}
      />

      <EditAssignmentModal
      open={isEditSelectModalOpen}
      onClose={() => setIsEditSelectModalOpen(false)}
      assignments={assignments}
      onSelectAssignment={handleSelectAssignmentToEdit}
      />

      <AddAssignmentModal
      open={isEditModalOpen}
      onClose={() => {
        setIsEditModalOpen(false);
        setEditingAssignment(null);
      }}
      onSave={handleUpdateAssignment}
      editingAssignment={editingAssignment ? {
        subject: editingAssignment.subject,
        subsubject: "",
        title: editingAssignment.title,
        teacher: editingAssignment.teacher || "",
        description: editingAssignment.description,
        submission_method: editingAssignment.submission_method,
        dueDate: editingAssignment.deadline,
      } : undefined}
      />

      <AddTestRangeModal
      open={isAddTestModalOpen}
      onClose={() => setIsAddTestModalOpen(false)}
      onSave={handleAddTest}
      />

      <EditTestRangeModal
      open={isEditTestSelectModalOpen}
      onClose={() => setIsEditTestSelectModalOpen(false)}
      tests={tests}
      onSelectTest={handleSelectTestToEdit}
      />

      <AddTestRangeModal
      open={isEditTestModalOpen}
      onClose={() => {
        setIsEditTestModalOpen(false);
        setEditingTest(null);
      }}
      onSave={handleUpdateTest}
      initialData={
        editingTest
        ? {
          subject: editingTest.subject,
          subsubject: "",
          title: editingTest.title,
          description: editingTest.description,
          testDate: editingTest.deadline,
          }
        : undefined
      }
      />
    </div>
  );
}