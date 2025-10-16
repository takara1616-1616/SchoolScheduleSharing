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
import { useReminderNotifications } from "../hooks/useReminderNotifications";
import { AddGeneralNoticeModal } from "./AddGeneralNoticeModal";
import { EditGeneralNoticeModal } from "./EditGeneralNoticeModal";

// 仮の型定義 (FigmaのモックデータとSupabaseのER図を統合)
interface AssignmentItem {
  id: number;
  subject: string;  // 表示用: "数学 (数学I)"
  subjectColor: string;
  teacher?: string;
  description: string;
  deadline: string;  // 表示用: "1月15日(水)"
  isUrgent?: boolean;
  isOverdue?: boolean;  // 期限超過フラグ
  isCompleted: boolean;
  submission_method: string;
  // 編集用の元データ
  rawSubjectName: string;  // 元の教科名: "数学"
  rawSubsubjectName: string;  // 元の科目名: "数学I"
  rawDueDate: string;  // ISO形式の日付
}

interface TestItem {
  id: number;
  subject: string;  // 表示用: "数学 (数学I)"
  subjectColor: string;
  description: string;
  deadline: string;  // 表示用: "1月15日(水)"
  isCompleted: boolean;
  // 編集用の元データ
  rawSubjectName: string;  // 元の教科名: "数学"
  rawSubsubjectName: string;  // 元の科目名: "数学I"
  rawDueDate: string;  // ISO形式の日付
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

  // Enable reminder notifications
  useReminderNotifications(userId);

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
      // ANNOUNCEMENTS, SUBJECTS, SUBSUBJECTS を結合してデータを取得
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
          teacher_name,
          subjects ( name ),
          subsubjects ( name, subjects ( name ) )
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
        // 教科名を取得（announcements.subject_id または subsubjects経由）
        let subjectName = (Array.isArray(announcement.subjects) ? announcement.subjects[0]?.name : announcement.subjects?.name) || "";
        const subsubjectName = (Array.isArray(announcement.subsubjects) ? announcement.subsubjects[0]?.name : announcement.subsubjects?.name) || "";

        // subjectNameが空で、subsubjectに親のsubjectがある場合はそちらを使用
        if (!subjectName && announcement.subsubjects) {
          const subsubjectData = Array.isArray(announcement.subsubjects) ? announcement.subsubjects[0] : announcement.subsubjects;
          subjectName = subsubjectData?.subjects?.name || "";
        }

        const teacherName = announcement.teacher_name || "";

        const displaySubject = subsubjectName ? `${subjectName} (${subsubjectName})` : (announcement.type === 'general_notice' ? "連絡事項" : subjectName);

        // デバッグ: 教科名と色のマッピングを確認
        console.log("Subject mapping:", {
          subjectName,
          hasColor: !!SUBJECT_COLORS[subjectName],
          color: SUBJECT_COLORS[subjectName],
          type: announcement.type
        });

        const subjectColor = announcement.type === 'general_notice'
          ? "#7B9FE8"
          : (SUBJECT_COLORS[subjectName] || SUBJECT_COLORS["その他"] || "#7B9FE8"); 

        let isUrgent = false;
        let isOverdue = false;
        let deadlineFormatted = "";
        let dateFormatted = "";

