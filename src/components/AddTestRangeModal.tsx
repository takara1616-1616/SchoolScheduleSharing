import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";
import { Tables } from "../types/supabase";
import { SUBJECT_COLORS } from "../constants/colors";

interface TestRangeData {
  subject: string;
  subsubject: string;
  title: string;
  description: string;
  testDate: Date | undefined;
}

interface AddTestRangeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (testRange: Omit<TestRangeData, "testDate"> & { testDate: string }) => void;
  initialData?: {
    subject: string;
    subsubject: string;
    title: string;
    description: string;
    testDate: string;
  };
}

export function AddTestRangeModal({ open, onClose, onSave, initialData }: AddTestRangeModalProps) {
  const [subject, setSubject] = useState("");
  const [subsubject, setSubsubject] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [testDate, setTestDate] = useState<Date | undefined>(undefined);

  const [subjects, setSubjects] = useState<Tables<'subjects'>['Row'][]>([]);
  const [subsubjects, setSubsubjects] = useState<Tables<'subsubjects'>['Row'][]>([]);

  useEffect(() => {
    const fetchMasterData = async () => {
      // 教科の取得
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name');
      if (subjectsError) console.error("Error fetching subjects:", subjectsError);
      else setSubjects(subjectsData || []);

      // 科目の取得
      const { data: subsubjectsData, error: subsubjectsError } = await supabase
        .from('subsubjects')
        .select('id, subject_id, name');
      if (subsubjectsError) console.error("Error fetching subsubjects:", subsubjectsError);
      else setSubsubjects(subsubjectsData || []);
    };

    fetchMasterData();
  }, []);

  useEffect(() => {
    if (open && initialData) {
      setSubject(initialData.subject);
      setSubsubject(initialData.subsubject);
      setTitle(initialData.title);
      setContent(initialData.description);
      if (initialData.testDate) {
        setTestDate(new Date(initialData.testDate));
      }
    } else if (open) {
      setSubject("");
      setSubsubject("");
      setTitle("");
      setContent("");
      setTestDate(undefined);
    }
  }, [open, initialData]);

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    setSubsubject(""); // 教科が変わったら科目をリセット
  };

  const handleSave = async () => {
    if (!subject || !subsubject || !title || !content || !testDate) {
      toast.error("すべての項目を入力してください");
      return;
    }

    const selectedSubject = subjects.find(s => s.name === subject);
    const selectedSubsubject = subsubjects.find(ss => ss.name === subsubject);

    if (!selectedSubject || !selectedSubsubject) {
      toast.error("選択された教科または科目が見つかりません。");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("ユーザーが認証されていません。");
      return;
    }

    // Get the user's internal ID from USERS table
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('ms_account_id', user.id)
      .single();

    const newAnnouncement: Tables<'announcements'>['Insert'] = {
      subject_id: selectedSubject.id,
      subsubject_id: selectedSubsubject.id,
      created_by: userData?.id || null,
      title: title,
      description: content,
      type: "test",
      due_date: testDate.toISOString(),
      submission_method: "", // テスト範囲には提出方法がないため空
    };

    const { error } = await supabase.from('announcements').insert(newAnnouncement);

    if (error) {
      console.error("Error adding test range:", error);
      toast.error("テスト範囲の登録中にエラーが発生しました。");
    } else {
      toast.success("テスト範囲を登録しました。");
      onSave({
        subject,
        subsubject,
        title,
        description: content,
        testDate: testDate.toISOString(),
      });
      handleClose();
    }
  };

  const handleClose = () => {
    if (!initialData) {
      setSubject("");
      setSubsubject("");
      setTitle("");
      setContent("");
      setTestDate(undefined);
    }
    onClose();
  };

  const filteredSubsubjects = subsubjects.filter(ss => ss.subject_id === subjects.find(s => s.name === subject)?.id);

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
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    <div className="flex items-center gap-2">
                      {/* <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: SUBJECT_COLORS[s.name] || "#D8D8D8" }}
                      /> */}
                      {s.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subsubject Selection */}
          <div className="space-y-2">
            <Label>科目</Label>
            <Select value={subsubject} onValueChange={setSubsubject} disabled={!subject}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue placeholder={subject ? "選択してください" : "先に教科を選択してください"} />
              </SelectTrigger>
              <SelectContent>
                {filteredSubsubjects.map((ss) => (
                  <SelectItem key={ss.id} value={ss.name}>
                    {ss.name}
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
              placeholder="例: 中間試験"
              className="rounded-lg bg-input-background"
            />
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
                <Button
                  variant={"outline"}
                  className="flex w-full items-center justify-start rounded-lg border border-border bg-input-background px-3 py-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {testDate ? format(testDate, "yyyy年M月d日(E)", { locale: ja }) : "日付を選択"}
                </Button>
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
            disabled={!subject || !subsubject || !title || !content || !testDate}
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
