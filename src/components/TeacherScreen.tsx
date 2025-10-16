// src/components/TeacherScreen.tsx

import { useState } from "react";
import { ArrowLeft, Plus, Edit, Trash2, Check, X } from "lucide-react";
// UIコンポーネントは、プロジェクト内のパスに合わせてください (例: "./ui/button" など)
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// モーダルコンポーネント（パスはプロジェクト内の構造に合わせてください）
// 🚨 これらのコンポーネントは、このファイルには含まれていません。別途作成が必要です。
import { AddSubjectModal } from "@/components/AddSubjectModal";
import { AddTestRangeModal } from "@/components/AddTestRangeModal";
import { AddTeacherModal } from "@/components/AddTeacherModal";
import { AddAssignmentModal } from "@/components/AddAssignmentModal";
import { AddOtherNoticeModal } from "@/components/AddOtherNoticeModal";

// =================================================================
// 🚨 Supabase連携は次のステップで行うため、インポートは一時的に削除します
// import { supabase } from "@/lib/supabase"; // 画面クラッシュを避けるため削除
// =================================================================

// -----------------------------------------------------------------
// 型定義 (FigmaMakeより)
// -----------------------------------------------------------------

interface Assignment {
  id: string;
  subject: string;
  subjectColor: string;
  course: string;
  content: string;
  submitTo: string;
  deadline: string;
  isChecked: boolean;
}

interface TestRange {
  id: string;
  subject: string;
  subjectColor: string;
  course: string;
  content: string;
  testDate: string;
}

interface OtherNotice {
  id: string;
  title: string;
  content: string;
  category: string;
  categoryColor: string;
  date: string;
}

interface TeacherScreenProps {
  onBack: () => void;
}

interface SubjectCourse {
  id: string;
  category: string;
  categoryColor: string;
  courseName: string;
}

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  email: string;
}

// -----------------------------------------------------------------
// モックデータ (FigmaMakeより)
// -----------------------------------------------------------------

