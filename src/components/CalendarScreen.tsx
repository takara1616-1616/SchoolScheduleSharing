import { Check, Plus, List, Calendar as CalendarIcon, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { ScheduleEntryModal } from "./ScheduleEntryModal";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";
import { SUBJECT_COLORS } from "../constants/colors";
import { NotificationBadge } from "./NotificationBadge";
import { useNotifications } from "../hooks/useNotifications";

interface Assignment {
  id: number;
  subject: string;
  subjectColor: string;
  teacher?: string;
  description: string;
  deadline: string;
  deadlineDate: Date;
  submission_method: string;
  isCompleted: boolean;
}

interface ScheduleEntry {
  id?: number; // schedule id from database
  date: string; // "10/27"
  timeSlot: number; // 1-7
  subject: string; // 教科
  course: string; // 科目
  subjectColor: string;
  memo: string;
}

const weekDays = ["月", "火", "水", "木", "金", "土", "日"];

// Generate week dates based on selected date
const generateWeekDates = (selectedDate: Date) => {
  const dates = [];

  // Get the Monday of the week containing the selected date
  const dayOfWeek = selectedDate.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days, otherwise go to Monday
  const monday = new Date(selectedDate);
  monday.setDate(selectedDate.getDate() + diff);

  // Generate 7 days starting from Monday
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeekStr = weekDays[i];
    dates.push({
      dateStr: `${month}/${day}`,
      dayOfWeek: dayOfWeekStr,
      fullDate: date,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    });
  }

  return dates;
};

