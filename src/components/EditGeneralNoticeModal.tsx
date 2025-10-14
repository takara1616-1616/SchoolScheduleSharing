// src/components/EditGeneralNoticeModal.tsx

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
// 💡 ScrollAreaは、DialogContentに max-h と overflow-y-auto を指定することで不要になるため削除

// HomeScreen.tsx で使用されている型定義 (Figma Make側のOtherNoticeのプロパティ名に合わせるため、一部修正)
interface GeneralNoticeItem {
  id: number;
  // 💡 subject (HomeScreen側) -> category (Figma側)
  subject: string; 
  // 💡 subjectColor (HomeScreen側) -> categoryColor (Figma側)
  subjectColor: string; 
  title: string;
  // 💡 description (HomeScreen側) -> content (Figma側)
  description: string;
  date: string;
}

interface EditGeneralNoticeModalProps {
  open: boolean;
  onClose: () => void;
  // 💡 型を GeneralNoticeItem[] で統一
  notices: GeneralNoticeItem[]; 
  onSelectNotice: (notice: GeneralNoticeItem) => void;
}

export function EditGeneralNoticeModal({ open, onClose, notices, onSelectNotice }: EditGeneralNoticeModalProps) {

  const handleSelect = (notice: GeneralNoticeItem) => {
    onSelectNotice(notice);
    // 💡 選択したらモーダルを閉じるロジックを反映
    onClose(); 
  };

  // 💡 Figma Make側のコードに合わせ、DialogContentのスタイルを修正
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[90vw] sm:max-w-md max-h-[85vh] overflow-y-auto w-full p-0"
      >
        <DialogHeader className="px-6 pt-6 pb-2"> 
          <DialogTitle className="text-base sm:text-lg">編集するお知らせを選択</DialogTitle>
          <DialogDescription className="sr-only">
            編集したいお知らせを下のリストから選択してください
          </DialogDescription>
        </DialogHeader>

        {/* リスト部分: max-h-[85vh] と overflow-y-auto により、ScrollAreaは不要 */}
        <div className="space-y-3 py-4 px-6 w-full max-w-full">
          {notices.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              お知らせがありません
            </p>
          ) : (
            notices.map((notice) => (
              // 💡 Figma Makeのデザインに合わせ、リストアイテムをbuttonタグに変更
              <button
                key={notice.id}
                onClick={() => handleSelect(notice)}
                className="w-full max-w-full text-left bg-white rounded-xl p-3 border-2 border-border hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <div className="flex items-center gap-2 mb-2 w-full max-w-full min-w-0">
                  <div
                    className="w-1 h-8 rounded-full shrink-0"
                    // 💡 subjectColor を使用
                    style={{ backgroundColor: notice.subjectColor }} 
                  ></div>
                  <span
                    className="text-sm px-2 py-1 rounded text-white shrink-0"
                    style={{
                      // 💡 subjectColor を使用
                      backgroundColor: notice.subjectColor,
                      fontWeight: 500,
                    }}
                  >
                    {/* 💡 subject (HomeScreen側) を表示 */}
                    {notice.subject} 
                  </span>
                  <span className="text-sm flex-1 min-w-0 break-words overflow-hidden" style={{ fontWeight: 500 }}>
                    {notice.title || notice.description.substring(0, 30) + '...'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground px-2 break-words">
                  日付: {notice.date}
                </div>
              </button>
            ))
          )}
        </div>
        
        {/* Footer */}
        <DialogFooter className="px-6 pt-2 pb-4 border-t border-border flex justify-end">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="text-sm rounded-xl h-10"
          >
            キャンセル
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}