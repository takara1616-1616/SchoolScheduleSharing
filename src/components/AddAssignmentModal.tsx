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
    // title: editingAssignment?.title || "", 
    description: editingAssignment?.description || "",
    submission_method: editingAssignment?.submission_method || "",
    dueDate: editingAssignment?.dueDate || "",
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [subjects, setSubjects] = useState<Tables<'subjects'>['Row'][]>([]);
  const [subsubjects, setSubsubjects] = useState<Tables<'subsubjects'>['Row'][]>([]);
  // 先生のリストは不要のため削除

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

      // 先生ユーザーの取得処理は不要のため削除
    };

    fetchMasterData();
  }, []);

  useEffect(() => {
    if (open && editingAssignment) {
      console.log("Editing assignment:", editingAssignment);
      setFormData({
        subject: editingAssignment.subject || "",
        subsubject: editingAssignment.subsubject || "",
        teacher: editingAssignment.teacher || "",
        description: editingAssignment.description || "",
        submission_method: editingAssignment.submission_method || "",
        dueDate: editingAssignment.dueDate || "",
      });
      if (editingAssignment.dueDate) {
        // ISO形式の日付をローカル時刻として解釈（タイムゾーンのずれを防ぐ）
        const dateStr = editingAssignment.dueDate.split('T')[0]; // "2025-01-15"
        const [year, month, day] = dateStr.split('-').map(Number);
        setSelectedDate(new Date(year, month - 1, day));
      }
    } else if (open && !editingAssignment) {
      setFormData({
        subject: "",
        subsubject: "",
        teacher: "",
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
      // ローカル日付をISO形式の日付文字列に変換（タイムゾーンのずれを防ぐ）
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}T00:00:00`;
      setFormData({ ...formData, dueDate: dateString });
      setIsCalendarOpen(false);
    }
  };

  const handleSubmit = () => {
    if (
      !formData.subject ||
      !formData.subsubject ||
      !formData.teacher ||
      !formData.description ||
      !formData.submission_method ||
      !formData.dueDate
    ) {
      toast.error("すべての項目を入力してください");
      return;
    }

    // Pass data to parent component for handling Supabase insertion
    onSave(formData);

    // Reset form
    setFormData({
      subject: "",
      subsubject: "",
      teacher: "",
      description: "",
      submission_method: "",
      dueDate: "",
    });
    setSelectedDate(undefined);

    onClose();
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

              {/* Teacher - 入力欄に変更済み */}
              <div className="space-y-2.5">
                <Label className="text-sm text-foreground">
                  先生（担当者） <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.teacher}
                  onChange={(e) =>
                    setFormData({ ...formData, teacher: e.target.value })
                  }
                  placeholder="例: 山田太郎"
                  className="h-12 rounded-xl border-2 border-border bg-white px-4 hover:border-primary/50 focus:border-primary transition-colors"
                />
              </div>

              {/* Description (詳細内容) - 📌 ここを修正 */}
              <div className="space-y-2.5">
                <Label className="text-sm text-foreground">
                  内容
                </Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="例: 10ページから12ページまで"
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
                    <span className="text-foreground">{(() => {
                      // ISO形式の日付をローカル時刻として解釈
                      const dateStr = formData.dueDate.split('T')[0];
                      const [year, month, day] = dateStr.split('-').map(Number);
                      const localDate = new Date(year, month - 1, day);
                      return localDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
                    })()}</span>
                  ) : (
                    <span className="text-muted-foreground">日付を選択してください</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer - Fixed at Bottom */}
          <div className="sticky bottom-0 bg-white border-t border-border px-5 py-4 flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-12 rounded-xl border-2 border-border text-foreground hover:bg-muted transition-colors"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              // 📌 修正: 濃い色 (bg-gray-800) に戻し、サイズと右寄せを維持
              className="h-12 rounded-xl bg-gray-800 text-white hover:bg-gray-900 shadow-lg shadow-black/25 transition-all"
              disabled={
                !formData.subject ||
                !formData.subsubject ||
                !formData.teacher ||
                !formData.description ||
                !formData.submission_method ||
                !formData.dueDate
              }
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