        if (announcement.due_date) {
          // ISO形式の日付をローカル時刻として解釈（タイムゾーンのずれを防ぐ）
          const dateStr = announcement.due_date.split('T')[0]; // "2025-01-15"
          const [year, month, day] = dateStr.split('-').map(Number);
          const dueDate = new Date(year, month - 1, day);
          deadlineFormatted = dueDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });

          // 今日の日付（時刻を0時に設定して日付のみで比較）
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

          // 期限が過ぎているか、3日以内の場合に強調表示
          if (dueDateOnly < today) {
            // 締切日を過ぎている（昨日以前）
            isUrgent = true;
            isOverdue = true;
          } else if (dueDateOnly <= threeDaysLater) {
            // 締切日当日または3日以内
            isUrgent = true;
          }
        }

        // その他のお知らせの日付もdue_dateから取得（created_atではない）
        if (announcement.type === 'general_notice' && announcement.due_date) {
          const dateStr = announcement.due_date.split('T')[0];
          const [year, month, day] = dateStr.split('-').map(Number);
          const noticeDate = new Date(year, month - 1, day);
          dateFormatted = noticeDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
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
            isOverdue: isOverdue,
            isCompleted: submissionData?.status === 'submitted', // statusが'submitted'なら完了
            submission_method: announcement.submission_method,
            // 編集用の元データ
            rawSubjectName: subjectName,
            rawSubsubjectName: subsubjectName,
            rawDueDate: announcement.due_date,
          });
        } else if (announcement.type === 'test') {
          fetchedTests.push({
            id: announcement.id,
            subject: displaySubject,
            subjectColor: subjectColor,
            description: announcement.description,
            deadline: deadlineFormatted,
            isCompleted: false, // テストの完了状態は別途考慮
            // 編集用の元データ
            rawSubjectName: subjectName,
            rawSubsubjectName: subsubjectName,
            rawDueDate: announcement.due_date,
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

    try {
      // Get numeric user_id
      const numericUserId = await getUserIdByEmail(user.email);
      if (!numericUserId) {
        toast.error("ユーザー情報の取得に失敗しました");
        setLoading(false);
        return;
      }

      // Get subject_id by name
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', assignment.subject)
        .maybeSingle();

      if (subjectError) {
        console.error("Error fetching subject:", subjectError);
        toast.error("教科の取得に失敗しました");
        setLoading(false);
        return;
      }

      // Get subsubject_id by name
      const { data: subsubjectData, error: subsubjectError } = await supabase
        .from('subsubjects')
        .select('id')
        .eq('name', assignment.subsubject)
        .maybeSingle();

      if (subsubjectError) {
        console.error("Error fetching subsubject:", subsubjectError);
        toast.error("科目の取得に失敗しました");
        setLoading(false);
        return;
      }

      // Create title from subject and subsubject
      const title = assignment.subsubject ? `${assignment.subject} (${assignment.subsubject})` : assignment.subject;

      const { error } = await supabase
          .from('announcements')
          .insert({
              title: title,
              description: assignment.description,
              type: 'assignment',
              due_date: assignment.dueDate,
              submission_method: assignment.submission_method,
              subject_id: subjectData?.id || null,
              subsubject_id: subsubjectData?.id || null,
              created_by: numericUserId,
              teacher_name: assignment.teacher || null,
          });

      if (error) {
          console.error("Error adding assignment:", error);
          toast.error("提出物の登録中にエラーが発生しました。");
      } else {
          toast.success("提出物を追加しました");
          setIsAddModalOpen(false);
          await fetchAnnouncements();
      }
    } catch (err) {
      console.error("Exception in handleAddAssignment:", err);
      toast.error("提出物の登録中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAssignmentToEdit = (assignment: AssignmentItem) => {
    setEditingAssignment(assignment);
    setIsEditModalOpen(true);
  };

  const handleUpdateAssignment = async (assignment: { subject: string; subsubject: string; teacher: string; description: string; submission_method: string; dueDate: string }) => {
    if (!editingAssignment) {
      toast.error("編集対象が選択されていません");
      return;
    }

    setLoading(true);

    try {
      // Get subject_id by name
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', assignment.subject)
        .maybeSingle();

      if (subjectError) {
        console.error("Error fetching subject:", subjectError);
        toast.error("教科の取得に失敗しました");
        setLoading(false);
        return;
      }

      // Get subsubject_id by name
      const { data: subsubjectData, error: subsubjectError } = await supabase
        .from('subsubjects')
        .select('id')
        .eq('name', assignment.subsubject)
        .maybeSingle();

      if (subsubjectError) {
        console.error("Error fetching subsubject:", subsubjectError);
        toast.error("科目の取得に失敗しました");
        setLoading(false);
        return;
      }

      // Create title from subject and subsubject
      const title = assignment.subsubject ? `${assignment.subject} (${assignment.subsubject})` : assignment.subject;

      const { error } = await supabase
        .from('announcements')
        .update({
          title: title,
          description: assignment.description,
          due_date: assignment.dueDate,
          submission_method: assignment.submission_method,
          subject_id: subjectData?.id || null,
          subsubject_id: subsubjectData?.id || null,
          teacher_name: assignment.teacher || null,
        })
        .eq('id', editingAssignment.id);

      if (error) {
        console.error("Error updating assignment:", error);
        toast.error("提出物の更新中にエラーが発生しました");
      } else {
        toast.success("提出物を更新しました");
        setIsEditModalOpen(false);
        setEditingAssignment(null);
        await fetchAnnouncements();
      }
    } catch (err) {
      console.error("Exception in handleUpdateAssignment:", err);
      toast.error("提出物の更新中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // 📌 修正: 提出完了トグル処理 (データベース連携)
  const handleToggleAssignment = async (id: number, currentStatus: boolean, subjectTitle: string) => {
    console.log("📋 handleToggleAssignment called:", { id, currentStatus, subjectTitle });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("❌ User not authenticated");
        toast.error("ユーザーが認証されていません。");
        return;
    }

    console.log("✅ User authenticated:", user.email);
    console.log("🔍 User auth object:", user);

    try {
      // Get numeric user_id by email
      const userId = await getUserIdByEmail(user.email);
      if (!userId) {
        console.error("❌ Failed to get user_id");
        toast.error("ユーザー情報の取得に失敗しました");
        return;
      }

      console.log("✅ Got userId:", userId);

      const newStatus = currentStatus ? 'pending' : 'submitted';
      console.log("🔄 Toggling status:", { currentStatus, newStatus });

      // Check if submission already exists
      const { data: existingSubmission, error: checkError } = await supabase
        .from('submissions')
        .select('id')
        .eq('announcement_id', id)
        .eq('user_id', userId)
        .maybeSingle();

      console.log("🔍 Existing submission check:", { existingSubmission, checkError });

      let error;
      if (existingSubmission) {
        console.log("📝 Updating existing submission...");
        // Update existing submission
        const result = await supabase
          .from('submissions')
          .update({
            status: newStatus,
            submitted_at: newStatus === 'submitted' ? new Date().toISOString() : null,
          })
          .eq('announcement_id', id)
          .eq('user_id', userId);
        error = result.error;
        console.log("📝 Update result:", { error, data: result.data });
      } else {
        console.log("➕ Inserting new submission...");
        // Insert new submission
        const result = await supabase
          .from('submissions')
          .insert({
            announcement_id: id,
            user_id: userId,
            status: newStatus,
            submitted_at: newStatus === 'submitted' ? new Date().toISOString() : null,
          });
        error = result.error;
        console.log("➕ Insert result:", { error, data: result.data });
      }

      if (error) {
        console.error("❌ Error updating submission status:", error);
        toast.error("提出状況の更新中にエラーが発生しました。");
      } else {
        console.log("✅ Successfully updated submission status");
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
      console.error("❌ Error in handleToggleAssignment:", err);
      toast.error("提出状況の更新中にエラーが発生しました");
    }
  };

  const handleToggleTest = (id: number, currentStatus: boolean) => {
    console.log(`Test ${id} toggle status: ${!currentStatus}`);
  };

  // テスト範囲追加処理
  const handleAddTest = async (testRange: { subject: string; subjectColor: string; course: string; content: string; testDate: string }) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        toast.error("ユーザーが認証されていません。");
        setLoading(false);
        return;
    }

    try {
      // Get numeric user_id
      const numericUserId = await getUserIdByEmail(user.email);
      if (!numericUserId) {
        toast.error("ユーザー情報の取得に失敗しました");
        setLoading(false);
        return;
      }

      // Get subject_id by name
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', testRange.subject)
        .maybeSingle();

      if (subjectError) {
        console.error("Error fetching subject:", subjectError);
        toast.error("教科の取得に失敗しました");
        setLoading(false);
        return;
      }

      // Get subsubject_id by name (course)
      const { data: subsubjectData, error: subsubjectError } = await supabase
        .from('subsubjects')
        .select('id')
        .eq('name', testRange.course)
        .maybeSingle();

      if (subsubjectError) {
        console.error("Error fetching subsubject:", subsubjectError);
        toast.error("科目の取得に失敗しました");
        setLoading(false);
        return;
      }

      // Parse date string to ISO format
      let isoDate: string;
      try {
        // testDate is in format "M月d日(E)" like "6月12日(土)"
        const dateMatch = testRange.testDate.match(/(\d+)月(\d+)日/);
        if (dateMatch) {
          const month = parseInt(dateMatch[1]);
          const day = parseInt(dateMatch[2]);
          const year = new Date().getFullYear();
          // ローカル日付をISO形式の日付文字列に変換（タイムゾーンのずれを防ぐ）
          const monthStr = String(month).padStart(2, '0');
          const dayStr = String(day).padStart(2, '0');
          isoDate = `${year}-${monthStr}-${dayStr}T00:00:00`;
        } else {
          throw new Error("Invalid date format");
        }
      } catch (err) {
        console.error("Error parsing date:", err);
        toast.error("日付の形式が正しくありません");
        setLoading(false);
        return;
      }

      // Create title from subject and course
      const title = testRange.course ? `${testRange.subject} (${testRange.course})` : testRange.subject;

      const { error } = await supabase
          .from('announcements')
          .insert({
              title: title,
              description: testRange.content,
              type: 'test',
              due_date: isoDate,
              submission_method: 'none',
              subject_id: subjectData?.id || null,
              subsubject_id: subsubjectData?.id || null,
              created_by: numericUserId,
          });

      if (error) {
          console.error("Error adding test range:", error);
          toast.error("テスト範囲の登録中にエラーが発生しました。");
      } else {
          toast.success("テスト範囲を追加しました");
          setIsAddTestModalOpen(false);
          await fetchAnnouncements();
      }
    } catch (err) {
      console.error("Exception in handleAddTest:", err);
      toast.error("テスト範囲の登録中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTestToEdit = (test: TestItem) => {
    console.log("handleSelectTestToEdit - selected test:", test);
    setEditingTest(test);
    setIsEditTestModalOpen(true);
  };

  const handleUpdateTest = async (testRange: { subject: string; subjectColor: string; course: string; content: string; testDate: string }) => {
    if (!editingTest) {
      toast.error("編集対象が選択されていません");
      return;
    }

    setLoading(true);

    try {
      // Get subject_id by name
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', testRange.subject)
        .maybeSingle();

      if (subjectError) {
        console.error("Error fetching subject:", subjectError);
        toast.error("教科の取得に失敗しました");
        setLoading(false);
        return;
      }

      // Get subsubject_id by name (course)
      const { data: subsubjectData, error: subsubjectError } = await supabase
        .from('subsubjects')
        .select('id')
        .eq('name', testRange.course)
        .maybeSingle();

      if (subsubjectError) {
        console.error("Error fetching subsubject:", subsubjectError);
        toast.error("科目の取得に失敗しました");
        setLoading(false);
        return;
      }

      // Parse date string to ISO format
      let isoDate: string;
      try {
        // testDate is in format "M月d日(E)" like "6月12日(土)"
        const dateMatch = testRange.testDate.match(/(\d+)月(\d+)日/);
        if (dateMatch) {
          const month = parseInt(dateMatch[1]);
          const day = parseInt(dateMatch[2]);
          const year = new Date().getFullYear();
          // ローカル日付をISO形式の日付文字列に変換（タイムゾーンのずれを防ぐ）
          const monthStr = String(month).padStart(2, '0');
          const dayStr = String(day).padStart(2, '0');
          isoDate = `${year}-${monthStr}-${dayStr}T00:00:00`;
        } else {
          throw new Error("Invalid date format");
        }
      } catch (err) {
        console.error("Error parsing date:", err);
        toast.error("日付の形式が正しくありません");
        setLoading(false);
        return;
      }

      // Create title from subject and course
      const title = testRange.course ? `${testRange.subject} (${testRange.course})` : testRange.subject;

      const { error } = await supabase
        .from('announcements')
        .update({
          title: title,
          description: testRange.content,
          due_date: isoDate,
          subject_id: subjectData?.id || null,
          subsubject_id: subsubjectData?.id || null,
        })
        .eq('id', editingTest.id);

      if (error) {
        console.error("Error updating test range:", error);
        toast.error("テスト範囲の更新中にエラーが発生しました");
      } else {
        toast.success("テスト範囲を更新しました");
        setIsEditTestModalOpen(false);
        setEditingTest(null);
        await fetchAnnouncements();
      }
    } catch (err) {
      console.error("Exception in handleUpdateTest:", err);
      toast.error("テスト範囲の更新中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };
  
  // その他のお知らせの追加処理（Supabaseに保存する）
  const handleAddGeneralNotice = async ({ title, description, date }: { title: string; description: string; date: Date | undefined }) => {
    if (!date) {
        toast.error("日付が選択されていません。");
        return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        toast.error("ユーザーが認証されていません。");
        setLoading(false);
        return;
    }

    try {
      // Get numeric user_id
      const numericUserId = await getUserIdByEmail(user.email);
      if (!numericUserId) {
        toast.error("ユーザー情報の取得に失敗しました");
        setLoading(false);
        return;
      }

      // ローカル日付をISO形式の日付文字列に変換（タイムゾーンのずれを防ぐ）
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}T00:00:00`;

      // Supabaseへのデータ登録処理
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: title,
          description: description,
          type: 'general_notice',
          created_by: numericUserId,
          due_date: dateString,
          submission_method: 'なし',  // general_notice doesn't need submission method
          subject_id: null, // general_notice doesn't need subject_id
          subsubject_id: null,
        });

      if (error) {
        console.error("Error adding general notice:", error);
        toast.error("お知らせの登録に失敗しました。");
      } else {
        toast.success("お知らせを登録しました");
        setIsAddGeneralNoticeModalOpen(false);
        await fetchAnnouncements();
      }
    } catch (err) {
      console.error("Exception in handleAddGeneralNotice:", err);
      toast.error("お知らせの登録中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };
  
  // 編集対象選択モーダルで項目が選択されたときの処理
  const handleSelectGeneralNoticeToEdit = (notice: GeneralNoticeItem) => {
      console.log("Edit general notice selected:", notice);
      setEditingGeneralNotice(notice);
      setIsEditGeneralNoticeSelectModalOpen(false); // 選択モーダルを閉じる
      setIsAddGeneralNoticeModalOpen(true); // 編集モーダルを開く
  };

  // その他のお知らせの編集処理
  const handleUpdateGeneralNotice = async ({ title, description, date }: { title: string; description: string; date: Date | undefined }) => {
    if (!editingGeneralNotice) {
      toast.error("編集対象が選択されていません");
      return;
    }

    if (!date) {
      toast.error("日付が選択されていません。");
      return;
    }

    setLoading(true);

    try {
      // ローカル日付をISO形式の日付文字列に変換（タイムゾーンのずれを防ぐ）
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}T00:00:00`;

      const { error } = await supabase
        .from('announcements')
        .update({
          title: title,
          description: description,
          due_date: dateString,
        })
        .eq('id', editingGeneralNotice.id);

      if (error) {
        console.error("Error updating general notice:", error);
        toast.error("お知らせの更新中にエラーが発生しました");
      } else {
        toast.success("お知らせを更新しました");
        setIsAddGeneralNoticeModalOpen(false);
        setEditingGeneralNotice(null);
        await fetchAnnouncements();
      }
    } catch (err) {
      console.error("Exception in handleUpdateGeneralNotice:", err);
      toast.error("お知らせの更新中にエラーが発生しました");
    } finally {
      setLoading(false);
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
                {assignment.isUrgent && !assignment.isCompleted && (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5 rounded-full shrink-0">
                  {assignment.isOverdue ? "締切超過" : "締切間近"}
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
            className="bg-white rounded-2xl p-4 shadow-sm border border-border w-full max-w-full cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/detail/${test.id}`)}
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
            onClick={() => navigate(`/detail/${notice.id}`)} // ここを追加
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
        <div className="grid grid-cols-3 gap-2">
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
        rawSubjectName: a.rawSubjectName,
        rawSubsubjectName: a.rawSubsubjectName,
        rawDueDate: a.rawDueDate,
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
        subject: editingAssignment.rawSubjectName,
        subsubject: editingAssignment.rawSubsubjectName,
        teacher: editingAssignment.teacher || "",
        description: editingAssignment.description,
        submission_method: editingAssignment.submission_method,
        dueDate: editingAssignment.rawDueDate,
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
        rawSubjectName: t.rawSubjectName,
        rawSubsubjectName: t.rawSubsubjectName,
        rawDueDate: t.rawDueDate,
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
          subject: editingTest.rawSubjectName,
          subjectColor: editingTest.subjectColor,
          course: editingTest.rawSubsubjectName,
          content: editingTest.description,
          testDate: editingTest.rawDueDate,
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
        onSave={editingGeneralNotice ? handleUpdateGeneralNotice : handleAddGeneralNotice}
        initialData={editingGeneralNotice ? {
          id: String(editingGeneralNotice.id),
          title: editingGeneralNotice.title,
          description: editingGeneralNotice.description,
          date: editingGeneralNotice.date ? (() => {
            // 日付文字列をDate型に変換
            const dateStr = editingGeneralNotice.date; // "10月15日(火)"形式
            const match = dateStr.match(/(\d+)月(\d+)日/);
            if (match) {
              const month = parseInt(match[1]);
              const day = parseInt(match[2]);
              const year = new Date().getFullYear();
              return new Date(year, month - 1, day);
            }
            return new Date();
          })() : new Date(),
        } : undefined}
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