const subjectCourses: SubjectCourse[] = [
  // 国語
  { id: "1", category: "国語", categoryColor: "#FF9F9F", courseName: "現代の国語" },
  { id: "2", category: "国語", categoryColor: "#FF9F9F", courseName: "言語文化" },
  { id: "3", category: "国語", categoryColor: "#FF9F9F", courseName: "論理国語" },
  { id: "4", category: "国語", categoryColor: "#FF9F9F", courseName: "文学国語" },
  { id: "5", category: "国語", categoryColor: "#FF9F9F", courseName: "国語表現" },
  { id: "6", category: "国語", categoryColor: "#FF9F9F", courseName: "古典探究" },
  // 数学
  { id: "7", category: "数学", categoryColor: "#7B9FE8", courseName: "数学I" },
  { id: "8", category: "数学", categoryColor: "#7B9FE8", courseName: "数学II" },
  { id: "9", category: "数学", categoryColor: "#7B9FE8", courseName: "数学III" },
  { id: "10", category: "数学", categoryColor: "#7B9FE8", courseName: "数学A" },
  { id: "11", category: "数学", categoryColor: "#7B9FE8", courseName: "数学B" },
  { id: "12", category: "数学", categoryColor: "#7B9FE8", courseName: "数学C" },
  // 英語
  { id: "13", category: "英語", categoryColor: "#FFD6A5", courseName: "英語コミュニケーションI" },
  { id: "14", category: "英語", categoryColor: "#FFD6A5", courseName: "英語コミュニケーションII" },
  { id: "15", category: "英語", categoryColor: "#FFD6A5", courseName: "英語コミュニケーションIII" },
  { id: "16", category: "英語", categoryColor: "#FFD6A5", courseName: "論理・表現I" },
  { id: "17", category: "英語", categoryColor: "#FFD6A5", courseName: "論理・表現II" },
  { id: "18", category: "英語", categoryColor: "#FFD6A5", courseName: "論理・表現III" },
  // 理科
  { id: "19", category: "理科", categoryColor: "#A8E8D8", courseName: "物理基礎" },
  { id: "20", category: "理科", categoryColor: "#A8E8D8", courseName: "物理" },
  { id: "21", category: "理科", categoryColor: "#A8E8D8", courseName: "化学基礎" },
  { id: "22", category: "理科", categoryColor: "#A8E8D8", courseName: "化学" },
  { id: "23", category: "理科", categoryColor: "#A8E8D8", courseName: "生物基礎" },
  { id: "24", category: "理科", categoryColor: "#A8E8D8", courseName: "生物" },
  { id: "25", category: "理科", categoryColor: "#A8E8D8", courseName: "地学基礎" },
  { id: "26", category: "理科", categoryColor: "#A8E8D8", courseName: "地学" },
  // 社会
  { id: "27", category: "社会", categoryColor: "#B8A8E8", courseName: "地理総合" },
  { id: "28", category: "社会", categoryColor: "#B8A8E8", courseName: "地理探究" },
  { id: "29", category: "社会", categoryColor: "#B8A8E8", courseName: "歴史総合" },
  { id: "30", category: "社会", categoryColor: "#B8A8E8", courseName: "日本史探究" },
  { id: "31", category: "社会", categoryColor: "#B8A8E8", courseName: "世界史探究" },
  { id: "32", category: "社会", categoryColor: "#B8A8E8", courseName: "公共" },
  { id: "33", category: "社会", categoryColor: "#B8A8E8", courseName: "倫理" },
  { id: "34", category: "社会", categoryColor: "#B8A8E8", courseName: "政治・経済" },
  // 保健体育
  { id: "35", category: "保健体育", categoryColor: "#FFA8C8", courseName: "体育" },
  { id: "36", category: "保健体育", categoryColor: "#FFA8C8", courseName: "保健" },
  // 芸術
  { id: "37", category: "芸術", categoryColor: "#FFB8E8", courseName: "音楽I" },
  { id: "38", category: "芸術", categoryColor: "#FFB8E8", courseName: "音楽II" },
  { id: "39", category: "芸術", categoryColor: "#FFB8E8", courseName: "音楽III" },
  { id: "40", category: "芸術", categoryColor: "#FFB8E8", courseName: "美術I" },
  { id: "41", category: "芸術", categoryColor: "#FFB8E8", courseName: "美術II" },
  { id: "42", category: "芸術", categoryColor: "#FFB8E8", courseName: "美術III" },
  { id: "43", category: "芸術", categoryColor: "#FFB8E8", courseName: "工芸I" },
  { id: "44", category: "芸術", categoryColor: "#FFB8E8", courseName: "工芸II" },
  { id: "45", category: "芸術", categoryColor: "#FFB8E8", courseName: "工芸III" },
  { id: "46", category: "芸術", categoryColor: "#FFB8E8", courseName: "書道I" },
  { id: "47", category: "芸術", categoryColor: "#FFB8E8", courseName: "書道II" },
  { id: "48", category: "芸術", categoryColor: "#FFB8E8", courseName: "書道III" },
  // 家庭
  { id: "49", category: "家庭", categoryColor: "#FFE8A8", courseName: "家庭基礎" },
  { id: "50", category: "家庭", categoryColor: "#FFE8A8", courseName: "家庭総合" },
  // 情報
  { id: "51", category: "情報", categoryColor: "#C8D8FF", courseName: "情報I" },
  { id: "52", category: "情報", categoryColor: "#C8D8FF", courseName: "情報II" },
  // その他
  { id: "53", category: "その他", categoryColor: "#D8D8D8", courseName: "総合的な探究の時間" },
  { id: "54", category: "その他", categoryColor: "#D8D8D8", courseName: "LHR" },
  { id: "55", category: "その他", categoryColor: "#D8D8D8", courseName: "特別活動" },
];

const mockAssignments: Assignment[] = [
  {
    id: "1",
    subject: "国語",
    subjectColor: "#FF9F9F",
    course: "現代の国語",
    content: "漢字ドリルP68",
    submitTo: "先生",
    deadline: "6月8日(火)",
    isChecked: false,
  },
  {
    id: "2",
    subject: "社会",
    subjectColor: "#B8A8E8",
    course: "地理探究",
    content: "評価についてのプリント ワーク10",
    submitTo: "ロイロノート",
    deadline: "6月8日(火)",
    isChecked: true,
  },
];

const mockTestRanges: TestRange[] = [
  {
    id: "1",
    subject: "数学",
    subjectColor: "#7B9FE8",
    course: "論理・証明",
    content: "教科書 P2~10 / ワークブック P2~10",
    testDate: "6月12日(土)",
  },
];

