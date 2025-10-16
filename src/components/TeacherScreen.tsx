// src/components/TeacherScreen.tsx

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Edit, Trash2, Check, X } from "lucide-react";
// UIコンポーネントは、プロジェクト内のパスに合わせてください (例: "./ui/button" など)
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

// モーダルコンポーネント（パスはプロジェクト内の構造に合わせてください）
import { AddSubjectModal, SubjectRow } from "@/components/AddSubjectModal";
import { AddTestRangeModal } from "@/components/AddTestRangeModal";
import { AddTeacherModal, TeacherRow } from "@/components/AddTeacherModal";
import { AddStudentModal } from "@/components/AddStudentModal";
import { AddAssignmentModal } from "@/components/AddAssignmentModal";
import { AddOtherNoticeModal } from "@/components/AddOtherNoticeModal";

// データベース連携関数のインポート
import {
  fetchSubjectsWithCourses,
  fetchTeachers,
  fetchStudents,
  fetchAssignments,
  fetchTestRanges,
  fetchOtherNotices,
  createSubsubject,
  updateSubsubject,
  deleteSubsubjects,
  createTeacher,
  updateTeacher,
  deleteTeachers,
  createStudent,
  updateStudent,
  deleteStudents,
  createAssignment,
  updateAssignment,
  deleteAssignments,
  createTestRange,
  updateTestRange,
  deleteTestRanges,
  createOtherNotice,
  updateOtherNotice,
  deleteOtherNotices,
} from "@/lib/teacherDataHelpers";
import { supabase } from "@/lib/supabaseClient";

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
  subjectId: number;
  subsubjectId: number;
}

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  courses: string[];
  email: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  class: string;
}

