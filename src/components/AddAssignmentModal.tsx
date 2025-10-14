import { useState, useEffect } from "react";
import { X, CalendarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { toast } from "sonner";

interface Assignment {
  subject: string;
  subjectColor: string;
  course: string;
  content: string;
  submitTo: string;
  deadline: string;
}

interface AddAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (assignment: any) => void;  // Flexible type to work with both HomeScreen and TeacherScreen
  editingAssignment?: any;
}

const subjects = [
  { name: "国語", color: "#FF9F9F" },
  { name: "数学", color: "#7B9FE8" },
  { name: "英語", color: "#FFD6A5" },
  { name: "理科", color: "#A8E8D8" },
  { name: "社会", color: "#B8A8E8" },
];

const courses = [
  "現代の国語",
  "言語文化",
  "論理国語",
  "文学国語",
  "数学I",
  "数学II",
  "数学A",
  "数学B",
  "英語コミュニケーションI",
  "英語コミュニケーションII",
  "論理・表現I",
  "論理・表現II",
  "物理基礎",
  "化学基礎",
  "生物基礎",
  "地学基礎",
  "地理総合",
  "歴史総合",
  "公共",
];

const teachers = [
  "田中先生",
  "佐藤先生",
  "鈴木先生",
  "山田先生",
  "中村先生",
  "小林先生",
  "その他",
];

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
  const [formData, setFormData] = useState({
    subject: editingAssignment?.subject || "",
    course: editingAssignment?.course || "",
    content: editingAssignment?.content || "",
    submitTo: editingAssignment?.submitTo || "",
    deadline: editingAssignment?.deadline || "",
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (open && editingAssignment) {
      setFormData({
        subject: editingAssignment.subject,
        course: editingAssignment.course,
        content: editingAssignment.content,
        submitTo: editingAssignment.submitTo,
        deadline: editingAssignment.deadline,
      });
    } else if (open) {
      setFormData({
        subject: "",
        course: "",
        content: "",
        submitTo: "",
        deadline: "",
      });
      setSelectedDate(undefined);
    }
  }, [open, editingAssignment]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
      const weekday = weekdays[date.getDay()];
      const dateString = `${month}月${day}日(${weekday})`;
      setFormData({ ...formData, deadline: dateString });
      setIsCalendarOpen(false);
    }
  };

  const handleSubmit = () => {
    if (
      !formData.subject ||
      !formData.course ||
      !formData.content ||
      !formData.submitTo ||
      !formData.deadline
    ) {
      toast.error("すべての項目を入力してください");
      return;
    }

    const subjectData = subjects.find((s) => s.name === formData.subject);

    onSave({
      subject: formData.subject,
      subjectColor: subjectData?.color || "#D8D8D8",
      course: formData.course,
      content: formData.content,
      submitTo: formData.submitTo,
      deadline: formData.deadline,
    });

    // Reset form
    setFormData({
      subject: "",
      course: "",
      content: "",
      submitTo: "",
      deadline: "",
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
                      <SelectItem key={subject.name} value={subject.name} className="rounded-lg">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          {subject.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Course */}
              <div className="space-y-2.5">
                <Label className="text-sm text-foreground">
                  科目 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.course}
                  onValueChange={(value) =>
                    setFormData({ ...formData, course: value })
                  }
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 border-border bg-white hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {courses.map((course) => (
                      <SelectItem key={course} value={course} className="rounded-lg">
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content */}
              <div className="space-y-2.5">
                <Label className="text-sm text-foreground">
                  内容 <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="例:漢字ドリルP68"
                  className="h-12 rounded-xl border-2 border-border bg-white px-4 hover:border-primary/50 focus:border-primary transition-colors"
                />
              </div>

              {/* Submit Method */}
              <div className="space-y-2.5">
                <Label className="text-sm text-foreground">
                  提出方法 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.submitTo}
                  onValueChange={(value) =>
                    setFormData({ ...formData, submitTo: value })
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
                  {formData.deadline ? (
                    <span className="text-foreground">{formData.deadline}</span>
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