const mockTeachers: Teacher[] = [
  {
    id: "1",
    name: "佐藤 由紀子",
    subjects: ["国語"],
    email: "sato.yukiko@school.jp",
  },
  {
    id: "2",
    name: "田中 太郎",
    subjects: ["数学"],
    email: "tanaka.taro@school.jp",
  },
  {
    id: "3",
    name: "鈴木 花子",
    subjects: ["英語"],
    email: "suzuki.hanako@school.jp",
  },
  {
    id: "4",
    name: "高橋 健",
    subjects: ["理科"],
    email: "takahashi.ken@school.jp",
  },
  {
    id: "5",
    name: "中村 美咲",
    subjects: ["社会"],
    email: "nakamura.misaki@school.jp",
  },
];

const mockOtherNotices: OtherNotice[] = [
  {
    id: "1",
    title: "体育祭について",
    content: "6月20日(土)に体育祭を実施します。雨天の場合は翌日に順延となります。",
    category: "行事",
    categoryColor: "#FFA8C8",
    date: "6月20日(土)",
  },
  {
    id: "2",
    title: "三者面談のお知らせ",
    content: "7月10日(金)～12日(日)に三者面談を実施します。詳細は後日配布します。",
    category: "連絡事項",
    categoryColor: "#A8D8E8",
    date: "7月10日(金)",
  },
  {
    id: "3",
    title: "持ち物について",
    content: "明日の授業で必要な持ち物：上履き、体操服、筆記用具",
    category: "持ち物",
    categoryColor: "#FFE8A8",
    date: "6月9日(水)",
  },
];

// -----------------------------------------------------------------
// メインコンポーネント
// -----------------------------------------------------------------

