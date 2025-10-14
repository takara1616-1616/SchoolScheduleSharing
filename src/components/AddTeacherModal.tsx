import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface AddTeacherModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (teachers: Omit<Teacher, "id">[]) => void;
}

interface Teacher {
  id: string;
  name: string;
  subjects: string[];
  email: string;
}

interface SubjectSection {
  tempId: string;
  subject: string;
  subjectColor: string;
  teacherNames: string[];
}

const availableSubjects = [
  { value: "国語", color: "#FF9F9F" },
  { value: "数学", color: "#7B9FE8" },
  { value: "英語", color: "#FFD6A5" },
  { value: "理科", color: "#A8E8D8" },
  { value: "社会", color: "#B8A8E8" },
  { value: "保健体育", color: "#FFA8C8" },
  { value: "芸術", color: "#FFB8E8" },
  { value: "家庭", color: "#FFE8A8" },
  { value: "情報", color: "#C8D8FF" },
  { value: "その他", color: "#D8D8D8" },
];

export function AddTeacherModal({ open, onClose, onSave }: AddTeacherModalProps) {
  const [sections, setSections] = useState<SubjectSection[]>([
    { tempId: "1", subject: "", subjectColor: "", teacherNames: [""] },
  ]);

  const handleAddSection = () => {
    const newId = (Math.max(...sections.map((s) => parseInt(s.tempId)), 0) + 1).toString();
    setSections([...sections, { tempId: newId, subject: "", subjectColor: "", teacherNames: [""] }]);
  };

  const handleRemoveSection = (tempId: string) => {
    if (sections.length > 1) {
      setSections(sections.filter((s) => s.tempId !== tempId));
    }
  };

  const handleSubjectChange = (tempId: string, subject: string) => {
    const color = availableSubjects.find((s) => s.value === subject)?.color || "";
    setSections(
      sections.map((s) => (s.tempId === tempId ? { ...s, subject, subjectColor: color } : s))
    );
  };

  const handleAddTeacherName = (tempId: string) => {
    setSections(
      sections.map((s) =>
        s.tempId === tempId ? { ...s, teacherNames: [...s.teacherNames, ""] } : s
      )
    );
  };

  const handleRemoveTeacherName = (tempId: string, index: number) => {
    setSections(
      sections.map((s) => {
        if (s.tempId === tempId && s.teacherNames.length > 1) {
          const newNames = s.teacherNames.filter((_, i) => i !== index);
          return { ...s, teacherNames: newNames };
        }
        return s;
      })
    );
  };

  const handleTeacherNameChange = (tempId: string, index: number, name: string) => {
    setSections(
      sections.map((s) => {
        if (s.tempId === tempId) {
          const newNames = [...s.teacherNames];
          newNames[index] = name;
          return { ...s, teacherNames: newNames };
        }
        return s;
      })
    );
  };

  const handleSave = () => {
    // Convert sections to teachers
    const teachersToSave: Omit<Teacher, "id">[] = [];
    
    sections.forEach((section) => {
      if (section.subject) {
        section.teacherNames.forEach((name) => {
          if (name.trim() !== "") {
            teachersToSave.push({
              name: name.trim(),
              subjects: [section.subject],
              email: "",
            });
          }
        });
      }
    });

    if (teachersToSave.length === 0) return;

    onSave(teachersToSave);
    setSections([{ tempId: "1", subject: "", subjectColor: "", teacherNames: [""] }]);
    onClose();
  };

  const handleClose = () => {
    setSections([{ tempId: "1", subject: "", subjectColor: "", teacherNames: [""] }]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl" style={{ fontWeight: 600 }}>
              先生を追加
            </DialogTitle>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <DialogDescription>
            担当教科を選択し、その教科の先生を複数人追加できます。
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-180px)]">
          <div className="px-6 py-4 space-y-4">
            {sections.map((section, sectionIndex) => (
              <div
                key={section.tempId}
                className="p-4 bg-muted/30 rounded-xl space-y-3 relative"
              >
                {sections.length > 1 && (
                  <button
                    onClick={() => handleRemoveSection(section.tempId)}
                    className="absolute top-3 right-3 p-1.5 hover:bg-destructive/10 rounded-lg transition-colors group"
                    aria-label="教科セクションを削除"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
                  </button>
                )}

                <div className="space-y-2">
                  <Label htmlFor={`subject-${section.tempId}`}>
                    担当教科 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={section.subject}
                    onValueChange={(value) => handleSubjectChange(section.tempId, value)}
                  >
                    <SelectTrigger className="w-full h-10 rounded-lg bg-white">
                      <SelectValue placeholder="教科を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubjects.map((subject) => (
                        <SelectItem key={subject.value} value={subject.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: subject.color }}
                            />
                            {subject.value}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    先生の氏名 <span className="text-destructive">*</span>
                  </Label>
                  <div className="space-y-2">
                    {section.teacherNames.map((name, nameIndex) => (
                      <div key={nameIndex} className="flex gap-2">
                        <Input
                          value={name}
                          onChange={(e) =>
                            handleTeacherNameChange(section.tempId, nameIndex, e.target.value)
                          }
                          placeholder="例：田中 太郎"
                          className="h-10 rounded-lg bg-white flex-1"
                        />
                        {section.teacherNames.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTeacherName(section.tempId, nameIndex)}
                            className="h-10 w-10 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            aria-label="削除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-lg border-dashed"
                      onClick={() => handleAddTeacherName(section.tempId)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      先生を追加
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full rounded-xl border-dashed"
              onClick={handleAddSection}
            >
              <Plus className="w-4 h-4 mr-2" />
              別の教科を追加
            </Button>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} className="rounded-xl">
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={sections.every((s) => !s.subject || s.teacherNames.every((n) => n.trim() === ""))}
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
