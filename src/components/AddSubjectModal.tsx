import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Plus, Trash2 } from "lucide-react";

export interface SubjectRow {
  id: string;
  category: string;
  categoryColor: string;
  courseName: string;
}

interface AddSubjectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (subjects: Omit<SubjectRow, "id">[]) => void | Promise<void>;
}

const categoryOptions = [
  { value: "国語", color: "#FF9F9F" },
  { value: "数学", color: "#7B9FE8" },
  { value: "英語", color: "#FFD6A5" },
  { value: "理科", color: "#A8E8D8" },
  { value: "社会", color: "#B8A8E8" },
  { value: "保健体育", color: "#FFA8C8" },
  { value: "芸術", color: "#E8D8A8" },
  { value: "家庭", color: "#D8E8A8" },
  { value: "情報", color: "#A8D8E8" },
  { value: "専門教科", color: "#E8A8D8" },
  { value: "その他", color: "#D8D8D8" },
];

export function AddSubjectModal({ open, onClose, onSave }: AddSubjectModalProps) {
  const [rows, setRows] = useState<SubjectRow[]>([
    { id: "1", category: "", categoryColor: "", courseName: "" },
  ]);

  /**
   * 新しい行を追加する（教科・科目追加ボタンの機能）
   */
  const handleAddRow = () => {
    const newId = (Math.max(...rows.map((r) => parseInt(r.id)), 0) + 1).toString();
    setRows([...rows, { id: newId, category: "", categoryColor: "", courseName: "" }]);
  };

  /**
   * 行を削除する
   */
  const handleRemoveRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  /**
   * 教科の選択変更を処理し、色を更新する
   */
  const handleCategoryChange = (id: string, category: string) => {
    const color = categoryOptions.find((opt) => opt.value === category)?.color || "";
    setRows(
      rows.map((row) =>
        row.id === id ? { ...row, category, categoryColor: color } : row
      )
    );
  };

  /**
   * 科目名の入力を処理する
   */
  const handleCourseNameChange = (id: string, courseName: string) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, courseName } : row))
    );
  };

  /**
   * データを保存する
   */
  const handleSave = () => {
    // 教科と科目名が両方入力されている行のみを抽出
    const validRows = rows.filter((row) => row.category && row.courseName.trim() !== "");
    
    if (validRows.length > 0) {
      // IDを除外してonSaveコールバックに渡す
      onSave(validRows.map(({ category, categoryColor, courseName }) => ({
        category,
        categoryColor,
        courseName: courseName.trim(), // 保存時に空白をトリム
      })));
      handleClose();
    }
  };

  /**
   * モーダルを閉じる処理（状態をリセット）
   */
  const handleClose = () => {
    setRows([{ id: "1", category: "", categoryColor: "", courseName: "" }]);
    onClose();
  };
  
  // 修正された保存ボタンのdisabled判定ロジック:
  // 有効な入力 (教科が選択され、かつ科目名が空でない) が一つでもあれば false (非活性化しない)
  const isSaveDisabled = !rows.some(row => row.category && row.courseName.trim() !== "");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>教科・科目を追加</DialogTitle>
          <DialogDescription>
            複数の教科・科目を一括で追加できます。教科を選択し、科目名を入力してください。
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(80vh-180px)]">
          <div className="px-6 py-4">
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, width: "30%" }}>
                      教科
                    </th>
                    <th className="px-4 py-3 text-left text-sm" style={{ fontWeight: 600, width: "60%" }}>
                      科目
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
                        <Select
                          value={row.category}
                          onValueChange={(value) => handleCategoryChange(row.id, value)}
                        >
                          <SelectTrigger className="w-full h-9 rounded-lg">
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
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={row.courseName}
                          onChange={(e) => handleCourseNameChange(row.id, e.target.value)}
                          placeholder="科目名を入力"
                          className="h-9 rounded-lg bg-input-background"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRow(row.id)}
                          // 行が1つの場合は削除ボタンを非活性化
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
            disabled={isSaveDisabled} // 修正されたロジックを適用
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}