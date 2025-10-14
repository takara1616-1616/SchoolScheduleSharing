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
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface OtherNoticeData {
  title: string;
  content: string;
  category: string;
  categoryColor: string;
  date: string;
}

interface AddOtherNoticeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (notice: OtherNoticeData) => void;
  initialData?: OtherNoticeData & { id: string };
}

const categoryOptions = [
  { value: "行事", color: "#FFA8C8" },
  { value: "連絡事項", color: "#A8D8E8" },
  { value: "持ち物", color: "#FFE8A8" },
  { value: "お知らせ", color: "#C8D8FF" },
  { value: "その他", color: "#D8D8D8" },
];

export function AddOtherNoticeModal({ open, onClose, onSave, initialData }: AddOtherNoticeModalProps) {
  const [category, setCategory] = useState("");
  const [categoryColor, setCategoryColor] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noticeDate, setNoticeDate] = useState<Date | undefined>(undefined);

  const handleCategoryChange = (value: string) => {
    const categoryData = categoryOptions.find((opt) => opt.value === value);
    setCategory(value);
    setCategoryColor(categoryData?.color || "");
  };

  const handleSave = () => {
    if (category && title && content && noticeDate) {
      onSave({
        title,
        content,
        category,
        categoryColor,
        date: format(noticeDate, "M月d日(E)", { locale: ja }),
      });
      handleClose();
    }
  };

  const handleClose = () => {
    if (!initialData) {
      setCategory("");
      setCategoryColor("");
      setTitle("");
      setContent("");
      setNoticeDate(undefined);
    }
    onClose();
  };

  useEffect(() => {
    if (open && initialData) {
      setCategory(initialData.category);
      setCategoryColor(initialData.categoryColor);
      setTitle(initialData.title);
      setContent(initialData.content);
      
      // Parse the date string (e.g., "6月20日(土)")
      try {
        const dateMatch = initialData.date.match(/(\d+)月(\d+)日/);
        if (dateMatch) {
          const month = parseInt(dateMatch[1]);
          const day = parseInt(dateMatch[2]);
          const year = new Date().getFullYear();
          setNoticeDate(new Date(year, month - 1, day));
        }
      } catch (error) {
        console.error("Error parsing date:", error);
      }
    } else if (open && !initialData) {
      setCategory("");
      setCategoryColor("");
      setTitle("");
      setContent("");
      setNoticeDate(undefined);
    }
  }, [open, initialData]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0" aria-describedby="other-notice-description">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>{initialData ? "その他のお知らせを編集" : "その他のお知らせを追加"}</DialogTitle>
          <DialogDescription id="other-notice-description">
            カテゴリー、タイトル、内容、日付を入力してください。
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label>カテゴリー</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
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

          {/* Title */}
          <div className="space-y-2">
            <Label>タイトル</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 体育祭について"
              className="rounded-lg bg-input-background"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>内容</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="例: 6月20日(土)に体育祭を実施します。雨天の場合は翌日に順延となります。"
              className="rounded-lg bg-input-background min-h-[100px]"
            />
          </div>

          {/* Notice Date */}
          <div className="space-y-2">
            <Label>日付</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex w-full items-center justify-start rounded-lg border border-border bg-input-background px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {noticeDate ? format(noticeDate, "M月d日(E)", { locale: ja }) : "日付を選択"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={noticeDate}
                  onSelect={setNoticeDate}
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
            disabled={!category || !title || !content || !noticeDate}
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
