// src/components/AddGeneralNoticeModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react"; 
import { format } from "date-fns";
import { useState, useEffect } from "react"; // 💡 useEffect をインポート
import { cn } from "@/lib/utils"; 
import { ja } from 'date-fns/locale'; 
import { toast } from "sonner"; 

// 💡 編集時のデータを扱うためのインターフェースを追加
interface GeneralNoticeData {
  title: string;
  description: string;
  date: Date | undefined; // Dateオブジェクトのまま渡すことを想定
}

interface AddGeneralNoticeModalProps {
  open: boolean;
  onClose: () => void;
  // 💡 onSaveの引数を GeneralNoticeData に統一
  onSave: (data: GeneralNoticeData) => void; 
  // 💡 編集対象データ (initialData) を追加
  initialData?: GeneralNoticeData & { id: string }; 
}

export function AddGeneralNoticeModal({ open, onClose, onSave, initialData }: AddGeneralNoticeModalProps) {
  const [description, setDescription] = useState(""); 
  const [date, setDate] = useState<Date | undefined>(undefined); // 💡 初期値を undefined に変更
  
  // 💡 編集用ロジック: initialData が変更またはモーダルが開いたときに実行
  useEffect(() => {
    if (open && initialData) {
      // 編集モードの場合、初期値で状態をセット
      setDescription(initialData.description);
      setDate(initialData.date);
    } else if (open && !initialData) {
      // 新規作成モードでモーダルが開いた場合、初期化
      setDescription("");
      setDate(new Date()); // 新規作成時は今日の日付をデフォルトにする
    }
  }, [open, initialData]);

  const handleClose = () => {
    // 💡 閉じる処理のみ実行（状態のリセットは useEffect が担当）
    onClose();
  }
  
  const handleSave = () => {
    // 💡 バリデーションチェック
    if (!description.trim() || !date) {
      toast.error("内容と日付を入力してください。");
      return;
    }
    
    // タイトルは内容の最初の50文字を使用
    const title = description.trim().split('\n')[0].substring(0, 50);

    onSave({ title, description, date });
    
    // 💡 成功メッセージを編集/登録に応じて表示
    toast.success(initialData ? "お知らせを更新しました。" : "お知らせを登録しました。"); 
    
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          {/* 💡 編集モードに応じてタイトルを変更 */}
          <DialogTitle>{initialData ? "お知らせを編集" : "その他のお知らせを追加"}</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-4 space-y-5">
          
          {/* 📌 内容 (Textarea) - デザイン統一 */}
          <div className="space-y-2.5">
            <Label htmlFor="description" className="text-sm text-foreground">内容 (500字まで) <span className="text-destructive">*</span></Label>
            <Textarea
              id="description"
              placeholder="時間割変更、教室移動の連絡など"
              value={description}
              onChange={(e) => setDescription(e.target.value.substring(0, 500))}
              rows={5}
              className="rounded-xl border-2 border-border bg-white p-4 hover:border-primary/50 focus:border-primary transition-colors resize-none min-h-[120px]"
            />
          </div>

          {/* 📌 日付 (Calendar) - デザイン統一 */}
          <div className="space-y-2.5">
            <Label htmlFor="date" className="text-sm text-foreground">日付 <span className="text-destructive">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal rounded-xl border-2 border-border bg-white hover:border-primary/50 transition-colors px-4",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2.5 h-5 w-5 shrink-0 text-primary" />
                  {date ? format(date, "yyyy年MM月dd日 (E)", { locale: ja }) : <span>日付を選択</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={ja}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Footer - ボタンデザインと右寄せを反映 */}
        <DialogFooter className="px-6 py-4 border-t border-border flex gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={handleClose}
            // 📌 コンパクトサイズ (h-12, flex-1なし)
            className="h-12 rounded-xl border-2 border-border text-foreground hover:bg-muted transition-colors"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            // 📌 濃いグレー (bg-gray-800) とコンパクトサイズを反映
            className="h-12 rounded-xl bg-gray-800 text-white hover:bg-gray-900 shadow-lg shadow-black/25 transition-all"
            disabled={!description.trim() || !date} 
          >
            {/* 💡 編集モードに応じてボタンのテキストを変更 */}
            {initialData ? "更新" : "登録"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}