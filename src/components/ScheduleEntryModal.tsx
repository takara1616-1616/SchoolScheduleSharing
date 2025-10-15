import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUBJECT_COLORS } from "@/constants/colors";

interface ScheduleEntry {
  subject: string; // 教科
  course: string; // 科目
  subjectColor: string;
  memo: string;
}

interface ScheduleEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: ScheduleEntry) => void;
  initialData?: ScheduleEntry;
  dateStr: string;
  timeSlot: number | string;
}

// 科目リスト（教科別に色分け）
const courses = [
  // 国語
  { name: "現代の国語", category: "国語" },
  { name: "言語文化", category: "国語" },
  { name: "論理国語", category: "国語" },
  { name: "文学国語", category: "国語" },
  { name: "国語表現", category: "国語" },
  { name: "古典探究", category: "国語" },
  // 数学
  { name: "数学I", category: "数学" },
  { name: "数学II", category: "数学" },
  { name: "数学III", category: "数学" },
  { name: "数学A", category: "数学" },
  { name: "数学B", category: "数学" },
  { name: "数学C", category: "数学" },
  // 英語
  { name: "英語コミュニケーションI", category: "英語" },
  { name: "英語コミュニケーションII", category: "英語" },
  { name: "英語コミュニケーションIII", category: "英語" },
  { name: "論理・表現I", category: "英語" },
  { name: "論理・表現II", category: "英語" },
  { name: "論理・表現III", category: "英語" },
  // 理科
  { name: "物理基礎", category: "理科" },
  { name: "物理", category: "理科" },
  { name: "化学基礎", category: "理科" },
  { name: "化学", category: "理科" },
  { name: "生物基礎", category: "理科" },
  { name: "生物", category: "理科" },
  { name: "地学基礎", category: "理科" },
  { name: "地学", category: "理科" },
  // 社会
  { name: "地理総合", category: "社会" },
  { name: "地理探究", category: "社会" },
  { name: "歴史総合", category: "社会" },
  { name: "日本史探究", category: "社会" },
  { name: "世界史探究", category: "社会" },
  { name: "公共", category: "社会" },
  { name: "倫理", category: "社会" },
  { name: "政治・経済", category: "社会" },
  // 保健体育
  { name: "体育", category: "保健体育" },
  { name: "保健", category: "保健体育" },
  // 芸術
  { name: "音楽I", category: "芸術" },
  { name: "音楽II", category: "芸術" },
  { name: "音楽III", category: "芸術" },
  { name: "美術I", category: "芸術" },
  { name: "美術II", category: "芸術" },
  { name: "美術III", category: "芸術" },
  { name: "工芸I", category: "芸術" },
  { name: "工芸II", category: "芸術" },
  { name: "工芸III", category: "芸術" },
  { name: "書道I", category: "芸術" },
  { name: "書道II", category: "芸術" },
  { name: "書道III", category: "芸術" },
  // 家庭
  { name: "家庭基礎", category: "家庭" },
  { name: "家庭総合", category: "家庭" },
  // 情報
  { name: "情報I", category: "情報" },
  { name: "情報II", category: "情報" },
  // その他
  { name: "総合的な探究の時間", category: "その他" },
  { name: "LHR", category: "その他" },
  { name: "特別活動", category: "その他" },
];

export function ScheduleEntryModal({
  open,
  onClose,
  onSave,
  initialData,
  dateStr,
  timeSlot,
}: ScheduleEntryModalProps) {
  const [course, setCourse] = useState(initialData?.course || "");
  const [memo, setMemo] = useState(initialData?.memo || "");

  useEffect(() => {
    if (open) {
      setCourse(initialData?.course || "");
      setMemo(initialData?.memo || "");
    }
  }, [open, initialData]);

  const handleSave = () => {
    // 科目とメモの両方が空の場合は保存しない
    if (!course && !memo.trim()) return;

    const selectedCourse = courses.find((c) => c.name === course);
    const category = selectedCourse?.category || "";
    onSave({
      subject: category,
      course: course || "",
      subjectColor: SUBJECT_COLORS[category] || "#7B9FE8",
      memo,
    });
    onClose();
  };

  const handleDelete = () => {
    onSave({
      subject: "",
      course: "",
      subjectColor: "",
      memo: "",
    });
    onClose();
  };

  const handleClear = () => {
    setCourse("");
    setMemo("");
  };

  if (!open) return null;

  const timeSlotLabel = typeof timeSlot === 'number' && timeSlot === 7 ? "放課後" : `${timeSlot}時間目`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl" style={{ fontWeight: 600 }}>
              スケジュール編集
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {dateStr} {timeSlotLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label>科目</Label>
            <Select value={course} onValueChange={setCourse}>
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder="科目を選択" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((courseItem) => (
                  <SelectItem key={courseItem.name} value={courseItem.name}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: SUBJECT_COLORS[courseItem.category] || "#7B9FE8" }}
                      />
                      {courseItem.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <Label>メモ</Label>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="授業内容、持ち物、課題など..."
              className="min-h-[120px] rounded-xl resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 flex gap-3 rounded-b-2xl">
          {initialData && (initialData.course || initialData.memo) && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="rounded-xl text-destructive hover:text-destructive"
            >
              削除
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!course && !memo.trim()}
            className="rounded-xl"
          >
            消去
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={!course && !memo.trim()}
            className="rounded-xl bg-primary hover:bg-primary/90"
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