export function CalendarScreen() {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ date: string; slot: number } | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  // Fetch notification count
  const { totalCount: notificationCount } = useNotifications(userId);

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const id = await getUserIdByEmail(user.email);
        setUserId(id);
      }
    };
    initUser();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Utility function to get numeric user_id from users table by email
  const getUserIdByEmail = async (userEmail: string | undefined): Promise<number | null> => {
    if (!userEmail) {
      console.error("No email provided");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user_id:", error);
        return null;
      }

      if (!data) {
        console.error("User not found in users table for email:", userEmail);
        return null;
      }

      return data.id;
    } catch (err) {
      console.error("Exception in getUserIdByEmail:", err);
      return null;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    try {
      // Get numeric user_id from users table by email
      const userId = await getUserIdByEmail(user.email);
      if (!userId) {
        toast.error("ユーザー情報の取得に失敗しました");
        navigate('/home');
        return;
      }

      const userIdToUse = userId;

      // Fetch assignments (incomplete only)
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          description,
          type,
          due_date,
          submission_method,
          subjects ( name ),
          subsubjects ( name ),
          users!announcements_created_by_fkey ( name )
        `)
        .eq('type', 'assignment')
        .order('due_date', { ascending: true });

      if (announcementsError) throw announcementsError;

      const fetchedAssignments: Assignment[] = [];

      for (const announcement of announcementsData as any[]) {
        const subjectName = (Array.isArray(announcement.subjects) ? announcement.subjects[0]?.name : announcement.subjects?.name) || "";
        const subsubjectName = (Array.isArray(announcement.subsubjects) ? announcement.subsubjects[0]?.name : announcement.subsubjects?.name) || "";
        const teacherName = (Array.isArray(announcement.users) ? announcement.users[0]?.name : announcement.users?.name) || "";
        const displaySubject = subsubjectName ? `${subjectName} (${subsubjectName})` : subjectName;
        const subjectColor = SUBJECT_COLORS[subjectName] || "#7B9FE8";

        let deadlineFormatted = "";
        let deadlineDate = new Date();

        if (announcement.due_date) {
          deadlineDate = new Date(announcement.due_date);
          deadlineFormatted = deadlineDate.toLocaleDateString('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          }).replace(/\s/g, '');
        }

        // Check submission status using userIdToUse
        const { data: submissionData, error: submissionError } = await supabase
          .from('submissions')
          .select('status')
          .eq('announcement_id', announcement.id)
          .eq('user_id', userIdToUse)
          .single();

        if (submissionError && submissionError.code !== 'PGRST116') {
          console.error("Error fetching submission:", submissionError);
        }

        fetchedAssignments.push({
          id: announcement.id,
          subject: displaySubject,
          subjectColor: subjectColor,
          teacher: teacherName,
          description: announcement.description,
          deadline: deadlineFormatted,
          deadlineDate: deadlineDate,
          submission_method: announcement.submission_method,
          isCompleted: submissionData?.status === 'submitted',
        });
      }

      setAssignments(fetchedAssignments);

      // Fetch schedule entries using userIdToUse
      await fetchScheduleEntries(userIdToUse as any);

    } catch (err: any) {
      console.error("Error fetching data:", err);
      toast.error("データの取得中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleEntries = async (userId: number | string) => {
    try {
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('schedules')
        .select(`
          id,
          start_time,
          end_time,
          title,
          description,
          subjects ( name ),
          subsubjects ( name )
        `)
        .eq('user_id', userId);

      if (schedulesError) {
        console.error("Schedules error:", schedulesError);
        throw schedulesError;
      }

      const entries: ScheduleEntry[] = [];

      for (const schedule of schedulesData as any[]) {
        // Parse timestamp string directly without timezone conversion
        // Format: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS"
        const timeStr = schedule.start_time.replace('T', ' ');
        const [datePart, timePart] = timeStr.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour] = timePart.split(':').map(Number);

        const dateStr = `${month}/${day}`;

        console.log("📖 Reading schedule:", {
          id: schedule.id,
          start_time: schedule.start_time,
          parsedHour: hour,
          dateStr: dateStr,
        });

        // Convert hour to time slot (8:00-9:00 = slot 1, 9:00-10:00 = slot 2, etc.)
        // 1時間目: 8時, 2時間目: 9時, 3時間目: 10時, 4時間目: 11時, 5時間目: 13時, 6時間目: 14時
        let timeSlot = 7; // デフォルトは放課後
        if (hour === 8) {
          timeSlot = 1;
        } else if (hour === 9) {
          timeSlot = 2;
        } else if (hour === 10) {
          timeSlot = 3;
        } else if (hour === 11) {
          timeSlot = 4;
        } else if (hour === 13) {
          timeSlot = 5;
        } else if (hour === 14) {
          timeSlot = 6;
        } else {
          timeSlot = 7; // それ以外は放課後
        }

        console.log("➡️ Converted to slot:", timeSlot);

        const subjectName = (Array.isArray(schedule.subjects) ? schedule.subjects[0]?.name : schedule.subjects?.name) || "";
        const subsubjectName = (Array.isArray(schedule.subsubjects) ? schedule.subsubjects[0]?.name : schedule.subsubjects?.name) || "";
        const subjectColor = SUBJECT_COLORS[subjectName] || "#7B9FE8";

        entries.push({
          id: schedule.id,
          date: dateStr,
          timeSlot: timeSlot,
          subject: subjectName,
          course: subsubjectName || schedule.title,
          subjectColor: subjectColor,
          memo: schedule.description,
        });
      }

      setScheduleEntries(entries);
    } catch (err: any) {
      console.error("Error fetching schedules:", err);
      toast.error("スケジュールの取得に失敗しました");
    }
  };

  const weekDates = generateWeekDates(date || new Date());
  const timeSlots = [1, 2, 3, 4, 5, 6, 7]; // 7 = 放課後

  // Filter out completed assignments
  const incompleteAssignments = assignments.filter(a => !a.isCompleted);
  const incompleteCount = incompleteAssignments.length;

  const getScheduleEntry = (dateStr: string, slot: number) => {
    return scheduleEntries.find(
      (entry) => entry.date === dateStr && entry.timeSlot === slot
    );
  };

  const handleCellClick = (dateStr: string, slot: number) => {
    setSelectedCell({ date: dateStr, slot });
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (entry: { subject: string; course: string; subjectColor: string; memo: string }) => {
    if (!selectedCell) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Get numeric user_id by email
      const userId = await getUserIdByEmail(user.email);
      if (!userId) {
        toast.error("ユーザー情報の取得に失敗しました");
        return;
      }
      const userIdToUse = userId;

      // Check if this is a delete operation
      if (!entry.course && !entry.memo.trim()) {
        const existingEntry = getScheduleEntry(selectedCell.date, selectedCell.slot);
        if (existingEntry?.id) {
          // Delete using schedule ID
          const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', existingEntry.id);

          if (error) throw error;

          await fetchScheduleEntries(userIdToUse as any);
          toast.success("スケジュールを削除しました");
        }
        return;
      }

      // Parse date string "10/27" to create datetime
      const [month, day] = selectedCell.date.split('/').map(Number);
      const year = new Date().getFullYear();

      console.log("🔍 Saving schedule:", {
        selectedSlot: selectedCell.slot,
        slotType: typeof selectedCell.slot,
        date: selectedCell.date,
      });

      // Calculate start hour based on slot
      // 1時間目: 8時, 2時間目: 9時, 3時間目: 10時, 4時間目: 11時, 5時間目: 13時, 6時間目: 14時, 放課後: 15時
      let startHour: number;
      if (selectedCell.slot === 1) {
        startHour = 8;
      } else if (selectedCell.slot === 2) {
        startHour = 9;
      } else if (selectedCell.slot === 3) {
        startHour = 10;
      } else if (selectedCell.slot === 4) {
        startHour = 11;
      } else if (selectedCell.slot === 5) {
        startHour = 13;
      } else if (selectedCell.slot === 6) {
        startHour = 14;
      } else { // slot 7 (放課後)
        startHour = 15;
      }

      console.log("⏰ Calculated startHour:", startHour);

      // Create timestamp strings without timezone conversion
      // Format: YYYY-MM-DD HH:MM:SS
      const startTimeStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(startHour).padStart(2, '0')}:00:00`;
      const endTimeStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(startHour + 1).padStart(2, '0')}:00:00`;

      console.log("📅 Times:", {
        startTime: startTimeStr,
        endTime: endTimeStr,
      });

      // Find subject_id from course name
      const { data: subsubjects } = await supabase
        .from('subsubjects')
        .select('id, subject_id')
        .eq('name', entry.course)
        .single();

      const scheduleData = {
        user_id: userIdToUse as any,
        subject_id: subsubjects?.subject_id || null,
        subsubject_id: subsubjects?.id || null,
        location_id: null,
        title: entry.course || 'メモ',
        description: entry.memo,
        start_time: startTimeStr,
        end_time: endTimeStr,
      };

      // Check if schedule already exists for this time slot
      const existingEntry = getScheduleEntry(selectedCell.date, selectedCell.slot);

      if (existingEntry?.id) {
        // Update existing schedule using its ID
        const { error } = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', existingEntry.id);

        if (error) throw error;
      } else {
        // Insert new schedule
        const { error } = await supabase
          .from('schedules')
          .insert(scheduleData);

        if (error) throw error;
      }

      // Refresh schedule entries
      await fetchScheduleEntries(userIdToUse as any);
      toast.success("スケジュールを保存しました");
    } catch (err: any) {
      console.error("Error saving schedule:", err);
      toast.error("スケジュールの保存中にエラーが発生しました");
    }
  };

  const handleToggleAssignment = async (id: number, currentStatus: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Get numeric user_id by email
      const userId = await getUserIdByEmail(user.email);
      if (!userId) {
        toast.error("ユーザー情報の取得に失敗しました");
        return;
      }
      const userIdToUse = userId;

      const newStatus = currentStatus ? 'pending' : 'submitted';

      // Check if submission already exists
      const { data: existingSubmission } = await supabase
        .from('submissions')
        .select('id')
        .eq('announcement_id', id)
        .eq('user_id', userIdToUse)
        .maybeSingle();

      let error;
      if (existingSubmission) {
        // Update existing submission
        const result = await supabase
          .from('submissions')
          .update({
            status: newStatus,
            submitted_at: newStatus === 'submitted' ? new Date().toISOString() : null,
          })
          .eq('announcement_id', id)
          .eq('user_id', userIdToUse);
        error = result.error;
      } else {
        // Insert new submission
        const result = await supabase
          .from('submissions')
          .insert({
            announcement_id: id,
            user_id: userIdToUse as any,
            status: newStatus,
            submitted_at: newStatus === 'submitted' ? new Date().toISOString() : null,
          });
        error = result.error;
      }

      if (error) {
        console.error("Error updating submission status:", error);
        toast.error("提出状況の更新中にエラーが発生しました");
      } else {
        setAssignments((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isCompleted: !currentStatus } : item))
        );
        toast.success(newStatus === 'submitted' ? "提出完了 よくできました" : "未提出に変更");
      }
    } catch (err: any) {
      console.error("Error toggling assignment:", err);
      toast.error("提出状況の更新中にエラーが発生しました");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-center px-4 py-3">
          <h1 className="text-2xl text-primary" style={{ fontWeight: 600 }}>
            スケジュール
          </h1>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-131px)]">
        <div className="p-4 space-y-4">
          {/* Top Row: Incomplete Assignments & Calendar */}
          <div className="flex gap-4 items-start">
            {/* Left Column: Incomplete Assignments (Compact) */}
            <div className="flex-1 space-y-2">
              {/* Status Header */}
              <div className="flex items-center gap-1.5 text-sm">
                <span style={{ fontWeight: 500 }}>📣 未提出</span>
                <span className="text-primary" style={{ fontWeight: 600 }}>
                  {incompleteCount}件
                </span>
              </div>

              {/* Assignments List - Compact */}
              <div className="space-y-2">
                {incompleteAssignments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">未提出の課題はありません</p>
                ) : (
                  incompleteAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-xl p-2 shadow-sm border border-border bg-white w-full max-w-full"
                    >
                      <div className="flex gap-1.5 w-full max-w-full min-w-0">
                        {/* Left Color Bar */}
                        <div
                          className="w-0.5 rounded-full shrink-0"
                          style={{ backgroundColor: assignment.subjectColor }}
                        ></div>

                        {/* Card Content */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Top: Deadline */}
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-sm text-foreground shrink-0" style={{ fontWeight: 600 }}>
                              {assignment.deadline}
                            </span>
                          </div>

                          {/* Middle: Subject, Teacher */}
                          <div className="flex items-center gap-1 flex-wrap text-xs">
                            <span
                              className="px-1.5 py-0.5 rounded text-white whitespace-nowrap"
                              style={{ backgroundColor: assignment.subjectColor, fontWeight: 500 }}
                            >
                              {assignment.subject}
                            </span>
                            {assignment.teacher && (
                              <span style={{ fontWeight: 500 }}>
                                {assignment.teacher}
                              </span>
                            )}
                          </div>

                          {/* Content */}
                          {assignment.description && (
                            <div className="text-xs text-foreground" style={{ fontWeight: 500 }}>
                              {assignment.description}
                            </div>
                          )}

                          {/* Submit To */}
                          {assignment.submission_method && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="whitespace-nowrap">📤 {assignment.submission_method}</span>
                            </div>
                          )}
                        </div>

                        {/* Right: Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAssignment(assignment.id, assignment.isCompleted);
                          }}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 self-start transition-colors ${
                            assignment.isCompleted
                              ? "bg-green-500 border-green-500"
                              : "bg-white border-muted-foreground/30 hover:border-primary"
                          }`}
                        >
                          {assignment.isCompleted && (
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Mini Calendar */}
            <div className="w-[280px] shrink-0">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-border sticky top-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  weekStartsOn={1}
                  className="rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Weekly Schedule - Always shown below */}
          <div id="weekly-schedule" className="scroll-mt-20">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg" style={{ fontWeight: 600 }}>
                週間スケジュール
                {date && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({weekDates[0].dateStr} - {weekDates[6].dateStr})
                  </span>
                )}
              </h2>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              {/* Horizontal Scroll Container */}
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Date Headers */}
                  <div className="flex border-b border-border">
                    {/* Empty corner cell */}
                    <div className="w-12 border-r border-border shrink-0"></div>

                    {/* Date cells */}
                    {weekDates.map((date, idx) => (
                      <div
                        key={idx}
                        className="flex-1 min-w-[100px] px-3 py-2 border-r border-border last:border-r-0"
                        style={{
                          backgroundColor: date.isWeekend
                            ? date.dayOfWeek === "土"
                              ? "#E8F4FD"
                              : "#FFE8F0"
                            : "white",
                        }}
                      >
                        <div className="text-center">
                          <div className="text-sm" style={{ fontWeight: 500 }}>
                            {date.dateStr}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {date.dayOfWeek}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Time Slots */}
                  {timeSlots.map((slot) => (
                    <div key={slot} className="flex border-b border-border last:border-b-0">
                      {/* Time slot label */}
                      <div className="w-12 border-r border-border shrink-0 flex items-center justify-center py-3">
                        <span className="text-sm text-muted-foreground">
                          {slot === 7 ? "放課後" : slot}
                        </span>
                      </div>

                      {/* Date cells */}
                      {weekDates.map((date, idx) => {
                        const scheduleEntry = getScheduleEntry(date.dateStr, slot);

                        return (
                          <div
                            key={idx}
                            onClick={() => handleCellClick(date.dateStr, slot)}
                            className="flex-1 min-w-[100px] px-2 py-2 border-r border-border last:border-r-0 min-h-[80px] cursor-pointer hover:bg-muted/30 transition-colors relative group"
                            style={{
                              backgroundColor: date.isWeekend
                                ? date.dayOfWeek === "土"
                                  ? "#E8F4FD"
                                  : "#FFE8F0"
                                : "white",
                            }}
                          >
                            {scheduleEntry ? (
                              <div className="h-full flex flex-col gap-1">
                                {/* 科目名 - 上段に小さく表示 */}
                                {scheduleEntry.course && (
                                  <div
                                    className="text-xs px-1.5 py-0.5 rounded inline-block self-start"
                                    style={{
                                      backgroundColor: scheduleEntry.subjectColor,
                                      color: "white",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {scheduleEntry.course}
                                  </div>
                                )}

                                {/* メモ欄 - 下段に複数行表示 */}
                                {scheduleEntry.memo && (
                                  <div className="text-xs text-foreground whitespace-pre-wrap break-words leading-relaxed">
                                    {scheduleEntry.memo}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={() => navigate("/home")}
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-2 gap-1"
            >
              <List className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">お知らせ</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-2 gap-1"
            >
              <CalendarIcon className="h-5 w-5 text-primary" />
              <span className="text-xs text-primary">スケジュール</span>
            </Button>
            <Button
              onClick={() => navigate("/notifications")}
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-2 gap-1"
            >
              <NotificationBadge count={notificationCount} />
              <span className="text-xs text-muted-foreground">通知</span>
            </Button>
            <Button
              onClick={() => navigate("/history")}
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-2 gap-1"
            >
              <FileCheck className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">履歴</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Schedule Entry Modal */}
      <ScheduleEntryModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCell(null);
        }}
        onSave={handleSaveEntry}
        initialData={
          selectedCell
            ? getScheduleEntry(selectedCell.date, selectedCell.slot)
            : undefined
        }
        dateStr={selectedCell?.date || ""}
        timeSlot={selectedCell?.slot || 1}
      />
    </div>
  );
}