// -----------------------------------------------------------------
// モックデータ (FigmaMakeより)
// -----------------------------------------------------------------



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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [testRanges, setTestRanges] = useState<TestRange[]>([]);
  const [otherNotices, setOtherNotices] = useState<OtherNotice[]>([]);
  const [subjects, setSubjects] = useState<SubjectCourse[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isAddTestRangeModalOpen, setIsAddTestRangeModalOpen] = useState(false);
  const [isEditingSubjects, setIsEditingSubjects] = useState(false);
  const [editedSubjects, setEditedSubjects] = useState<SubjectCourse[]>([]);
  const [isEditingTeachers, setIsEditingTeachers] = useState(false);
  const [editedTeachers, setEditedTeachers] = useState<Teacher[]>([]);
  const [isDeletingSubjects, setIsDeletingSubjects] = useState(false);
  const [selectedSubjectsForDeletion, setSelectedSubjectsForDeletion] = useState<Set<string>>(new Set());
  const [isDeletingTeachers, setIsDeletingTeachers] = useState(false);
  const [selectedTeachersForDeletion, setSelectedTeachersForDeletion] = useState<Set<string>>(new Set());
  const [isEditingStudents, setIsEditingStudents] = useState(false);
  const [editedStudents, setEditedStudents] = useState<Student[]>([]);
  const [isDeletingStudents, setIsDeletingStudents] = useState(false);
  const [selectedStudentsForDeletion, setSelectedStudentsForDeletion] = useState<Set<string>>(new Set());
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
  const [allSubjects, setAllSubjects] = useState<{ id: number; name: string }[]>([]);
  const [allSubsubjects, setAllSubsubjects] = useState<{ id: number; name: string; subject_id: number }[]>([]);

  // Load data from database on mount
  useEffect(() => {
    loadSubjects();
    loadTeachers();
    loadStudents();
    loadAssignments();
    loadTestRanges();
    loadOtherNotices();
    loadAllSubjects();
    loadAllSubsubjects();
  }, []);

  const loadSubjects = async () => {
    const data = await fetchSubjectsWithCourses();
    setSubjects(data);
  };

  const loadTeachers = async () => {
    const data = await fetchTeachers();
    setTeachers(data);
  };

  const loadStudents = async () => {
    const data = await fetchStudents();
    setStudents(data);
  };

  const loadAssignments = async () => {
    const data = await fetchAssignments();
    setAssignments(data);
  };

  const loadTestRanges = async () => {
    const data = await fetchTestRanges();
    setTestRanges(data);
  };

  const loadOtherNotices = async () => {
    const data = await fetchOtherNotices();
    setOtherNotices(data);
  };

  const loadAllSubjects = async () => {
    const { data, error } = await supabase.from('subjects').select('id, name');
    if (error) console.error('Error loading all subjects:', error);
    setAllSubjects(data || []);
  };

  const loadAllSubsubjects = async () => {
    const { data, error } = await supabase.from('subsubjects').select('id, name, subject_id');
    if (error) console.error('Error loading all subsubjects:', error);
    setAllSubsubjects(data || []);
  };

  // -----------------------------------------------------------------
  // ★★★ 先生名簿 関連のハンドラ (モーダル開閉関数を追加) ★★★
  // -----------------------------------------------------------------

  const handleOpenAddTeacherModal = () => {
    // クリックイベントが生きているか確認するためのログ
    console.log("👉 ADD TEACHER BUTTON CLICKED. Attempting to open modal.");
    setIsAddTeacherModalOpen(true);
  };
  const handleCloseAddTeacherModal = () => setIsAddTeacherModalOpen(false);

  const handleSaveTeachers = async (newTeachers: { name: string; email: string; subjects: string[]; }[]) => {
    try {
      for (const teacher of newTeachers) {
        await createTeacher(teacher);
      }
      await loadTeachers();
    } catch (error) {
      console.error('Error saving teachers:', error);
      alert('先生の保存に失敗しました');
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
      for (const teacher of editedTeachers) {
        await updateTeacher(teacher.id, {
          name: teacher.name,
          subjects: teacher.subjects,
          courses: teacher.courses,
        });
      }
      setIsEditingTeachers(false);
      setEditedTeachers([]);
      await loadTeachers();
    } catch (error) {
      console.error('Error updating teachers:', error);
      alert('先生の更新に失敗しました');
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

  const handleTeacherCourseToggle = (id: string, course: string) => {
    setEditedTeachers((prev) =>
      prev.map((teacher) => {
        if (teacher.id === id) {
          const newCourses = teacher.courses.includes(course)
            ? teacher.courses.filter((c) => c !== course)
            : [...teacher.courses, course];
          return { ...teacher, courses: newCourses };
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
      await deleteTeachers(Array.from(selectedTeachersForDeletion));
      setIsDeletingTeachers(false);
      setSelectedTeachersForDeletion(new Set());
      await loadTeachers();
    } catch (error) {
      console.error('Error deleting teachers:', error);
      alert('先生の削除に失敗しました');
    }
  };

  // -----------------------------------------------------------------
  // ★★★ 生徒名簿 関連のハンドラ ★★★
  // -----------------------------------------------------------------

  const handleOpenAddStudentModal = () => {
    setIsAddStudentModalOpen(true);
  };
  const handleCloseAddStudentModal = () => setIsAddStudentModalOpen(false);

  const handleSaveStudents = async (newStudents: Omit<Student, "id">[]) => {
    try {
      for (const student of newStudents) {
        await createStudent(student);
      }
      await loadStudents();
    } catch (error) {
      console.error('Error saving students:', error);
      alert('生徒の保存に失敗しました');
    }
  };

  const handleStartEditStudents = () => {
    setEditedStudents([...students]);
    setIsEditingStudents(true);
  };

  const handleCancelEditStudents = () => {
    setIsEditingStudents(false);
    setEditedStudents([]);
  };

  const handleSaveEditStudents = async () => {
    try {
      for (const student of editedStudents) {
        await updateStudent(student.id, { name: student.name, class: student.class });
      }
      setIsEditingStudents(false);
      setEditedStudents([]);
      await loadStudents();
    } catch (error) {
      console.error('Error updating students:', error);
      alert('生徒の更新に失敗しました');
    }
  };

  const handleStudentFieldChange = (id: string, field: keyof Student, value: string) => {
    setEditedStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, [field]: value } : student
      )
    );
  };

  const handleStartDeleteStudents = () => {
    setSelectedStudentsForDeletion(new Set());
    setIsDeletingStudents(true);
  };

  const handleCancelDeleteStudents = () => {
    setIsDeletingStudents(false);
    setSelectedStudentsForDeletion(new Set());
  };

  const handleToggleStudentForDeletion = (id: string) => {
    setSelectedStudentsForDeletion((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentsForDeletion.size === students.length) {
      setSelectedStudentsForDeletion(new Set());
    } else {
      setSelectedStudentsForDeletion(new Set(students.map((s) => s.id)));
    }
  };

  const handleDeleteSelectedStudents = async () => {
    try {
      await deleteStudents(Array.from(selectedStudentsForDeletion));
      setIsDeletingStudents(false);
      setSelectedStudentsForDeletion(new Set());
      await loadStudents();
    } catch (error) {
      console.error('Error deleting students:', error);
      alert('生徒の削除に失敗しました');
    }
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

  const handleDeleteSelectedAssignments = async () => {
    try {
      await deleteAssignments(Array.from(selectedAssignmentsForDeletion));
      setIsDeletingAssignments(false);
      setSelectedAssignmentsForDeletion(new Set());
      await loadAssignments();
    } catch (error) {
      console.error('Error deleting assignments:', error);
      alert('提出物の削除に失敗しました');
    }
  };

  const handleSaveAssignment = async (newAssignment: any) => {
    try {
      await createAssignment({
        subject: newAssignment.subject,
        course: newAssignment.subsubject || "",
        content: newAssignment.description,
        submitTo: newAssignment.submission_method,
        deadline: newAssignment.dueDate,
      });
      await loadAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('提出物の作成に失敗しました');
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
      for (const assignment of editedAssignments) {
        await updateAssignment(assignment.id, {
          content: assignment.content,
          submitTo: assignment.submitTo,
          deadline: assignment.deadline,
        });
      }
      setIsEditingAssignments(false);
      setEditedAssignments([]);
      await loadAssignments();
    } catch (error) {
      console.error('Error updating assignments:', error);
      alert('提出物の更新に失敗しました');
    }
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

  const handleDeleteSelectedTestRanges = async () => {
    try {
      await deleteTestRanges(Array.from(selectedTestRangesForDeletion));
      setIsDeletingTestRanges(false);
      setSelectedTestRangesForDeletion(new Set());
      await loadTestRanges();
    } catch (error) {
      console.error('Error deleting test ranges:', error);
      alert('テスト範囲の削除に失敗しました');
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
      for (const testRange of editedTestRanges) {
        await updateTestRange(testRange.id, {
          content: testRange.content,
          testDate: testRange.testDate,
        });
      }
      setIsEditingTestRanges(false);
      setEditedTestRanges([]);
      await loadTestRanges();
    } catch (error) {
      console.error('Error updating test ranges:', error);
      alert('テスト範囲の更新に失敗しました');
    }
  };

  const handleTestRangeFieldChange = (id: string, field: keyof TestRange, value: string) => {
    setEditedTestRanges((prev) =>
      prev.map((testRange) =>
        testRange.id === id ? { ...testRange, [field]: value } : testRange
      )
    );
  };

  const handleSaveTestRange = async (newTestRange: Omit<TestRange, "id">) => {
    try {
      await createTestRange({
        subject: newTestRange.subject,
        course: newTestRange.course,
        content: newTestRange.content,
        testDate: newTestRange.testDate,
      });
      await loadTestRanges();
    } catch (error) {
      console.error('Error creating test range:', error);
      alert('テスト範囲の作成に失敗しました');
    }
  };

  // -----------------------------------------------------------------
  // その他お知らせ 関連のハンドラ
  // -----------------------------------------------------------------

  const handleSaveOtherNotice = async (newNotice: Omit<OtherNotice, "id">) => {
    try {
      await createOtherNotice({
        title: newNotice.title,
        content: newNotice.content,
        category: newNotice.category,
        date: newNotice.date,
      });
      await loadOtherNotices();
    } catch (error) {
      console.error('Error creating other notice:', error);
      alert('お知らせの作成に失敗しました');
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
      for (const notice of editedOtherNotices) {
        await updateOtherNotice(notice.id, {
          title: notice.title,
          content: notice.content,
          date: notice.date,
        });
      }
      setIsEditingOtherNotices(false);
      setEditedOtherNotices([]);
      await loadOtherNotices();
    } catch (error) {
      console.error('Error updating other notices:', error);
      alert('お知らせの更新に失敗しました');
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
      await deleteOtherNotices(Array.from(selectedOtherNoticesForDeletion));
      setIsDeletingOtherNotices(false);
      setSelectedOtherNoticesForDeletion(new Set());
      await loadOtherNotices();
    } catch (error) {
      console.error('Error deleting other notices:', error);
      alert('お知らせの削除に失敗しました');
    }
  };

  // -----------------------------------------------------------------
  // 教科・科目 関連のハンドラ
  // -----------------------------------------------------------------

  const handleSaveSubjects = async (newSubjects: { category: string; courseName: string }[]) => {
    try {
      for (const subject of newSubjects) {
        await createSubsubject({
          category: subject.category,
          courseName: subject.courseName,
        });
      }
      await loadSubjects();
    } catch (error) {
      console.error('Error saving subjects:', error);
      alert('教科・科目の保存に失敗しました');
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
      console.log("Saving subjects...");
      let changesFound = 0;
      for (const edited of editedSubjects) {
        const original = subjects.find(s => s.id === edited.id);
        console.log("Comparing:", { original, edited });

        if (original && (edited.category !== original.category || edited.courseName !== original.courseName)) {
          changesFound++;
          console.log("Change detected! Updating subsubjectId:", edited.subsubjectId);
          await updateSubsubject(edited.subsubjectId, {
            category: edited.category,
            courseName: edited.courseName,
          });
        }
      }
      console.log(`Found ${changesFound} changes to save.`);
      setIsEditingSubjects(false);
      setEditedSubjects([]);
      console.log("Reloading subjects...");
      await loadSubjects();
      console.log("Subjects reloaded.");
    } catch (error) {
      console.error('Error updating subjects:', error);
      alert('教科・科目の更新に失敗しました');
    }
  };

  const SUBJECT_CATEGORY_OPTIONS = [
    { value: "国語", color: "#FF9F9F" },
    { value: "数学", color: "#7B9FE8" },
    { value: "英語", color: "#FFD6A5" },
    { value: "外国語", color: "#FFD6A5" },
    { value: "理科", color: "#A8E8D8" },
    { value: "社会", color: "#B8A8E8" },
    { value: "地理歴史", color: "#B8A8E8" },
    { value: "公民", color: "#B8A8E8" },
    { value: "保健体育", color: "#FFA8C8" },
    { value: "芸術", color: "#FFB8E8" }, // 芸術のカラーコードを統一
    { value: "家庭", color: "#FFE8A8" },
    { value: "情報", color: "#C8D8FF" },
    { value: "専門教科", color: "#E8A8D8" },
    { value: "総合", color: "#D8D8D8" },
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

  const handleDeleteSelectedSubjects = async () => {
    try {
      const subsubjectIds = Array.from(selectedSubjectsForDeletion)
        .map(id => subjects.find(s => s.id === id)?.subsubjectId)
        .filter((id): id is number => id !== undefined);

      if (subsubjectIds.length > 0) {
        await deleteSubsubjects(subsubjectIds);
      }

      setIsDeletingSubjects(false);
      setSelectedSubjectsForDeletion(new Set());
      await loadSubjects();
    } catch (error) {
      console.error('Error deleting subjects:', error);
      alert('教科・科目の削除に失敗しました');
    }
  };


  // -----------------------------------------------------------------
  // レンダリング
  // -----------------------------------------------------------------

  const TeacherListDisplay = () => {
    if (teachers.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">先生が登録されていません。</div>;
    }

    // 削除処理ハンドラ
    const handleRemoveTeacher = async (id: string) => {
      try {
        await deleteTeachers([id]);
        await loadTeachers();
      } catch (error) {
        console.error('Error removing teacher:', error);
        alert('先生の削除に失敗しました');
      }
    };

    return (
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
                <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, minWidth: "120px" }}>
                  名前
                </th>
                <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, minWidth: "180px" }}>
                  メールアドレス
                </th>
                <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, minWidth: "120px" }}>
                  教科
                </th>
                <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, minWidth: "150px" }}>
                  科目
                </th>
                {isEditingTeachers && (
                  <th className="px-4 py-3 text-center text-sm" style={{ fontWeight: 600, width: "80px" }}>
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => (
                <tr key={teacher.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                  {isDeletingTeachers && (
                    <td className="px-4 py-3 text-center">
                      <Checkbox
                        checked={selectedTeachersForDeletion.has(teacher.id)}
                        onCheckedChange={() => handleToggleTeacherForDeletion(teacher.id)}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm">
                    {isEditingTeachers ? (
                      <Input
                        value={editedTeachers.find(t => t.id === teacher.id)?.name || teacher.name}
                        onChange={(e) => handleTeacherNameChange(teacher.id, e.target.value)}
                        className="h-8"
                      />
                    ) : (
                      teacher.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {teacher.email}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isEditingTeachers ? (
                      <div className="flex flex-wrap gap-1">
                        {allSubjects.map(subject => {
                          const editedTeacher = editedTeachers.find(t => t.id === teacher.id);
                          const isChecked = editedTeacher?.subjects.includes(subject.name) || false;
                          return (
                            <label key={subject.id} className="flex items-center gap-1 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTeacherSubjectToggle(teacher.id, subject.name)}
                                className="cursor-pointer"
                              />
                              {subject.name}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      teacher.subjects.join(', ') || '未設定'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isEditingTeachers ? (
                      <div className="flex flex-wrap gap-1">
                        {allSubsubjects.map(course => {
                          const editedTeacher = editedTeachers.find(t => t.id === teacher.id);
                          const isChecked = editedTeacher?.courses.includes(course.name) || false;
                          return (
                            <label key={course.id} className="flex items-center gap-1 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTeacherCourseToggle(teacher.id, course.name)}
                                className="cursor-pointer"
                              />
                              {course.name}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      teacher.courses.join(', ') || '未設定'
                    )}
                  </td>
                  {isEditingTeachers && (
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveTeacher(teacher.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
              <TabsList className="w-full max-w-2xl mx-auto h-10 bg-white rounded-xl p-1 shadow-sm border border-border grid grid-cols-3">
                <TabsTrigger
                  value="subjects"
                  className="h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                >
                  教科・科目
                </TabsTrigger>
                <TabsTrigger
                  value="teachers"
                  className="h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                >
                  先生名簿
                </TabsTrigger>
                <TabsTrigger
                  value="students"
                  className="h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                >
                  生徒名簿
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
                                        <SelectValue placeholder="教科を選択" />
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
                              {/* ★★★ 修正箇所:onClickを割り当てました ★★★ */}
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

            {/* Students Tab */}
            <TabsContent value="students" className="mt-0">
              <ScrollArea className="h-[calc(100vh-177px)]">
                <div className="p-4 space-y-6">
                  {/* Student Management */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg" style={{ fontWeight: 600 }}>
                        生徒名簿
                      </h2>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          {isEditingStudents ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={handleCancelEditStudents}
                              >
                                <X className="h-4 w-4 mr-1" />
                                キャンセル
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={handleSaveEditStudents}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                保存
                              </Button>
                            </>
                          ) : isDeletingStudents ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={handleCancelDeleteStudents}
                              >
                                <X className="h-4 w-4 mr-1" />
                                キャンセル
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleDeleteSelectedStudents}
                                disabled={selectedStudentsForDeletion.size === 0}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                削除 ({selectedStudentsForDeletion.size})
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={handleOpenAddStudentModal}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                追加
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={handleStartEditStudents}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                編集
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-destructive hover:text-destructive"
                                onClick={handleStartDeleteStudents}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                消去
                              </Button>
                            </>
                          )}
                        </div>
                        {isDeletingStudents && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={handleSelectAllStudents}
                          >
                            {selectedStudentsForDeletion.size === students.length ? (
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
                    {/* Student List */}
                    <div className="bg-white rounded-2xl border border-border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              {isDeletingStudents && (
                                <th className="px-4 py-3 text-center text-sm" style={{ fontWeight: 600, width: "60px" }}>
                                  選択
                                </th>
                              )}
                              <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, width: "30%" }}>
                                氏名
                              </th>
                              <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, width: "30%" }}>
                                メールアドレス
                              </th>
                              <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, width: "20%" }}>
                                クラス
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(isEditingStudents ? editedStudents : students).map((student) => (
                              <tr key={student.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                                {isDeletingStudents && (
                                  <td className="px-4 py-3 text-center">
                                    <Checkbox
                                      checked={selectedStudentsForDeletion.has(student.id)}
                                      onCheckedChange={() => handleToggleStudentForDeletion(student.id)}
                                    />
                                  </td>
                                )}
                                <td className="px-4 py-3 text-sm">
                                  {isEditingStudents ? (
                                    <Input
                                      value={student.name}
                                      onChange={(e) => handleStudentFieldChange(student.id, "name", e.target.value)}
                                      className="h-8"
                                    />
                                  ) : (
                                    student.name
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {student.email}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {isEditingStudents ? (
                                    <Input
                                      value={student.class}
                                      onChange={(e) => handleStudentFieldChange(student.id, "class", e.target.value)}
                                      className="h-8"
                                    />
                                  ) : (
                                    student.class
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
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="mt-0">
          <Tabs defaultValue="assignments" className="w-full">
            <div className="sticky top-[121px] z-10 bg-muted/50 px-4 py-3">
              <TabsList className="w-full max-w-2xl mx-auto h-10 bg-white rounded-xl p-1 shadow-sm border border-border grid grid-cols-3">
                <TabsTrigger
                  value="assignments"
                  className="h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                >
                  提出物
                </TabsTrigger>
                <TabsTrigger
                  value="tests"
                  className="h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                >
                  テスト範囲
                </TabsTrigger>
                <TabsTrigger
                  value="other"
                  className="h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                >
                  その他
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="mt-0">
              <ScrollArea className="h-[calc(100vh-177px)]">
                <div className="p-4 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg" style={{ fontWeight: 600 }}>
                        提出物一覧
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
                    <div className="space-y-2">
                      {(isEditingAssignments ? editedAssignments : assignments).map((assignment) => (
                        <div key={assignment.id} className="p-4 bg-white rounded-xl border border-border">
                          <div className="flex items-start gap-3">
                            {isDeletingAssignments && (
                              <Checkbox
                                checked={selectedAssignmentsForDeletion.has(assignment.id)}
                                onCheckedChange={() => handleToggleAssignmentForDeletion(assignment.id)}
                                className="mt-1"
                              />
                            )}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: assignment.subjectColor }}></div>
                                {isEditingAssignments ? (
                                  <Input
                                    value={assignment.subject}
                                    onChange={(e) => handleAssignmentFieldChange(assignment.id, "subject", e.target.value)}
                                    className="h-8 flex-1"
                                  />
                                ) : (
                                  <span className="font-semibold">{assignment.subject}</span>
                                )}
                                <span className="text-sm text-muted-foreground">・{assignment.course}</span>
                              </div>
                              {isEditingAssignments ? (
                                <Input
                                  value={assignment.content}
                                  onChange={(e) => handleAssignmentFieldChange(assignment.id, "content", e.target.value)}
                                  className="h-8"
                                />
                              ) : (
                                <p className="text-sm">{assignment.content}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>提出先: {assignment.submitTo}</span>
                                <span>期限: {assignment.deadline}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tests Tab */}
            <TabsContent value="tests" className="mt-0">
              <ScrollArea className="h-[calc(100vh-177px)]">
                <div className="p-4 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg" style={{ fontWeight: 600 }}>
                        テスト範囲一覧
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
                    <div className="space-y-2">
                      {(isEditingTestRanges ? editedTestRanges : testRanges).map((testRange) => (
                        <div key={testRange.id} className="p-4 bg-white rounded-xl border border-border">
                          <div className="flex items-start gap-3">
                            {isDeletingTestRanges && (
                              <Checkbox
                                checked={selectedTestRangesForDeletion.has(testRange.id)}
                                onCheckedChange={() => handleToggleTestRangeForDeletion(testRange.id)}
                                className="mt-1"
                              />
                            )}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: testRange.subjectColor }}></div>
                                {isEditingTestRanges ? (
                                  <Input
                                    value={testRange.subject}
                                    onChange={(e) => handleTestRangeFieldChange(testRange.id, "subject", e.target.value)}
                                    className="h-8 flex-1"
                                  />
                                ) : (
                                  <span className="font-semibold">{testRange.subject}</span>
                                )}
                                <span className="text-sm text-muted-foreground">・{testRange.course}</span>
                              </div>
                              {isEditingTestRanges ? (
                                <Input
                                  value={testRange.content}
                                  onChange={(e) => handleTestRangeFieldChange(testRange.id, "content", e.target.value)}
                                  className="h-8"
                                />
                              ) : (
                                <p className="text-sm">{testRange.content}</p>
                              )}
                              <div className="text-sm text-muted-foreground">
                                テスト日: {testRange.testDate}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Other Notices Tab */}
            <TabsContent value="other" className="mt-0">
              <ScrollArea className="h-[calc(100vh-177px)]">
                <div className="p-4 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg" style={{ fontWeight: 600 }}>
                        その他お知らせ一覧
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
                    <div className="space-y-2">
                      {(isEditingOtherNotices ? editedOtherNotices : otherNotices).map((notice) => (
                        <div key={notice.id} className="p-4 bg-white rounded-xl border border-border">
                          <div className="flex items-start gap-3">
                            {isDeletingOtherNotices && (
                              <Checkbox
                                checked={selectedOtherNoticesForDeletion.has(notice.id)}
                                onCheckedChange={() => handleToggleOtherNoticeForDeletion(notice.id)}
                                className="mt-1"
                              />
                            )}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: notice.categoryColor }}></div>
                                {isEditingOtherNotices ? (
                                  <Input
                                    value={notice.title}
                                    onChange={(e) => handleOtherNoticeFieldChange(notice.id, "title", e.target.value)}
                                    className="h-8 flex-1"
                                  />
                                ) : (
                                  <span className="font-semibold">{notice.title}</span>
                                )}
                                <span className="text-sm text-muted-foreground">・{notice.category}</span>
                              </div>
                              {isEditingOtherNotices ? (
                                <Input
                                  value={notice.content}
                                  onChange={(e) => handleOtherNoticeFieldChange(notice.id, "content", e.target.value)}
                                  className="h-8"
                                />
                              ) : (
                                <p className="text-sm">{notice.content}</p>
                              )}
                              <div className="text-sm text-muted-foreground">
                                日付: {isEditingOtherNotices ? (
                                  <Input
                                    type="date"
                                    value={notice.date}
                                    onChange={(e) => handleOtherNoticeFieldChange(notice.id, "date", e.target.value)}
                                    className="h-8 inline-block w-auto ml-2"
                                  />
                                ) : notice.date}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Modal components */}
      <AddTeacherModal
        open={isAddTeacherModalOpen}
        onClose={handleCloseAddTeacherModal}
        onSave={handleSaveTeachers}
      />
      <AddStudentModal
        open={isAddStudentModalOpen}
        onClose={handleCloseAddStudentModal}
        onSave={handleSaveStudents}
      />
      <AddSubjectModal
        open={isAddSubjectModalOpen}
        onClose={() => setIsAddSubjectModalOpen(false)}
        onSave={handleSaveSubjects}
      />
      <AddTestRangeModal
        open={isAddTestRangeModalOpen}
        onClose={() => setIsAddTestRangeModalOpen(false)}
        onSave={handleSaveTestRange}
      />
      <AddAssignmentModal
        open={isAddAssignmentModalOpen}
        onClose={() => setIsAddAssignmentModalOpen(false)}
        onSave={handleSaveAssignment}
      />
      <AddOtherNoticeModal
        open={isAddOtherNoticeModalOpen}
        onClose={() => setIsAddOtherNoticeModalOpen(false)}
        onSave={handleSaveOtherNotice}
      />
    </div>
  );
}