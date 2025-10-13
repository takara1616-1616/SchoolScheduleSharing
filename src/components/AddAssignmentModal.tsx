import { useState, useEffect } from "react";
import { X, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";
import { Tables } from "../types/supabase";

interface Assignment {
  subject: string;
  subsubject: string;
  teacher: string;
  title: string;
  description: string;
  submission_method: string;
  dueDate: string;
}

interface AddAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (assignment: Omit<Assignment, "id">) => void;
  editingAssignment?: Assignment | null;
}

const submitMethods = [
  "先生へ直接",
  "Teams",
  "ロイロノート",
  "Google Classroom",
  "メール提出",
  "その他",
];

export function AddAssignmentModal({
  open,
  onClose,
  onSave,
  editingAssignment,
}: AddAssignmentModalProps) {
  const [formData, setFormData] = useState<Assignment>({
    subject: editingAssignment?.subject || "",
    subsubject: "", // 科目名を追加
    teacher: editingAssignment?.teacher || "",
    title: editingAssignment?.title || "",
    description: editingAssignment?.description || "",
    submission_method: editingAssignment?.submission_method || "",
    dueDate: editingAssignment?.dueDate || "",
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [subjects, setSubjects] = useState<Tables<'subjects'>['Row'][]>([]);
  const [subsubjects, setSubsubjects] = useState<Tables<'subsubjects'>['Row'][]>([]);
  const [teachers, setTeachers] = useState<Tables<'users'>['Row'][]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      // 教科の取得
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name');
      if (subjectsError) console.error("Error fetching subjects:", subjectsError);
      else setSubjects(subjectsData || []);

      // 科目の取得
      const { data: subsubjectsData, error: subsubjectsError } = await supabase
        .from('subsubjects')
        .select('id, subject_id, name');
      if (subsubjectsError) console.error("Error fetching subsubjects:", subsubjectsError);
      else setSubsubjects(subsubjectsData || []);

      // 先生ユーザーの取得 (ROLESテーブルとUSERSテーブルを結合して先生を特定)
      const { data: teacherRoles, error: teacherRolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          roles ( name )
        `)
        .eq('roles.name', '先生'); // '先生'ロールのIDを直接指定するか、ROLESテーブルから取得

      if (teacherRolesError) {
        console.error("Error fetching teacher roles:", teacherRolesError);
      } else {
        const teacherIds = teacherRoles?.map(tr => tr.user_id) || [];
        const { data: teachersData, error: teachersError } = await supabase
          .from('users')
          .select('*')
          .in('id', teacherIds);
        if (teachersError) console.error("Error fetching teachers:", teachersError);
        else setTeachers(teachersData || []);
      }
    };

    fetchMasterData();
  }, []);

  useEffect(() => {
    if (open && editingAssignment) {
      setFormData({
        subject: editingAssignment.subject,
        subsubject: editingAssignment.subsubject,
        teacher: editingAssignment.teacher,
        title: editingAssignment.title,
        description: editingAssignment.description,
        submission_method: editingAssignment.submission_method,
        dueDate: editingAssignment.dueDate,
      });
      if (editingAssignment.dueDate) {
        setSelectedDate(new Date(editingAssignment.dueDate));
      }
    } else if (open) {
      setFormData({
        subject: "",
        subsubject: "",
        teacher: "",
        title: "",
        description: "",
        submission_method: "",
        dueDate: "",
      });
      setSelectedDate(undefined);
    }
  }, [open, editingAssignment]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateString = date.toISOString(); // ISO形式で保存
      setFormData({ ...formData, dueDate: dateString });
      setIsCalendarOpen(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.subject ||
      !formData.subsubject ||
      !formData.teacher ||
      !formData.title ||
      !formData.description ||
      !formData.submission_method ||
      !formData.dueDate
    ) {
      toast.error("すべての項目を入力してください");
      return;
    }

    const selectedSubject = subjects.find(s => s.name === formData.subject);
    const selectedSubsubject = subsubjects.find(ss => ss.name === formData.subsubject);
    const selectedTeacher = teachers.find(t => t.name === formData.teacher);

    if (!selectedSubject || !selectedSubsubject || !selectedTeacher) {
      toast.error("選択された教科、科目、または先生が見つかりません。");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("ユーザーが認証されていません。");
      return;
    }

    // Get the user's internal ID from USERS table
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('ms_account_id', user.id)
      .single();

    const newAnnouncement: Tables<'announcements'>['Insert'] = {
      subject_id: selectedSubject.id,
      subsubject_id: selectedSubsubject.id,
      created_by: userData?.id || null,
      title: formData.title,
      description: formData.description,
      type: "assignment",
      due_date: formData.dueDate,
      submission_method: formData.submission_method,
    };

    const { error } = await supabase.from('announcements').insert(newAnnouncement);

    if (error) {
      console.error("Error adding assignment:", error);
      toast.error("提出物の登録中にエラーが発生しました。");
    } else {
      toast.success("提出物を登録しました。");
      onSave(formData); // 親コンポーネントに保存を通知
      onClose();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in">
        <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 sm:animate-in sm:zoom-in-95">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between sm:rounded-t-3xl rounded-t-3xl">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              {editingAssignment ? "提出物を編集" : "新規提出物を登録"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-5">
              {/* Subject */}
              <div className="space-y-2.5">
                <Label className="text-sm text-foreground">
                  教科 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subject: value })
                  }
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 border-border bg-white hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name} className="rounded-lg">
                        <div className="flex items-center gap-2.5">
                          {/* <div
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          /> */}
                          {subject.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subsubject (科目) */}
              <div className="space-y-2.5">
                <Label className="text-sm text-foreground">
                  科目 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.subsubject}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subsubject: value })
                  }
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 border-border bg-white hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {subsubjects
                      .filter(ss => ss.subject_id === subjects.find(s => s.name === formData.subject)?.id)
                      .map((subsubject) => (
                        <SelectItem key={subsubject.id} value={subsubject.name} className="rounded-lg">
                          {subsubject.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Teacher */}
              <div className="space-y-2.5">
                <Label className="text-sm text-foreground">
                  先生（担当者） <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.teacher}
                  onValueChange={(value) =>
                    setFormData({ ...formData, teacher: value })
                  }
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 border-border bg-white hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.name || ""} className="rounded-lg">
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title (内容) */}
              <div className="space-y-2.5">
                <Label className="text-sm text-foreground">
                  タイトル <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="例:漢字ドリルP68" // 内容からタイトルに変更
                  className="h-12 rounded-xl border-2 border-border bg-white px-4 hover:border-primary/50 focus:border-primary transition-colors"
                />
              </div>

              {/* Description (詳細内容) */}
              <div className="space-y-2.5">
                <Label className="text-sm text-foreground">
                  詳細内容
                </Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="例: 10ページから12ページまで" // 内容からタイトルに変更
                  className="h-12 rounded-xl border-2 border-border bg-white px-4 hover:border-primary/50 focus:border-primary transition-colors"
                />
              </div>

              {/* Submit Method */}
              <div className="space-y-2.5">
                <Label className="text-sm text-foreground">
                  提出方法 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.submission_method}
                  onValueChange={(value) =>
                    setFormData({ ...formData, submission_method: value })
                  }
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 border-border bg-white hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {submitMethods.map((method) => (
                      <SelectItem key={method} value={method} className="rounded-lg">
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date - Triggers Bottom Sheet Calendar */}
              <div className="space-y-2.5">
                <Label className="text-sm text-foreground">
                  提出期限 <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(true)}
                  className="w-full h-12 rounded-xl border-2 border-border bg-white hover:border-primary/50 transition-colors flex items-center px-4 text-left"
                >
                  <CalendarIcon className="mr-2.5 h-5 w-5 shrink-0 text-primary" />
                  {formData.dueDate ? (
                    <span className="text-foreground">{new Date(formData.dueDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</span>
                  ) : (
                    <span className="text-muted-foreground">日付を選択してください</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer - Fixed at Bottom */}
          <div className="sticky bottom-0 bg-white border-t border-border px-5 py-4 flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-2 border-border text-foreground hover:bg-muted transition-colors"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
            >
              {editingAssignment ? "更新" : "登録"}
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Drawer - Slides up from bottom */}
      {isCalendarOpen && (
        <Drawer open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <DrawerContent className="px-4 pb-6">
            <DrawerHeader className="text-left px-0 pt-4 pb-2">
              <DrawerTitle className="text-center">提出期限を選択</DrawerTitle>
            </DrawerHeader>
            <div className="flex justify-center py-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                className="rounded-2xl border-0"
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
