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
import { AddGeneralNoticeModal } from "./AddGeneralNoticeModal";
import { EditGeneralNoticeModal } from "./EditGeneralNoticeModal";

// 仮の型定義 (FigmaのモックデータとSupabaseのER図を統合)
interface AssignmentItem {
  id: number;
  subject: string;
  subjectColor: string;
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
  description: string;
  deadline: string;
  isCompleted: boolean;
}

// 一般的なお知らせの型定義
interface GeneralNoticeItem {
  id: number;
  subject: string;
  subjectColor: string;
  title: string;
  description: string;
  date: string; // 期限ではなく、通知日として扱う
}

// 💡 注意: この関数は、subject名からIDを取得するなど、実際のアプリではより複雑になります。
// 現状、Add/Editモーダルのデータ構造がIDではなく名前ベースのため、一旦 subject_id=1 を仮定します。
const getSubjectIdByName = (subjectName: string): number | null => {
    // 💡 実際のアプリでは、ここで subjectName から Supabase の subject_id を検索します。
    // 現状、「その他のお知らせ」には、仮のID '1' または null を設定する必要があります。
    if (subjectName === "連絡事項" || subjectName.includes("その他")) {
        return 1; // 💡 仮のデフォルト subject_id
    }
    // TODO: 他の教科名（例: 数学、国語）から対応するIDを返すロジックを追加
    return 1; // 💡 暫定的に全ての登録に仮のID 1 を使用
};


