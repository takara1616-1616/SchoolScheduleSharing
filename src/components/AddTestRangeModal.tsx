import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { ja } from "date-fns/locale";

interface TestRangeData {
  subject: string;
  subjectColor: string;
  course: string;
  content: string;
  testDate: Date | undefined;
}

interface AddTestRangeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (testRange: any) => void;  // Flexible type to work with different parent components
  initialData?: any;
}

const subjectOptions = [
  { value: "国語", color: "#FF9F9F", courses: ["現代の国語", "言語文化", "論理国語", "文学国語", "国語表現", "古典探究"] },
  { value: "数学", color: "#7B9FE8", courses: ["数学I", "数学II", "数学III", "数学A", "数学B", "数学C"] },
  { value: "英語", color: "#FFD6A5", courses: ["英語コミュニケーションI", "英語コミュニケーションII", "英語コミュニケーションIII", "論理・表現I", "論理・表現II", "論理・表現III"] },
  { value: "理科", color: "#A8E8D8", courses: ["物理基礎", "物理", "化学基礎", "化学", "生物基礎", "生物", "地学基礎", "地学"] },
  { value: "社会", color: "#B8A8E8", courses: ["地理総合", "地理探究", "歴史総合", "日本史探究", "世界史探究", "公共", "倫理", "政治・経済"] },
  { value: "保健体育", color: "#FFA8C8", courses: ["体育", "保健"] },
  { value: "芸術", color: "#E8D8A8", courses: ["音楽I", "音楽II", "音楽III", "美術I", "美術II", "美術III", "工芸I", "工芸II", "工芸III", "書道I", "書道II", "書道III"] },
  { value: "家庭", color: "#D8E8A8", courses: ["家庭基礎", "家庭総合"] },
  { value: "情報", color: "#A8D8E8", courses: ["情報I", "情報II"] },
];

export function AddTestRangeModal({ open, onClose, onSave, initialData }: AddTestRangeModalProps) {
  const [subject, setSubject] = useState("");
  const [subjectColor, setSubjectColor] = useState("");
  const [course, setCourse] = useState("");
  const [content, setContent] = useState("");
  const [testDate, setTestDate] = useState<Date | undefined>(undefined);

  const selectedSubjectData = subjectOptions.find((opt) => opt.value === subject);
  const availableCourses = selectedSubjectData?.courses || [];

  const handleSubjectChange = (value: string) => {
    const subjectData = subjectOptions.find((opt) => opt.value === value);
    setSubject(value);
    setSubjectColor(subjectData?.color || "");
    setCourse(""); // Reset course when subject changes
  };

  const handleSave = () => {
    if (subject && course && content && testDate) {
      onSave({
        subject,
        subjectColor,
        course,
        content,
        testDate: format(testDate, "M月d日(E)", { locale: ja }),
      });
      handleClose();
    }
  };

  const handleClose = () => {
    if (!initialData) {
      setSubject("");
      setSubjectColor("");
      setCourse("");
      setContent("");
      setTestDate(undefined);
    }
    onClose();
  };

  useEffect(() => {
    if (open && initialData) {
      console.log("Editing test range - initialData:", initialData);
      setSubject(initialData.subject || "");
      setSubjectColor(initialData.subjectColor || "");
      setCourse(initialData.course || "");
      setContent(initialData.content || "");

      // Parse the date string
      try {
        if (initialData.testDate && typeof initialData.testDate === 'string') {
          // Check if it's an ISO format date (e.g., "2025-01-15T00:00:00.000Z")
          if (initialData.testDate.includes('-') && initialData.testDate.includes('T')) {
            // ISO形式の日付をローカル時刻として解釈（タイムゾーンのずれを防ぐ）
            const dateStr = initialData.testDate.split('T')[0]; // "2025-01-15"
            const [year, month, day] = dateStr.split('-').map(Number);
            setTestDate(new Date(year, month - 1, day));
          } else {
            // Parse Japanese format (e.g., "6月12日(土)")
            const dateMatch = initialData.testDate.match(/(\d+)月(\d+)日/);
            if (dateMatch) {
              const month = parseInt(dateMatch[1]);
              const day = parseInt(dateMatch[2]);
              const year = new Date().getFullYear();
              setTestDate(new Date(year, month - 1, day));
            }
          }
        }
      } catch (error) {
        console.error("Error parsing date:", error);
      }
    } else if (open && !initialData) {
      setSubject("");
      setSubjectColor("");
      setCourse("");
      setContent("");
      setTestDate(undefined);
    }
  }, [open, initialData]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>{initialData ? "テスト範囲を編集" : "テスト範囲を追加"}</DialogTitle>
          <DialogDescription>
            テストの教科・科目、範囲、日程を入力してください。
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Subject Selection */}
          <div className="space-y-2">
            <Label>教科</Label>
            <Select value={subject} onValueChange={handleSubjectChange}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: option.color }}
                      />
                      {option.value}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Selection */}
          <div className="space-y-2">
            <Label>科目</Label>
            <Select value={course} onValueChange={setCourse} disabled={!subject}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue placeholder={subject ? "選択してください" : "先に教科を選択してください"} />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.map((courseName) => (
                  <SelectItem key={courseName} value={courseName}>
                    {courseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Range Content */}
          <div className="space-y-2">
            <Label>テスト範囲</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="例: 教科書 P2~10 / ワークブック P2~10"
              className="rounded-lg bg-input-background min-h-[100px]"
            />
          </div>

          {/* Test Date */}
          <div className="space-y-2">
            <Label>テスト日</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex w-full items-center justify-start rounded-lg border border-border bg-input-background px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {testDate ? format(testDate, "M月d日(E)", { locale: ja }) : "日付を選択"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={testDate}
                  onSelect={setTestDate}
                  initialFocus
                  locale={ja}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} className="rounded-xl">
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!subject || !course || !content || !testDate}
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
