import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Edit, Trash2, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { AddSubjectModal } from "./AddSubjectModal";
import { AddTestRangeModal } from "./AddTestRangeModal";
import { AddTeacherModal } from "./AddTeacherModal";
import { AddAssignmentModal } from "./AddAssignmentModal";
import { AddOtherNoticeModal } from "./AddOtherNoticeModal";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import * as teacherData from "@/lib/teacherDataHelpers";

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

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  email: string;
}

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

export function TeacherScreen({ onBack }: TeacherScreenProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [testRanges, setTestRanges] = useState<TestRange[]>([]);
  const [otherNotices, setOtherNotices] = useState<OtherNotice[]>([]);
  const [subjects, setSubjects] = useState<SubjectCourse[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Load data from database on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [assignmentsData, testRangesData, otherNoticesData, subjectsData, teachersData] = await Promise.all([
        teacherData.fetchAssignments(),
        teacherData.fetchTestRanges(),
        teacherData.fetchOtherNotices(),
        teacherData.fetchSubjectsWithCourses(),
        teacherData.fetchTeachers(),
      ]);

      setAssignments(assignmentsData);
      setTestRanges(testRangesData);
      setOtherNotices(otherNoticesData);
      setSubjects(subjectsData);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleDeleteSelectedAssignments = async () => {
    try {
      await teacherData.deleteAssignments(Array.from(selectedAssignmentsForDeletion));
      toast.success('提出物を削除しました');
      await loadAllData();
      setIsDeletingAssignments(false);
      setSelectedAssignmentsForDeletion(new Set());
    } catch (error) {
      console.error('Error deleting assignments:', error);
      toast.error('削除に失敗しました');
    }
  };

  const handleSaveAssignment = async (modalData: { subject: string; subsubject: string; teacher: string; description: string; submission_method: string; dueDate: string }) => {
    try {
      // Convert from AddAssignmentModal format to TeacherScreen format
      const assignmentData: Omit<Assignment, "id"> = {
        subject: modalData.subject,
        subjectColor: "#7B9FE8", // Default color, should be determined based on subject
        course: modalData.subsubject,
        content: modalData.description,
        submitTo: modalData.submission_method,
        deadline: modalData.dueDate,
        isChecked: false,
      };
      await teacherData.createAssignment(assignmentData);
      toast.success('提出物を追加しました');
      await loadAllData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('追加に失敗しました');
    }
  };

  const handleStartEditAssignments = () => {
    setEditedAssignments([...assignments]);
    setIsEditingAssignments(true);
  };

  const handleCancelEditAssignments = () => {
    setIsEditingAssignments(false);
    setEditedAssignments([]);
  };

  const handleSaveEditAssignments = async () => {
    try {
      // Update each edited assignment
      await Promise.all(
        editedAssignments.map((assignment) =>
          teacherData.updateAssignment(assignment.id, assignment)
        )
      );
      toast.success('提出物を更新しました');
      await loadAllData();
      setIsEditingAssignments(false);
      setEditedAssignments([]);
    } catch (error) {
      console.error('Error updating assignments:', error);
      toast.error('更新に失敗しました');
    }
  };

  const handleAssignmentFieldChange = (id: string, field: keyof Assignment, value: string | boolean) => {
    setEditedAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === id ? { ...assignment, [field]: value } : assignment
      )
    );
  };

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

  const handleDeleteSelectedTestRanges = async () => {
    try {
      await teacherData.deleteTestRanges(Array.from(selectedTestRangesForDeletion));
      toast.success('テスト範囲を削除しました');
      await loadAllData();
      setIsDeletingTestRanges(false);
      setSelectedTestRangesForDeletion(new Set());
    } catch (error) {
      console.error('Error deleting test ranges:', error);
      toast.error('削除に失敗しました');
    }
  };

  const handleStartEditTestRanges = () => {
    setEditedTestRanges([...testRanges]);
    setIsEditingTestRanges(true);
  };

  const handleCancelEditTestRanges = () => {
    setIsEditingTestRanges(false);
    setEditedTestRanges([]);
  };

  const handleSaveEditTestRanges = async () => {
    try {
      await Promise.all(
        editedTestRanges.map((testRange) =>
          teacherData.updateTestRange(testRange.id, testRange)
        )
      );
      toast.success('テスト範囲を更新しました');
      await loadAllData();
      setIsEditingTestRanges(false);
      setEditedTestRanges([]);
    } catch (error) {
      console.error('Error updating test ranges:', error);
      toast.error('更新に失敗しました');
    }
  };

  const handleTestRangeFieldChange = (id: string, field: keyof TestRange, value: string) => {
    setEditedTestRanges((prev) =>
      prev.map((testRange) =>
        testRange.id === id ? { ...testRange, [field]: value } : testRange
      )
    );
  };

  const handleSaveOtherNotice = async (newNotice: Omit<OtherNotice, "id">) => {
    try {
      await teacherData.createOtherNotice(newNotice);
      toast.success('お知らせを追加しました');
      await loadAllData();
    } catch (error) {
      console.error('Error creating other notice:', error);
      toast.error('追加に失敗しました');
    }
  };

  const handleStartEditOtherNotices = () => {
    setEditedOtherNotices([...otherNotices]);
    setIsEditingOtherNotices(true);
  };

  const handleCancelEditOtherNotices = () => {
    setIsEditingOtherNotices(false);
    setEditedOtherNotices([]);
  };

  const handleSaveEditOtherNotices = async () => {
    try {
      await Promise.all(
        editedOtherNotices.map((notice) =>
          teacherData.updateOtherNotice(notice.id, notice)
        )
      );
      toast.success('お知らせを更新しました');
      await loadAllData();
      setIsEditingOtherNotices(false);
      setEditedOtherNotices([]);
    } catch (error) {
      console.error('Error updating other notices:', error);
      toast.error('更新に失敗しました');
    }
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

  const handleDeleteSelectedOtherNotices = async () => {
    try {
      await teacherData.deleteOtherNotices(Array.from(selectedOtherNoticesForDeletion));
      toast.success('お知らせを削除しました');
      await loadAllData();
      setIsDeletingOtherNotices(false);
      setSelectedOtherNoticesForDeletion(new Set());
    } catch (error) {
      console.error('Error deleting other notices:', error);
      toast.error('削除に失敗しました');
    }
  };

  const handleSaveSubjects = async (newSubjects: Omit<SubjectCourse, "id">[]) => {
    try {
      await Promise.all(
        newSubjects.map((subject) =>
          teacherData.createSubsubject(subject)
        )
      );
      toast.success('教科・科目を追加しました');
      await loadAllData();
    } catch (error) {
      console.error('Error creating subjects:', error);
      toast.error('追加に失敗しました');
    }
  };

  const handleStartEditSubjects = () => {
    setEditedSubjects([...subjects]);
    setIsEditingSubjects(true);
  };

  const handleCancelEditSubjects = () => {
    setIsEditingSubjects(false);
    setEditedSubjects([]);
  };

  const handleSaveEditSubjects = async () => {
    try {
      // Update each subject by its courseName (subsubject name)
      await Promise.all(
        editedSubjects.map((subject, index) => {
          const originalSubject = subjects[index];
          if (originalSubject) {
            return teacherData.updateSubsubject(originalSubject.courseName, subject);
          }
          return Promise.resolve();
        })
      );
      toast.success('教科・科目を更新しました');
      await loadAllData();
      setIsEditingSubjects(false);
      setEditedSubjects([]);
    } catch (error) {
      console.error('Error updating subjects:', error);
      toast.error('更新に失敗しました');
    }
  };

  const handleSubjectCategoryChange = (id: string, category: string) => {
    const categoryOptions = [
      { value: "国語", color: "#FF9F9F" },
      { value: "数学", color: "#7B9FE8" },
      { value: "英語", color: "#FFD6A5" },
      { value: "理科", color: "#A8E8D8" },
      { value: "社会", color: "#B8A8E8" },
      { value: "保健体育", color: "#FFA8C8" },
      { value: "芸術", color: "#E8D8A8" },
      { value: "家庭", color: "#D8E8A8" },
      { value: "情報", color: "#A8D8E8" },
      { value: "専門教科", color: "#E8A8D8" },
      { value: "その他", color: "#D8D8D8" },
    ];
    const color = categoryOptions.find((opt) => opt.value === category)?.color || "";
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

  const handleDeleteSelectedSubjects = async () => {
    try {
      // Get courseName from selected subjects
      const courseNames = subjects
        .filter(s => selectedSubjectsForDeletion.has(s.id))
        .map(s => s.courseName);

      await teacherData.deleteSubsubjects(courseNames);
      toast.success('教科・科目を削除しました');
      await loadAllData();
      setIsDeletingSubjects(false);
      setSelectedSubjectsForDeletion(new Set());
    } catch (error) {
      console.error('Error deleting subjects:', error);
      toast.error('削除に失敗しました');
    }
  };

  const handleSaveTestRange = async (newTestRange: Omit<TestRange, "id">) => {
    try {
      await teacherData.createTestRange(newTestRange);
      toast.success('テスト範囲を追加しました');
      await loadAllData();
    } catch (error) {
      console.error('Error creating test range:', error);
      toast.error('追加に失敗しました');
    }
  };

  const handleSaveTeachers = async (newTeachers: Omit<Teacher, "id">[]) => {
    try {
      await Promise.all(
        newTeachers.map((teacher) =>
          teacherData.createTeacher(teacher)
        )
      );
      toast.success('先生を追加しました');
      await loadAllData();
    } catch (error) {
      console.error('Error creating teachers:', error);
      toast.error('追加に失敗しました');
    }
  };

  const handleStartEditTeachers = () => {
    setEditedTeachers([...teachers]);
    setIsEditingTeachers(true);
  };

  const handleCancelEditTeachers = () => {
    setIsEditingTeachers(false);
    setEditedTeachers([]);
  };

  const handleSaveEditTeachers = async () => {
    try {
      await Promise.all(
        editedTeachers.map((teacher) =>
          teacherData.updateTeacher(teacher.id, teacher)
        )
      );
      toast.success('先生情報を更新しました');
      await loadAllData();
      setIsEditingTeachers(false);
      setEditedTeachers([]);
    } catch (error) {
      console.error('Error updating teachers:', error);
      toast.error('更新に失敗しました');
    }
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

  const handleDeleteSelectedTeachers = async () => {
    try {
      await teacherData.deleteTeachers(Array.from(selectedTeachersForDeletion));
      toast.success('先生を削除しました');
      await loadAllData();
      setIsDeletingTeachers(false);
      setSelectedTeachersForDeletion(new Set());
    } catch (error) {
      console.error('Error deleting teachers:', error);
      toast.error('削除に失敗しました');
    }
  };

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
                              <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, width: isDeletingSubjects ? "30%" : "30%" }}>
                                教科
                              </th>
                              <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, width: isDeletingSubjects ? "calc(70% - 60px)" : "70%" }}>
                                科目
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(isEditingSubjects ? editedSubjects : subjects).map((item) => (
                              <tr key={item.id} className="border-b border-border last:border-0">
                                {isDeletingSubjects && (
                                  <td className="px-4 py-3 text-center">
                                    <Checkbox
                                      checked={selectedSubjectsForDeletion.has(item.id)}
                                      onCheckedChange={() => handleToggleSubjectForDeletion(item.id)}
                                    />
                                  </td>
                                )}
                                <td className="px-4 py-3">
                                  {isEditingSubjects ? (
                                    <Select
                                      value={item.category}
                                      onValueChange={(value) => handleSubjectCategoryChange(item.id, value)}
                                    >
                                      <SelectTrigger className="w-full h-9 rounded-lg">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="国語">
                                          <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#FF9F9F" }} />
                                            国語
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="数学">
                                          <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#7B9FE8" }} />
                                            数学
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="英語">
                                          <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#FFD6A5" }} />
                                            英語
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="理科">
                                          <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#A8E8D8" }} />
                                            理科
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="社会">
                                          <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#B8A8E8" }} />
                                            社会
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="保健体育">
                                          <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#FFA8C8" }} />
                                            保健体育
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="芸術">
                                          <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#E8D8A8" }} />
                                            芸術
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="家庭">
                                          <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#D8E8A8" }} />
                                            家庭
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="情報">
                                          <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#A8D8E8" }} />
                                            情報
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="専門教科">
                                          <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#E8A8D8" }} />
                                            専門教科
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="その他">
                                          <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#D8D8D8" }} />
                                            その他
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <span
                                      className="inline-block px-2 py-1 rounded text-white text-sm"
                                      style={{ backgroundColor: item.categoryColor, fontWeight: 500 }}
                                    >
                                      {item.category}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {isEditingSubjects ? (
                                    <Input
                                      value={item.courseName}
                                      onChange={(e) => handleSubjectCourseNameChange(item.id, e.target.value)}
                                      className="h-9 rounded-lg bg-input-background"
                                    />
                                  ) : (
                                    <span className="text-sm">{item.courseName}</span>
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
                  {/* Teachers List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg" style={{ fontWeight: 600 }}>
                        先生一覧
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
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-xl"
                                onClick={() => setIsAddTeacherModalOpen(true)}
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
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              {isDeletingTeachers && (
                                <th className="px-4 py-3 text-center text-sm" style={{ fontWeight: 600, width: "60px" }}>
                                  選択
                                </th>
                              )}
                              <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, width: isDeletingTeachers ? "40%" : "50%" }}>
                                担当教科
                              </th>
                              <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, width: isDeletingTeachers ? "calc(60% - 60px)" : "50%" }}>
                                氏名
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(isEditingTeachers ? editedTeachers : teachers).map((teacher) => {
                              const subjectColorMap: { [key: string]: string } = {
                                "国語": "#FF9F9F",
                                "数学": "#7B9FE8",
                                "英語": "#FFD6A5",
                                "理科": "#A8E8D8",
                                "化学": "#A8E8D8",
                                "社会": "#B8A8E8",
                                "地理": "#B8A8E8",
                                "保健体育": "#FFA8C8",
                                "芸術": "#FFB8E8",
                                "家庭": "#FFE8A8",
                                "情報": "#C8D8FF",
                              };
                              const availableSubjects = [
                                { value: "国語", color: "#FF9F9F" },
                                { value: "数学", color: "#7B9FE8" },
                                { value: "英語", color: "#FFD6A5" },
                                { value: "理科", color: "#A8E8D8" },
                                { value: "社会", color: "#B8A8E8" },
                                { value: "保健体育", color: "#FFA8C8" },
                                { value: "芸術", color: "#FFB8E8" },
                                { value: "家庭", color: "#FFE8A8" },
                                { value: "情報", color: "#C8D8FF" },
                                { value: "その他", color: "#D8D8D8" },
                              ];
                              
                              return (
                                <tr key={teacher.id} className="border-b border-border last:border-0">
                                  {isDeletingTeachers && (
                                    <td className="px-4 py-3 text-center">
                                      <Checkbox
                                        checked={selectedTeachersForDeletion.has(teacher.id)}
                                        onCheckedChange={() => handleToggleTeacherForDeletion(teacher.id)}
                                      />
                                    </td>
                                  )}
                                  <td className="px-4 py-3">
                                    {isEditingTeachers ? (
                                      <div className="space-y-2">
                                        <Select
                                          value=""
                                          onValueChange={(value) => {
                                            if (value) {
                                              handleTeacherSubjectToggle(teacher.id, value);
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="w-full h-9 rounded-lg bg-white">
                                            <SelectValue placeholder="担当教科を選択" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableSubjects.map((subject) => {
                                              const isSelected = teacher.subjects.includes(subject.value);
                                              return (
                                                <SelectItem 
                                                  key={subject.value} 
                                                  value={subject.value}
                                                  className="cursor-pointer"
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 flex items-center justify-center">
                                                      {isSelected && (
                                                        <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
                                                      )}
                                                    </div>
                                                    <div
                                                      className="w-3 h-3 rounded"
                                                      style={{ backgroundColor: subject.color }}
                                                    />
                                                    {subject.value}
                                                  </div>
                                                </SelectItem>
                                              );
                                            })}
                                          </SelectContent>
                                        </Select>
                                        {teacher.subjects.length > 0 && (
                                          <div className="flex flex-wrap gap-1.5">
                                            {teacher.subjects.map((subject, index) => {
                                              const color = subjectColorMap[subject] || "#D8D8D8";
                                              return (
                                                <span
                                                  key={index}
                                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-sm"
                                                  style={{ backgroundColor: color, fontWeight: 500 }}
                                                >
                                                  {subject}
                                                  <button
                                                    onClick={() => handleTeacherSubjectToggle(teacher.id, subject)}
                                                    className="hover:bg-white/20 rounded-sm transition-colors"
                                                    aria-label={`${subject}を削除`}
                                                  >
                                                    <X className="h-3 w-3" />
                                                  </button>
                                                </span>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5">
                                        {teacher.subjects.map((subject, index) => {
                                          const color = subjectColorMap[subject] || "#D8D8D8";
                                          return (
                                            <span
                                              key={index}
                                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-white text-sm"
                                              style={{ backgroundColor: color, fontWeight: 500 }}
                                            >
                                              {subject}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {isEditingTeachers ? (
                                      <Input
                                        value={teacher.name}
                                        onChange={(e) => handleTeacherNameChange(teacher.id, e.target.value)}
                                        className="h-9 rounded-lg bg-input-background"
                                      />
                                    ) : (
                                      <span className="text-sm" style={{ fontWeight: 500 }}>{teacher.name}</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Announcements Management Tab */}
        <TabsContent value="announcements" className="mt-0">
          <ScrollArea className="h-[calc(100vh-121px)]">
            <div className="p-4 space-y-6">
              {/* Assignments Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg" style={{ fontWeight: 600 }}>
                    提出物
                  </h2>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      {isEditingAssignments ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={handleCancelEditAssignments}
                          >
                            <X className="h-4 w-4 mr-1" />
                            キャンセル
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={handleSaveEditAssignments}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            保存
                          </Button>
                        </>
                      ) : isDeletingAssignments ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={handleCancelDeleteAssignments}
                          >
                            <X className="h-4 w-4 mr-1" />
                            キャンセル
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteSelectedAssignments}
                            disabled={selectedAssignmentsForDeletion.size === 0}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            削除 ({selectedAssignmentsForDeletion.size})
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl"
                            onClick={() => setIsAddAssignmentModalOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            追加
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl"
                            onClick={handleStartEditAssignments}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            編集
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl text-destructive hover:text-destructive"
                            onClick={handleStartDeleteAssignments}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            消去
                          </Button>
                        </>
                      )}
                    </div>
                    {isDeletingAssignments && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={handleSelectAllAssignments}
                      >
                        {selectedAssignmentsForDeletion.size === assignments.length ? (
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
                <div className="bg-white rounded-2xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {isDeletingAssignments && (
                            <th className="px-3 py-3 text-center text-sm" style={{ fontWeight: 600, width: "60px" }}>
                              選択
                            </th>
                          )}
                          <th className="px-3 py-3 text-left text-sm" style={{ fontWeight: 600, width: "100px" }}>
                            教科
                          </th>
                          <th className="px-3 py-3 text-left text-sm" style={{ fontWeight: 600, width: "150px" }}>
                            科目名
                          </th>
                          <th className="px-3 py-3 text-left text-sm" style={{ fontWeight: 600 }}>
                            内容（範囲）
                          </th>
                          <th className="px-3 py-3 text-left text-sm" style={{ fontWeight: 600, width: "120px" }}>
                            提出先
                          </th>
                          <th className="px-3 py-3 text-left text-sm" style={{ fontWeight: 600, width: "120px" }}>
                            期限
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(isEditingAssignments ? editedAssignments : assignments).map((assignment) => (
                          <tr key={assignment.id} className="border-b border-border last:border-0">
                            {isDeletingAssignments && (
                              <td className="px-3 py-3 text-center">
                                <Checkbox
                                  checked={selectedAssignmentsForDeletion.has(assignment.id)}
                                  onCheckedChange={() => handleToggleAssignmentForDeletion(assignment.id)}
                                />
                              </td>
                            )}
                            <td className="px-3 py-3">
                              <span
                                className="inline-block px-2 py-1 rounded text-white text-sm"
                                style={{ backgroundColor: assignment.subjectColor, fontWeight: 500 }}
                              >
                                {assignment.subject}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {isEditingAssignments ? (
                                <Input
                                  value={assignment.course}
                                  onChange={(e) => handleAssignmentFieldChange(assignment.id, "course", e.target.value)}
                                  className="h-8 rounded-lg bg-input-background text-sm"
                                />
                              ) : (
                                <span className="text-sm">{assignment.course}</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {isEditingAssignments ? (
                                <Input
                                  value={assignment.content}
                                  onChange={(e) => handleAssignmentFieldChange(assignment.id, "content", e.target.value)}
                                  className="h-8 rounded-lg bg-input-background text-sm"
                                />
                              ) : (
                                <span className="text-sm">{assignment.content}</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {isEditingAssignments ? (
                                <Input
                                  value={assignment.submitTo}
                                  onChange={(e) => handleAssignmentFieldChange(assignment.id, "submitTo", e.target.value)}
                                  className="h-8 rounded-lg bg-input-background text-sm"
                                />
                              ) : (
                                <span className="text-sm">{assignment.submitTo}</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {isEditingAssignments ? (
                                <Input
                                  value={assignment.deadline}
                                  onChange={(e) => handleAssignmentFieldChange(assignment.id, "deadline", e.target.value)}
                                  className="h-8 rounded-lg bg-input-background text-sm"
                                />
                              ) : (
                                <span className="text-sm">{assignment.deadline}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Test Range Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg" style={{ fontWeight: 600 }}>
                    テスト範囲
                  </h2>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      {isEditingTestRanges ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={handleCancelEditTestRanges}
                          >
                            <X className="h-4 w-4 mr-1" />
                            キャンセル
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={handleSaveEditTestRanges}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            保存
                          </Button>
                        </>
                      ) : isDeletingTestRanges ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={handleCancelDeleteTestRanges}
                          >
                            <X className="h-4 w-4 mr-1" />
                            キャンセル
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteSelectedTestRanges}
                            disabled={selectedTestRangesForDeletion.size === 0}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            削除 ({selectedTestRangesForDeletion.size})
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => setIsAddTestRangeModalOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            追加
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl"
                            onClick={handleStartEditTestRanges}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            編集
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl text-destructive hover:text-destructive"
                            onClick={handleStartDeleteTestRanges}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            消去
                          </Button>
                        </>
                      )}
                    </div>
                    {isDeletingTestRanges && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={handleSelectAllTestRanges}
                      >
                        {selectedTestRangesForDeletion.size === testRanges.length ? (
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
                <div className="bg-white rounded-2xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {isDeletingTestRanges && (
                            <th className="px-3 py-3 text-center text-sm" style={{ fontWeight: 600, width: "60px" }}>
                              選択
                            </th>
                          )}
                          <th className="px-3 py-3 text-left text-sm" style={{ fontWeight: 600, width: "100px" }}>
                            教科
                          </th>
                          <th className="px-3 py-3 text-left text-sm" style={{ fontWeight: 600, width: "150px" }}>
                            科目名
                          </th>
                          <th className="px-3 py-3 text-left text-sm" style={{ fontWeight: 600 }}>
                            内容（範囲）
                          </th>
                          <th className="px-3 py-3 text-left text-sm" style={{ fontWeight: 600, width: "120px" }}>
                            テスト日
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(isEditingTestRanges ? editedTestRanges : testRanges).map((test) => (
                          <tr key={test.id} className="border-b border-border last:border-0">
                            {isDeletingTestRanges && (
                              <td className="px-3 py-3 text-center">
                                <Checkbox
                                  checked={selectedTestRangesForDeletion.has(test.id)}
                                  onCheckedChange={() => handleToggleTestRangeForDeletion(test.id)}
                                />
                              </td>
                            )}
                            <td className="px-3 py-3">
                              <span
                                className="inline-block px-2 py-1 rounded text-white text-sm"
                                style={{ backgroundColor: test.subjectColor, fontWeight: 500 }}
                              >
                                {test.subject}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {isEditingTestRanges ? (
                                <Input
                                  value={test.course}
                                  onChange={(e) => handleTestRangeFieldChange(test.id, "course", e.target.value)}
                                  className="h-8 rounded-lg bg-input-background text-sm"
                                />
                              ) : (
                                <span className="text-sm">{test.course}</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {isEditingTestRanges ? (
                                <Input
                                  value={test.content}
                                  onChange={(e) => handleTestRangeFieldChange(test.id, "content", e.target.value)}
                                  className="h-8 rounded-lg bg-input-background text-sm"
                                />
                              ) : (
                                <span className="text-sm">{test.content}</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {isEditingTestRanges ? (
                                <Input
                                  value={test.testDate}
                                  onChange={(e) => handleTestRangeFieldChange(test.id, "testDate", e.target.value)}
                                  className="h-8 rounded-lg bg-input-background text-sm"
                                />
                              ) : (
                                <span className="text-sm">{test.testDate}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Other Notices Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg" style={{ fontWeight: 600 }}>
                    その他
                  </h2>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      {isEditingOtherNotices ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={handleCancelEditOtherNotices}
                          >
                            <X className="h-4 w-4 mr-1" />
                            キャンセル
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={handleSaveEditOtherNotices}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            保存
                          </Button>
                        </>
                      ) : isDeletingOtherNotices ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={handleCancelDeleteOtherNotices}
                          >
                            <X className="h-4 w-4 mr-1" />
                            キャンセル
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteSelectedOtherNotices}
                            disabled={selectedOtherNoticesForDeletion.size === 0}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            削除 ({selectedOtherNoticesForDeletion.size})
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => setIsAddOtherNoticeModalOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            追加
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl"
                            onClick={handleStartEditOtherNotices}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            編集
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl text-destructive hover:text-destructive"
                            onClick={handleStartDeleteOtherNotices}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            消去
                          </Button>
                        </>
                      )}
                    </div>
                    {isDeletingOtherNotices && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={handleSelectAllOtherNotices}
                      >
                        {selectedOtherNoticesForDeletion.size === otherNotices.length ? (
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
                <div className="bg-white rounded-2xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {isDeletingOtherNotices && (
                            <th className="px-3 py-3 text-center text-sm" style={{ fontWeight: 600, width: "60px" }}>
                              選択
                            </th>
                          )}
                          <th className="px-3 py-3 text-left text-sm" style={{ fontWeight: 600, width: "100px" }}>
                            カテゴリー
                          </th>
                          <th className="px-3 py-3 text-left text-sm" style={{ fontWeight: 600, width: "200px" }}>
                            タイトル
                          </th>
                          <th className="px-3 py-3 text-left text-sm" style={{ fontWeight: 600 }}>
                            内容
                          </th>
                          <th className="px-3 py-3 text-left text-sm" style={{ fontWeight: 600, width: "120px" }}>
                            日付
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(isEditingOtherNotices ? editedOtherNotices : otherNotices).map((notice) => (
                          <tr key={notice.id} className="border-b border-border last:border-0">
                            {isDeletingOtherNotices && (
                              <td className="px-3 py-3 text-center">
                                <Checkbox
                                  checked={selectedOtherNoticesForDeletion.has(notice.id)}
                                  onCheckedChange={() => handleToggleOtherNoticeForDeletion(notice.id)}
                                />
                              </td>
                            )}
                            <td className="px-3 py-3">
                              <span
                                className="inline-block px-2 py-1 rounded text-white text-sm"
                                style={{ backgroundColor: notice.categoryColor, fontWeight: 500 }}
                              >
                                {notice.category}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {isEditingOtherNotices ? (
                                <Input
                                  value={notice.title}
                                  onChange={(e) => handleOtherNoticeFieldChange(notice.id, "title", e.target.value)}
                                  className="h-8 rounded-lg bg-input-background text-sm"
                                />
                              ) : (
                                <span className="text-sm">{notice.title}</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {isEditingOtherNotices ? (
                                <Input
                                  value={notice.content}
                                  onChange={(e) => handleOtherNoticeFieldChange(notice.id, "content", e.target.value)}
                                  className="h-8 rounded-lg bg-input-background text-sm"
                                />
                              ) : (
                                <span className="text-sm">{notice.content}</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {isEditingOtherNotices ? (
                                <Input
                                  value={notice.date}
                                  onChange={(e) => handleOtherNoticeFieldChange(notice.id, "date", e.target.value)}
                                  className="h-8 rounded-lg bg-input-background text-sm"
                                />
                              ) : (
                                <span className="text-sm">{notice.date}</span>
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
      </Tabs>

      <AddSubjectModal
        open={isAddSubjectModalOpen}
        onClose={() => setIsAddSubjectModalOpen(false)}
        onSave={handleSaveSubjects}
      />
      <AddTeacherModal
        open={isAddTeacherModalOpen}
        onClose={() => setIsAddTeacherModalOpen(false)}
        onSave={handleSaveTeachers}
      />
      <AddAssignmentModal
        open={isAddAssignmentModalOpen}
        onClose={() => setIsAddAssignmentModalOpen(false)}
        onSave={handleSaveAssignment}
      />
      <AddTestRangeModal
        open={isAddTestRangeModalOpen}
        onClose={() => setIsAddTestRangeModalOpen(false)}
        onSave={handleSaveTestRange}
      />
      <AddOtherNoticeModal
        open={isAddOtherNoticeModalOpen}
        onClose={() => setIsAddOtherNoticeModalOpen(false)}
        onSave={handleSaveOtherNotice}
      />
    </div>
  );
}