export function TeacherScreen({ onBack }: TeacherScreenProps) {
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [testRanges, setTestRanges] = useState<TestRange[]>(mockTestRanges);
  const [otherNotices, setOtherNotices] = useState<OtherNotice[]>(mockOtherNotices);
  const [subjects, setSubjects] = useState<SubjectCourse[]>(subjectCourses);
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [isAddTestRangeModalOpen, setIsAddTestRangeModalOpen] = useState(false);
  const [isEditingSubjects, setIsEditingSubjects] = useState(false);
  const [editedSubjects, setEditedSubjects] = useState<SubjectCourse[]>([]);
  const [isEditingTeachers, setIsEditingTeachers] = useState(false);
  const [editedTeachers, setEditedTeachers] = useState<Teacher[]>([]);
  const [isDeletingSubjects, setIsDeletingSubjects] = useState(false);
  const [selectedSubjectsForDeletion, setSelectedSubjectsForDeletion] = useState<Set<string>>(new Set());
  const [isDeletingTeachers, setIsDeletingTeachers] = useState(false);
  const [selectedTeachersForDeletion, setSelectedTeachersForDeletion] = useState<Set<string>>(new Set());
  const [isDeletingAssignments, setIsDeletingAssignments] = useState(false);
  const [selectedAssignmentsForDeletion, setSelectedAssignmentsForDeletion] = useState<Set<string>>(new Set());
  const [isAddAssignmentModalOpen, setIsAddAssignmentModalOpen] = useState(false);
  const [isEditingAssignments, setIsEditingAssignments] = useState(false);
  const [editedAssignments, setEditedAssignments] = useState<Assignment[]>([]);
  const [isDeletingTestRanges, setIsDeletingTestRanges] = useState(false);
  const [selectedTestRangesForDeletion, setSelectedTestRangesForDeletion] = useState<Set<string>>(new Set());
  const [isEditingTestRanges, setIsEditingTestRanges] = useState(false);
  const [editedTestRanges, setEditedTestRanges] = useState<TestRange[]>([]);
  const [isAddOtherNoticeModalOpen, setIsAddOtherNoticeModalOpen] = useState(false);
  const [isDeletingOtherNotices, setIsDeletingOtherNotices] = useState(false);
  const [selectedOtherNoticesForDeletion, setSelectedOtherNoticesForDeletion] = useState<Set<string>>(new Set());
  const [isEditingOtherNotices, setIsEditingOtherNotices] = useState(false);
  const [editedOtherNotices, setEditedOtherNotices] = useState<OtherNotice[]>([]);

  // -----------------------------------------------------------------
  // ★★★ 先生名簿 関連のハンドラ (モーダル開閉関数を追加) ★★★
  // -----------------------------------------------------------------

  const handleOpenAddTeacherModal = () => {
    // クリックイベントが生きているか確認するためのログ
    console.log("👉 ADD TEACHER BUTTON CLICKED. Attempting to open modal.");
    setIsAddTeacherModalOpen(true);
  };
  const handleCloseAddTeacherModal = () => setIsAddTeacherModalOpen(false);

  const handleSaveTeachers = (newTeachers: Omit<Teacher, "id">[]) => {
    const nextId = Math.max(...teachers.map((t) => parseInt(t.id)), 0) + 1;
    const withIds = newTeachers.map((teacher, index) => ({
      ...teacher,
      id: (nextId + index).toString(),
    }));
    setTeachers([...teachers, ...withIds]);
  };

  const handleStartEditTeachers = () => {
    setEditedTeachers([...teachers]);
    setIsEditingTeachers(true);
  };

  const handleCancelEditTeachers = () => {
    setIsEditingTeachers(false);
    setEditedTeachers([]);
  };

  const handleSaveEditTeachers = () => {
    setTeachers([...editedTeachers]);
    setIsEditingTeachers(false);
    setEditedTeachers([]);
  };

  const handleTeacherNameChange = (id: string, name: string) => {
    setEditedTeachers((prev) =>
      prev.map((teacher) =>
        teacher.id === id ? { ...teacher, name } : teacher
      )
    );
  };

  const handleTeacherSubjectToggle = (id: string, subject: string) => {
    setEditedTeachers((prev) =>
      prev.map((teacher) => {
        if (teacher.id === id) {
          const newSubjects = teacher.subjects.includes(subject)
            ? teacher.subjects.filter((s) => s !== subject)
            : [...teacher.subjects, subject];
          return { ...teacher, subjects: newSubjects };
        }
        return teacher;
      })
    );
  };

  const handleStartDeleteTeachers = () => {
    setSelectedTeachersForDeletion(new Set());
    setIsDeletingTeachers(true);
  };

  const handleCancelDeleteTeachers = () => {
    setIsDeletingTeachers(false);
    setSelectedTeachersForDeletion(new Set());
  };

  const handleToggleTeacherForDeletion = (id: string) => {
    setSelectedTeachersForDeletion((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAllTeachers = () => {
    if (selectedTeachersForDeletion.size === teachers.length) {
      setSelectedTeachersForDeletion(new Set());
    } else {
      setSelectedTeachersForDeletion(new Set(teachers.map((t) => t.id)));
    }
  };

  const handleDeleteSelectedTeachers = () => {
    setTeachers((prev) => prev.filter((t) => !selectedTeachersForDeletion.has(t.id)));
    setIsDeletingTeachers(false);
    setSelectedTeachersForDeletion(new Set());
  };


  // -----------------------------------------------------------------
  // 課題管理 関連のハンドラ
  // -----------------------------------------------------------------

  const handleToggleAssignment = (id: string) => {
    setAssignments((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  const handleStartDeleteAssignments = () => {
    setSelectedAssignmentsForDeletion(new Set());
    setIsDeletingAssignments(true);
  };

  const handleCancelDeleteAssignments = () => {
    setIsDeletingAssignments(false);
    setSelectedAssignmentsForDeletion(new Set());
  };

  const handleToggleAssignmentForDeletion = (id: string) => {
    setSelectedAssignmentsForDeletion((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAllAssignments = () => {
    if (selectedAssignmentsForDeletion.size === assignments.length) {
      setSelectedAssignmentsForDeletion(new Set());
    } else {
      setSelectedAssignmentsForDeletion(new Set(assignments.map((a) => a.id)));
    }
  };

  const handleDeleteSelectedAssignments = () => {
    setAssignments((prev) => prev.filter((a) => !selectedAssignmentsForDeletion.has(a.id)));
    setIsDeletingAssignments(false);
    setSelectedAssignmentsForDeletion(new Set());
  };

  const handleSaveAssignment = (newAssignment: Omit<Assignment, "id">) => {
    const nextId = Math.max(...assignments.map((a) => parseInt(a.id)), 0) + 1;
    setAssignments([...assignments, { ...newAssignment, id: nextId.toString() }]);
  };

  const handleStartEditAssignments = () => {
    setEditedAssignments([...assignments]);
    setIsEditingAssignments(true);
  };

  const handleCancelEditAssignments = () => {
    setIsEditingAssignments(false);
    setEditedAssignments([]);
  };

  const handleSaveEditAssignments = () => {
    setAssignments([...editedAssignments]);
    setIsEditingAssignments(false);
    setEditedAssignments([]);
  };

  const handleAssignmentFieldChange = (id: string, field: keyof Assignment, value: string | boolean) => {
    setEditedAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === id ? { ...assignment, [field]: value } : assignment
      )
    );
  };

  // -----------------------------------------------------------------
  // 考査範囲 関連のハンドラ
  // -----------------------------------------------------------------

  const handleStartDeleteTestRanges = () => {
    setSelectedTestRangesForDeletion(new Set());
    setIsDeletingTestRanges(true);
  };

  const handleCancelDeleteTestRanges = () => {
    setIsDeletingTestRanges(false);
    setSelectedTestRangesForDeletion(new Set());
  };

  const handleToggleTestRangeForDeletion = (id: string) => {
    setSelectedTestRangesForDeletion((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAllTestRanges = () => {
    if (selectedTestRangesForDeletion.size === testRanges.length) {
      setSelectedTestRangesForDeletion(new Set());
    } else {
      setSelectedTestRangesForDeletion(new Set(testRanges.map((t) => t.id)));
    }
  };

  const handleDeleteSelectedTestRanges = () => {
    setTestRanges((prev) => prev.filter((t) => !selectedTestRangesForDeletion.has(t.id)));
    setIsDeletingTestRanges(false);
    setSelectedTestRangesForDeletion(new Set());
  };

  const handleStartEditTestRanges = () => {
    setEditedTestRanges([...testRanges]);
    setIsEditingTestRanges(true);
  };

  const handleCancelEditTestRanges = () => {
    setIsEditingTestRanges(false);
    setEditedTestRanges([]);
  };

  const handleSaveEditTestRanges = () => {
    setTestRanges([...editedTestRanges]);
    setIsEditingTestRanges(false);
    setEditedTestRanges([]);
  };

  const handleTestRangeFieldChange = (id: string, field: keyof TestRange, value: string) => {
    setEditedTestRanges((prev) =>
      prev.map((testRange) =>
        testRange.id === id ? { ...testRange, [field]: value } : testRange
      )
    );
  };

  const handleSaveTestRange = (newTestRange: Omit<TestRange, "id">) => {
    const nextId = Math.max(...testRanges.map((t) => parseInt(t.id)), 0) + 1;
    setTestRanges([...testRanges, { ...newTestRange, id: nextId.toString() }]);
  };

  // -----------------------------------------------------------------
  // その他お知らせ 関連のハンドラ
  // -----------------------------------------------------------------

  const handleSaveOtherNotice = (newNotice: Omit<OtherNotice, "id">) => {
    const nextId = Math.max(...otherNotices.map((n) => parseInt(n.id)), 0) + 1;
    setOtherNotices([...otherNotices, { ...newNotice, id: nextId.toString() }]);
  };

  const handleStartEditOtherNotices = () => {
    setEditedOtherNotices([...otherNotices]);
    setIsEditingOtherNotices(true);
  };

  const handleCancelEditOtherNotices = () => {
    setIsEditingOtherNotices(false);
    setEditedOtherNotices([]);
  };

  const handleSaveEditOtherNotices = () => {
    setOtherNotices([...editedOtherNotices]);
    setIsEditingOtherNotices(false);
    setEditedOtherNotices([]);
  };

  const handleOtherNoticeFieldChange = (id: string, field: keyof OtherNotice, value: string) => {
    setEditedOtherNotices((prev) =>
      prev.map((notice) =>
        notice.id === id ? { ...notice, [field]: value } : notice
      )
    );
  };

  const handleStartDeleteOtherNotices = () => {
    setSelectedOtherNoticesForDeletion(new Set());
    setIsDeletingOtherNotices(true);
  };

  const handleCancelDeleteOtherNotices = () => {
    setIsDeletingOtherNotices(false);
    setSelectedOtherNoticesForDeletion(new Set());
  };

  const handleToggleOtherNoticeForDeletion = (id: string) => {
    setSelectedOtherNoticesForDeletion((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAllOtherNotices = () => {
    if (selectedOtherNoticesForDeletion.size === otherNotices.length) {
      setSelectedOtherNoticesForDeletion(new Set());
    } else {
      setSelectedOtherNoticesForDeletion(new Set(otherNotices.map((n) => n.id)));
    }
  };

  const handleDeleteSelectedOtherNotices = () => {
    setOtherNotices((prev) => prev.filter((n) => !selectedOtherNoticesForDeletion.has(n.id)));
    setIsDeletingOtherNotices(false);
    setSelectedOtherNoticesForDeletion(new Set());
  };

  // -----------------------------------------------------------------
  // 教科・科目 関連のハンドラ
  // -----------------------------------------------------------------

  const handleSaveSubjects = (newSubjects: Omit<SubjectCourse, "id">[]) => {
    const nextId = Math.max(...subjects.map((s) => parseInt(s.id)), 0) + 1;
    const withIds = newSubjects.map((subject, index) => ({
      ...subject,
      id: (nextId + index).toString(),
    }));
    setSubjects([...subjects, ...withIds]);
  };

  const handleStartEditSubjects = () => {
    setEditedSubjects([...subjects]);
    setIsEditingSubjects(true);
  };

  const handleCancelEditSubjects = () => {
    setIsEditingSubjects(false);
    setEditedSubjects([]);
  };

  const handleSaveEditSubjects = () => {
    setSubjects([...editedSubjects]);
    setIsEditingSubjects(false);
    setEditedSubjects([]);
  };

  const SUBJECT_CATEGORY_OPTIONS = [
    { value: "国語", color: "#FF9F9F" },
    { value: "数学", color: "#7B9FE8" },
    { value: "英語", color: "#FFD6A5" },
    { value: "理科", color: "#A8E8D8" },
    { value: "社会", color: "#B8A8E8" },
    { value: "保健体育", color: "#FFA8C8" },
    { value: "芸術", color: "#FFB8E8" }, // 芸術のカラーコードを統一
    { value: "家庭", color: "#FFE8A8" },
    { value: "情報", color: "#C8D8FF" },
    { value: "専門教科", color: "#E8A8D8" },
    { value: "その他", color: "#D8D8D8" },
  ];

  const handleSubjectCategoryChange = (id: string, category: string) => {
    const color = SUBJECT_CATEGORY_OPTIONS.find((opt) => opt.value === category)?.color || "";
    setEditedSubjects((prev) =>
      prev.map((subject) =>
        subject.id === id ? { ...subject, category, categoryColor: color } : subject
      )
    );
  };

  const handleSubjectCourseNameChange = (id: string, courseName: string) => {
    setEditedSubjects((prev) =>
      prev.map((subject) =>
        subject.id === id ? { ...subject, courseName } : subject
      )
    );
  };

  const handleStartDeleteSubjects = () => {
    setSelectedSubjectsForDeletion(new Set());
    setIsDeletingSubjects(true);
  };

  const handleCancelDeleteSubjects = () => {
    setIsDeletingSubjects(false);
    setSelectedSubjectsForDeletion(new Set());
  };

  const handleToggleSubjectForDeletion = (id: string) => {
    setSelectedSubjectsForDeletion((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAllSubjects = () => {
    if (selectedSubjectsForDeletion.size === subjects.length) {
      setSelectedSubjectsForDeletion(new Set());
    } else {
      setSelectedSubjectsForDeletion(new Set(subjects.map((s) => s.id)));
    }
  };

  const handleDeleteSelectedSubjects = () => {
    setSubjects((prev) => prev.filter((s) => !selectedSubjectsForDeletion.has(s.id)));
    setIsDeletingSubjects(false);
    setSelectedSubjectsForDeletion(new Set());
  };


  // -----------------------------------------------------------------
  // レンダリング
  // -----------------------------------------------------------------

  // 先生名簿リスト表示用の簡易コンポーネント (TeacherScreen内で定義)
  const TeacherListDisplay = () => {
    if (teachers.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">先生が登録されていません。</div>;
    }

    // 削除処理ハンドラ
    const handleRemoveTeacher = (id: string) => {
      setTeachers(prev => prev.filter(t => t.id !== id));
    };

    return (
      <div className="space-y-4">
        {teachers.map(teacher => (
          <div key={teacher.id} className="flex items-center justify-between p-3 border rounded-lg">
            {isDeletingTeachers ? (
              <Checkbox
                checked={selectedTeachersForDeletion.has(teacher.id)}
                onCheckedChange={() => handleToggleTeacherForDeletion(teacher.id)}
                className="mr-3"
              />
            ) : isEditingTeachers ? (
              <Input
                value={editedTeachers.find(t => t.id === teacher.id)?.name || teacher.name}
                onChange={(e) => handleTeacherNameChange(teacher.id, e.target.value)}
                className="flex-1 mr-4"
              />
            ) : null}

            <div className="flex-1 font-medium">
                {isEditingTeachers ? (
                    <span className="text-sm text-muted-foreground">
                        {teacher.email}
                    </span>
                ) : (
                    teacher.name
                )}
            </div>

            {!isDeletingTeachers && !isEditingTeachers && (
              <span className="ml-2 text-sm text-muted-foreground">
                ({teacher.subjects.join(', ')})
              </span>
            )}

            {/* 削除ボタン（編集モード用） */}
            {isEditingTeachers && (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveTeacher(teacher.id)}
                    className="ml-2"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
          </div>
        ))}
      </div>
    );
  };
  // TeacherListDisplay 終了

  // SubjectListDisplay はSubjects Tab内でインラインレンダリング

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-2xl text-primary" style={{ fontWeight: 600 }}>
            先生ページ
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="announcements" className="w-full">
        <div className="sticky top-[57px] z-10 bg-white border-b border-border">
          <TabsList className="w-full h-12 bg-transparent rounded-none p-0">
            <TabsTrigger
              value="info"
              className="flex-1 h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              情報管理
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="flex-1 h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              お知らせ管理
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Info Management Tab */}
        <TabsContent value="info" className="mt-0">
          <Tabs defaultValue="subjects" className="w-full">
            <div className="sticky top-[121px] z-10 bg-muted/50 px-4 py-3">
              <TabsList className="w-full max-w-md mx-auto h-10 bg-white rounded-xl p-1 shadow-sm border border-border">
                <TabsTrigger
                  value="subjects"
                  className="flex-1 h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                >
                  教科・科目
                </TabsTrigger>
                <TabsTrigger
                  value="teachers"
                  className="flex-1 h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                >
                  先生名簿
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Subjects Tab */}
            <TabsContent value="subjects" className="mt-0">
              <ScrollArea className="h-[calc(100vh-177px)]">
                <div className="p-4 space-y-6">
                  {/* Subject/Course Management */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg" style={{ fontWeight: 600 }}>
                        教科・科目一覧
                      </h2>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          {isEditingSubjects ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={handleCancelEditSubjects}
                              >
                                <X className="h-4 w-4 mr-1" />
                                キャンセル
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={handleSaveEditSubjects}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                保存
                              </Button>
                            </>
                          ) : isDeletingSubjects ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={handleCancelDeleteSubjects}
                              >
                                <X className="h-4 w-4 mr-1" />
                                キャンセル
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleDeleteSelectedSubjects}
                                disabled={selectedSubjectsForDeletion.size === 0}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                削除 ({selectedSubjectsForDeletion.size})
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => setIsAddSubjectModalOpen(true)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                追加
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={handleStartEditSubjects}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                編集
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-destructive hover:text-destructive"
                                onClick={handleStartDeleteSubjects}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                消去
                              </Button>
                            </>
                          )}
                        </div>
                        {isDeletingSubjects && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={handleSelectAllSubjects}
                          >
                            {selectedSubjectsForDeletion.size === subjects.length ? (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                全選択解除
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                全選択
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Subject List Table (Inlined for simplicity) */}
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              {isDeletingSubjects && (
                                <th className="px-4 py-3 text-center text-sm" style={{ fontWeight: 600, width: "60px" }}>
                                  選択
                                </th>
                              )}
                              <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, minWidth: "100px" }}>
                                教科
                              </th>
                              <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, minWidth: "150px" }}>
                                科目名
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(isEditingSubjects ? editedSubjects : subjects).map((subject) => (
                              <tr key={subject.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                                {isDeletingSubjects && (
                                  <td className="px-4 py-3 text-center">
                                    <Checkbox
                                      checked={selectedSubjectsForDeletion.has(subject.id)}
                                      onCheckedChange={() => handleToggleSubjectForDeletion(subject.id)}
                                    />
                                  </td>
                                )}
                                <td className="px-4 py-3 text-sm">
                                  {isEditingSubjects ? (
                                    <Select
                                      value={subject.category}
                                      onValueChange={(value) => handleSubjectCategoryChange(subject.id, value)}
                                    >
                                      <SelectTrigger className="w-[120px] h-8">
                                        <div className="flex items-center">
                                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: subject.categoryColor }}></div>
                                          <SelectValue placeholder="教科を選択" />
                                        </div>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {SUBJECT_CATEGORY_OPTIONS.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center">
                                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: option.color }}></div>
                                              {option.value}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div className="flex items-center">
                                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: subject.categoryColor }}></div>
                                      {subject.category}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {isEditingSubjects ? (
                                    <Input
                                      value={subject.courseName}
                                      onChange={(e) => handleSubjectCourseNameChange(subject.id, e.target.value)}
                                      className="h-8"
                                    />
                                  ) : (
                                    subject.courseName
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Teachers Tab */}
            <TabsContent value="teachers" className="mt-0">
              <ScrollArea className="h-[calc(100vh-177px)]">
                <div className="p-4 space-y-6">
                  {/* Teacher Management */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg" style={{ fontWeight: 600 }}>
                        先生名簿
                      </h2>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          {isEditingTeachers ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={handleCancelEditTeachers}
                              >
                                <X className="h-4 w-4 mr-1" />
                                キャンセル
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={handleSaveEditTeachers}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                保存
                              </Button>
                            </>
                          ) : isDeletingTeachers ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={handleCancelDeleteTeachers}
                              >
                                <X className="h-4 w-4 mr-1" />
                                キャンセル
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleDeleteSelectedTeachers}
                                disabled={selectedTeachersForDeletion.size === 0}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                削除 ({selectedTeachersForDeletion.size})
                              </Button>
                            </>
                          ) : (
                            <>
                              {/* ★★★ 修正箇所：onClickを割り当てました ★★★ */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={handleOpenAddTeacherModal}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                追加
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={handleStartEditTeachers}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                編集
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-destructive hover:text-destructive"
                                onClick={handleStartDeleteTeachers}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                消去
                              </Button>
                            </>
                          )}
                        </div>
                        {isDeletingTeachers && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={handleSelectAllTeachers}
                          >
                            {selectedTeachersForDeletion.size === teachers.length ? (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                全選択解除
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                全選択
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Teacher List Component */}
                    <TeacherListDisplay />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Announcements Tab (省略) */}
        <TabsContent value="announcements" className="mt-0 p-4">
          <div className="text-center text-muted-foreground py-10">
            お知らせ管理タブの内容が入ります。
          </div>
        </TabsContent>
      </Tabs>

      {/* AddTeacherModal - モーダルコンポーネントを画面の最下部に配置 */}
      <AddTeacherModal
        open={isAddTeacherModalOpen}
        onClose={handleCloseAddTeacherModal}
        onSave={handleSaveTeachers}
      />
      {/* 他のモーダルは省略 */}
      <AddSubjectModal
        open={isAddSubjectModalOpen}
        onClose={() => setIsAddSubjectModalOpen(false)}
        onSave={handleSaveSubjects}
        subjects={subjects}
      />
      {/* 以下のモーダルは、propsの整合性を確認してください */}
      <AddTestRangeModal
        open={isAddTestRangeModalOpen}
        onClose={() => setIsAddTestRangeModalOpen(false)}
        onSave={handleSaveTestRange}
        subjects={subjects}
      />
      <AddAssignmentModal
        open={isAddAssignmentModalOpen}
        onClose={() => setIsAddAssignmentModalOpen(false)}
        onSave={handleSaveAssignment}
        subjects={subjects}
      />
      <AddOtherNoticeModal
        open={isAddOtherNoticeModalOpen}
        onClose={() => setIsAddOtherNoticeModalOpen(false)}
        onSave={handleSaveOtherNotice}
      />
    </div>
  );
}