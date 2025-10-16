// AddStudentModal.tsx

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Plus, Trash2 } from "lucide-react";

interface StudentRow {
  id: string;
  name: string;
  email: string;
  class: string;
}

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (students: Omit<StudentRow, "id">[]) => void;
}

export function AddStudentModal({ open, onClose, onSave }: AddStudentModalProps) {
  const [rows, setRows] = useState<StudentRow[]>([
    { id: "1", name: "", email: "", class: "" },
  ]);

  const handleAddRow = () => {
    const newId = (Math.max(...rows.map((r) => parseInt(r.id)), 0) + 1).toString();
    setRows([...rows, { id: newId, name: "", email: "", class: "" }]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const handleChange = (id: string, field: keyof StudentRow, value: string) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  const handleSave = () => {
    const validRows = rows.filter((row) => row.name.trim() !== "" && row.email.trim() !== "");

    if (validRows.length > 0) {
      onSave(validRows.map(({ name, email, class: studentClass }) => ({
        name: name.trim(),
        email: email.trim(),
        class: studentClass.trim(),
      })));
      handleClose();
    }
  };

  const handleClose = () => {
    setRows([{ id: "1", name: "", email: "", class: "" }]);
    onClose();
  };

  const isSaveDisabled = !rows.some(row => row.name.trim() !== "" && row.email.trim() !== "");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>生徒名簿を追加</DialogTitle>
          <DialogDescription>
            複数の生徒を一括で追加できます。氏名、メールアドレス、クラスを入力してください。
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-180px)]">
          <div className="px-6 py-4">
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, width: "35%" }}>
                      氏名
                    </th>
                    <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, width: "35%" }}>
                      メールアドレス
                    </th>
                    <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, width: "20%" }}>
                      クラス
                    </th>
                    <th className="px-4 py-3 text-center text-sm" style={{ fontWeight: 600, width: "10%" }}>
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <Input
                          value={row.name}
                          onChange={(e) => handleChange(row.id, "name", e.target.value)}
                          placeholder="氏名を入力"
                          className="h-9 rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={row.email}
                          onChange={(e) => handleChange(row.id, "email", e.target.value)}
                          placeholder="メールアドレスを入力"
                          type="email"
                          className="h-9 rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={row.class}
                          onChange={(e) => handleChange(row.id, "class", e.target.value)}
                          placeholder="A組"
                          className="h-9 rounded-lg"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={rows.length === 1}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <Button
                variant="outline"
                onClick={handleAddRow}
                className="w-full rounded-xl border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                行を追加
              </Button>
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} className="rounded-xl">
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSaveDisabled}
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}