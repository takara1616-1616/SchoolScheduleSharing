import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { SUBJECT_COLORS } from "../constants/colors";

interface Assignment {
  id: number;
  subject: string;
  subjectColor: string;
  teacher?: string;
  description: string;
  deadline: string;
  isUrgent?: boolean;
  isCompleted: boolean;
  submission_method: string;
}

interface EditAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  assignments: Assignment[];
  onSelectAssignment: (assignment: Assignment) => void;
}

export function EditAssignmentModal({
  open,
  onClose,
  assignments,
  onSelectAssignment,
}: EditAssignmentModalProps) {
  const handleSelect = (assignment: Assignment) => {
    onSelectAssignment(assignment);
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[85vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">編集する提出物を選択</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4 w-full max-w-full">
          {assignments.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              提出物がありません
            </p>
          ) : (
            assignments.map((assignment) => (
              <button
                key={assignment.id}
                onClick={() => handleSelect(assignment)}
                className="w-full max-w-full text-left bg-white rounded-xl p-3 border-2 border-border hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-2 mb-2 w-full max-w-full min-w-0">
                  <div
                    className="w-1 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: assignment.subjectColor }}
                  ></div>
                  <span
                    className="text-sm px-2 py-1 rounded text-white shrink-0"
                    style={{
                      backgroundColor: assignment.subjectColor,
                      fontWeight: 500,
                    }}
                  >
                    {assignment.subject}
                  </span>
                  <span className="text-sm flex-1 min-w-0 break-words overflow-hidden" style={{ fontWeight: 500 }}>
                    {assignment.description}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground px-2 break-words">
                  期限: {assignment.deadline}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="text-sm">
            キャンセル
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}