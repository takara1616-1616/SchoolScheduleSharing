import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit } from "lucide-react";
import { SUBJECT_COLORS } from "../constants/colors";

interface TestRange {
  id: number;
  subject: string;
  subjectColor: string;
  description: string;
  deadline: string;
  isCompleted: boolean;
}

interface EditTestRangeModalProps {
  open: boolean;
  onClose: () => void;
  tests: TestRange[];
  onSelectTest: (test: TestRange) => void;
}

export function EditTestRangeModal({ open, onClose, tests, onSelectTest }: EditTestRangeModalProps) {
  const handleSelect = (test: TestRange) => {
    onSelectTest(test);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>編集するテストを選択</DialogTitle>
          <DialogDescription>
            編集したいテスト範囲を選んでください。
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="px-6 py-4 space-y-3">
            {tests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                テスト範囲がありません
              </div>
            ) : (
              tests.map((test) => (
                <button
                  key={test.id}
                  onClick={() => handleSelect(test)}
                  className="w-full rounded-2xl p-4 shadow-sm border border-border bg-white hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex gap-3 w-full">
                    {/* Left Color Bar */}
                    <div
                      className="w-1 rounded-full shrink-0"
                      style={{ backgroundColor: test.subjectColor }}
                    ></div>

                    {/* Card Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Top: Test Date */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-base text-foreground" style={{ fontWeight: 600 }}>
                          試験日: {test.deadline}
                        </span>
                        <Edit className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>

                      {/* Middle: Subject */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm px-2.5 py-1 rounded-lg text-white whitespace-nowrap"
                          style={{ backgroundColor: test.subjectColor, fontWeight: 500 }}
                        >
                          {test.subject}
                        </span>
                      </div>

                      {/* Content */}
                      {test.description && (
                        <p className="text-sm text-muted-foreground break-words whitespace-pre-line line-clamp-2">
                          {test.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            キャンセル
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