export function HomeScreen() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [generalNotices, setGeneralNotices] = useState<GeneralNoticeItem[]>([]); 
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

  const [isAddGeneralNoticeModalOpen, setIsAddGeneralNoticeModalOpen] = useState(false);
  const [isEditGeneralNoticeSelectModalOpen, setIsEditGeneralNoticeSelectModalOpen] = useState(false);
  const [editingGeneralNotice, setEditingGeneralNotice] = useState<GeneralNoticeItem | null>(null);

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
          created_at,
          subjects ( name ),
          subsubjects ( name ),
          users!announcements_created_by_fkey ( name )
        `)
        .order('due_date', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const fetchedAssignments: AssignmentItem[] = [];
      const fetchedTests: TestItem[] = [];
      const fetchedGeneralNotices: GeneralNoticeItem[] = [];

      const now = new Date();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(now.getDate() + 3);

      for (const announcement of data as any[]) {
        const subjectName = (Array.isArray(announcement.subjects) ? announcement.subjects[0]?.name : announcement.subjects?.name) || "";
        const subsubjectName = (Array.isArray(announcement.subsubjects) ? announcement.subsubjects[0]?.name : announcement.subsubjects?.name) || "";
        const teacherName = (Array.isArray(announcement.users) ? announcement.users[0]?.name : announcement.users?.name) || "";
        
        const displaySubject = subsubjectName ? `${subjectName} (${subsubjectName})` : (announcement.type === 'general_notice' ? "連絡事項" : subjectName);
        const subjectColor = SUBJECT_COLORS[subjectName] || (announcement.type === 'general_notice' ? "#7B9FE8" : "#7B9FE8"); 

        let isUrgent = false;
        let deadlineFormatted = "";
        let dateFormatted = "";

        if (announcement.due_date) {
          const dueDate = new Date(announcement.due_date);
          deadlineFormatted = dueDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).replace(/\(.*?\)/g, '($&)');
          if (dueDate > now && dueDate <= threeDaysLater) {
            isUrgent = true;
          }
        }
        
        if (announcement.created_at) { 
          const createdDate = new Date(announcement.created_at);
          dateFormatted = createdDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).replace(/\(.*?\)/g, '($&)');
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
            description: announcement.description,
            deadline: deadlineFormatted,
            isCompleted: false, // テストの完了状態は別途考慮
          });
        } else if (announcement.type === 'general_notice') {
           fetchedGeneralNotices.push({
             id: announcement.id,
             subject: displaySubject,
             subjectColor: subjectColor,
             title: announcement.title || "", 
             description: announcement.description,
             date: dateFormatted,
           });
        }
      }

      setAssignments(fetchedAssignments);
      setTests(fetchedTests);
      setGeneralNotices(fetchedGeneralNotices);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // ログアウト処理
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      alert("ログアウト中にエラーが発生しました。");
    } else {
      navigate('/');
    }
  };

  // 課題追加処理
  const handleAddAssignment = async (assignment: { subject: string; subsubject: string; teacher: string; description: string; submission_method: string; dueDate: string }) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        toast.error("ユーザーが認証されていません。");
        setLoading(false);
        return;
    }

    // 課題登録ロジック
    const subjectId = getSubjectIdByName(assignment.subject);

    const { error } = await supabase
        .from('announcements')
        .insert({
            title: null, // titleはnullで保存
            description: assignment.description,
            type: 'assignment',
            due_date: assignment.dueDate,
            submission_method: assignment.submission_method,
            subject_id: subjectId,
            created_by: user.id,
        });

    if (error) {
        console.error("Error adding assignment:", error);
        toast.error("提出物の登録中にエラーが発生しました。");
    } else {
        toast.success("提出物を追加しました");
        setIsAddModalOpen(false);
        await fetchAnnouncements();
    }
    setLoading(false);
  };

  const handleSelectAssignmentToEdit = (assignment: AssignmentItem) => {
    setEditingAssignment(assignment);
    setIsEditModalOpen(true);
  };

  const handleUpdateAssignment = async (assignment: { subject: string; subsubject: string; teacher: string; description: string; submission_method: string; dueDate: string }) => {
    // 💡 編集ロジックの実装が必要です。ここでは一旦再取得とトースト表示のみ
    await fetchAnnouncements();
    toast.success("提出物を更新しました");
    setIsEditModalOpen(false);
    setEditingAssignment(null);
  };

  // 📌 修正: 提出完了トグル処理 (データベース連携)
  const handleToggleAssignment = async (id: number, currentStatus: boolean, subjectTitle: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error("ユーザーが認証されていません。");
        return;
    }

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
          submission_method: 'unknown', // 提出方法を追跡する場合
        }, { onConflict: 'announcement_id,user_id' });

      if (error) {
        console.error("Error updating submission status:", error);
        toast.error("提出状況の更新中にエラーが発生しました。");
      } else {
        // フロントエンドのStateを更新
        setAssignments((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isCompleted: !currentStatus } : item))
        );

        // Figmaのデザインに合わせたトースト通知
        if (!currentStatus) { // 未提出 -> 提出済みに変更したとき
            toast.success("提出完了　よくできました👏", {
              description: subjectTitle,
            });
        } else { // 提出済み -> 未提出に戻したとき
            toast.info("未提出に変更", {
              description: subjectTitle,
            });
        }
      }
    } catch (err: any) {
      console.error("Error in handleToggleAssignment:", err);
      toast.error("提出状況の更新中にエラーが発生しました");
    }
  };

  const handleToggleTest = (id: number, currentStatus: boolean) => {
    console.log(`Test ${id} toggle status: ${!currentStatus}`);
  };

  // テスト範囲追加処理
  const handleAddTest = async (testRange: { subject: string; subsubject: string; title: string; description: string; testDate: string }) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        toast.error("ユーザーが認証されていません。");
        setLoading(false);
        return;
    }

    // テスト範囲登録ロジック
    const subjectId = getSubjectIdByName(testRange.subject);

    const { error } = await supabase
        .from('announcements')
        .insert({
            title: testRange.title,
            description: testRange.description,
            type: 'test',
            due_date: testRange.testDate,
            submission_method: 'none',
            subject_id: subjectId,
            created_by: user.id,
        });

    if (error) {
        console.error("Error adding test range:", error);
        toast.error("テスト範囲の登録中にエラーが発生しました。");
    } else {
        toast.success("テスト範囲を追加しました");
        setIsAddTestModalOpen(false);
        await fetchAnnouncements();
    }
    setLoading(false);
  };

  const handleSelectTestToEdit = (test: TestItem) => {
    setEditingTest(test);
    setIsEditTestModalOpen(true);
  };

  const handleUpdateTest = async (testRange: { subject: string; subsubject: string; title: string; description: string; testDate: string }) => {
    // 💡 編集ロジックの実装が必要です。ここでは一旦再取得とトースト表示のみ
    await fetchAnnouncements();
    toast.success("テスト範囲を更新しました");
    setIsEditTestModalOpen(false);
    setEditingTest(null);
  };
  
  // その他のお知らせの追加処理（Supabaseに保存する）
  const handleAddGeneralNotice = async ({ title, description, date }: { title: string; description: string; date: Date | undefined }) => {
    if (!date) {
        toast.error("日付が選択されていません。");
        return;
    }
    
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Supabaseへのデータ登録処理
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: title, 
          description: description,
          type: 'general_notice',
          created_by: user.id, 
          due_date: date.toISOString(), 
          submission_method: 'none',
          subject_id: 1, // 仮の subject_id=1 を追加
        });
      
      if (error) {
        console.error("Error adding general notice:", error);
        toast.error("お知らせの登録に失敗しました。");
      } else {
        toast.success("お知らせを登録しました");
        setIsAddGeneralNoticeModalOpen(false);
        await fetchAnnouncements();
      }
    }
    setLoading(false);
  };
  
  // 編集対象選択モーダルで項目が選択されたときの処理
  const handleSelectGeneralNoticeToEdit = (notice: GeneralNoticeItem) => {
      // 💡 編集対象をStateにセットし、追加モーダルを編集モードで開くロジックが必要
      console.log("Edit general notice selected:", notice);
      // setEditingGeneralNotice(notice);
      // setIsAddGeneralNoticeModalOpen(true);
      setIsEditGeneralNoticeSelectModalOpen(false); // 選択モーダルを閉じる
  };
  
  // その他のお知らせの編集処理（ダミー）
  const handleEditGeneralNotice = async () => {
    toast.info("その他のお知らせの編集処理が実行されました");
    setIsEditGeneralNoticeSelectModalOpen(false);
    await fetchAnnouncements();
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
                {assignment.description}
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
              // 📌 修正: onClickでhandleToggleAssignmentを呼び出し、必要なデータを渡す
              onClick={(e) => {
                e.stopPropagation(); // 親要素のクリックイベント (navigate) を停止
                handleToggleAssignment(assignment.id, assignment.isCompleted, `${assignment.subject} ${assignment.description}`);
              }}
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

        {/* ------------------------------------------------------------------------------------------------------------------------------------------------ */}

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
                {test.description && (
                  <p className="text-base text-foreground break-words whitespace-pre-line" style={{ fontWeight: 500 }}>
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

        {/* ------------------------------------------------------------------------------------------------------------------------------------------------ */}
        
        {/* その他のお知らせ Section */}
        <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg" style={{ fontWeight: 600 }}>その他のお知らせ</h2>
        </div>

        <div className="space-y-3">
          {generalNotices.length === 0 ? (
          <p className="text-muted-foreground text-center">お知らせはありません。</p>
          ) : (
          generalNotices.map((notice) => (
            <div
            key={notice.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-border w-full max-w-full cursor-pointer hover:shadow-md transition-shadow"
            // onClick={() => navigate(`/general-notice/${notice.id}`)} // 詳細ページへのナビゲーションを想定
            >
            <div className="flex gap-3 w-full max-w-full min-w-0">
              {/* Left Color Bar */}
              <div
              className="w-1 rounded-full shrink-0"
              style={{ backgroundColor: notice.subjectColor }}
              ></div>

              {/* Card Content */}
              <div className="flex-1 min-w-0 space-y-2.5">
              {/* Top: Date (Most Prominent) */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-muted-foreground shrink-0" style={{ fontWeight: 500 }}>
                {notice.date}
                </span>
              </div>

              {/* Middle: Subject & Title */}
              <div className="flex items-start gap-2 min-w-0">
                <span
                className="text-sm px-2.5 py-1 rounded-lg text-white whitespace-nowrap shrink-0"
                style={{ backgroundColor: notice.subjectColor, fontWeight: 500 }}
                >
                {notice.subject}
                </span>
                <div className="flex-1 min-w-0">
                <p className="text-base break-words" style={{ fontWeight: 600 }}>
                  {notice.title}
                </p>
                {notice.description && (
                  <p className="text-sm text-foreground mt-1 break-words whitespace-pre-line">
                  {notice.description}
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
        
        {/* その他のお知らせの追加/編集ボタン */}
        <div className="flex justify-end gap-2">
          <Button 
          variant="outline" 
          size="sm" 
          className="rounded-xl"
          onClick={() => setIsAddGeneralNoticeModalOpen(true)}
          >
          <Plus className="h-4 w-4 mr-1" />
          追加
          </Button>
          <Button 
          variant="outline" 
          size="sm" 
          className="rounded-xl"
          onClick={() => setIsEditGeneralNoticeSelectModalOpen(true)}
          >
          <Edit className="h-4 w-4 mr-1" />
          編集
          </Button>
        </div>
        </div>

        {/* ------------------------------------------------------------------------------------------------------------------------------------------------ */}
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
      assignments={assignments.map((a) => ({
        id: a.id,
        subject: a.subject,
        subjectColor: a.subjectColor,
        teacher: a.teacher,
        description: a.description,
        deadline: a.deadline,
        isUrgent: a.isUrgent,
        isCompleted: a.isCompleted,
        submission_method: a.submission_method,
      }))}
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
      tests={tests.map((t) => ({
        id: t.id,
        subject: t.subject,
        subjectColor: t.subjectColor,
        description: t.description,
        deadline: t.deadline,
        isCompleted: t.isCompleted,
      }))}
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
          title: editingTest.description,
          description: editingTest.description,
          testDate: editingTest.deadline,
          }
        : undefined
      }
      />
      
      {/* 📌 その他のお知らせの追加/編集モーダル */}
      <AddGeneralNoticeModal 
        open={isAddGeneralNoticeModalOpen}
        onClose={() => {
            setIsAddGeneralNoticeModalOpen(false);
            setEditingGeneralNotice(null);
        }}
        onSave={handleAddGeneralNotice}
        // initialData={editingGeneralNotice || undefined} // AddGeneralNoticeModalの実装に依存
      />
      
      {/* 📌 その他のお知らせの編集対象選択モーダル */}
      {isEditGeneralNoticeSelectModalOpen && (
        <EditGeneralNoticeModal 
            open={isEditGeneralNoticeSelectModalOpen}
            onClose={() => setIsEditGeneralNoticeSelectModalOpen(false)}
            notices={generalNotices}
            onSelectNotice={handleSelectGeneralNoticeToEdit}
        />
      )}
      
    </div>
  );
}