import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { SUBJECT_COLORS } from '../constants/colors';

export interface NotificationItem {
  id: number;
  type: 'assignment' | 'test';
  subject: string;
  subjectColor: string;
  title: string;
  description: string;
  dueDate: string;
  dueDateObj: Date;
  daysUntil: number;
  isUrgent: boolean;
  reminderId?: number;
}

export interface OtherNotice {
  id: number;
  title: string;
  content: string;
  category: string;
  categoryColor: string;
  date: string;
  dateObj: Date;
  reminderId?: number;
}

export interface NotificationData {
  notifications: NotificationItem[];
  otherNotices: OtherNotice[];
  totalCount: number;
  loading: boolean;
  error: string | null;
}

// Helper function to calculate days until due date
const calculateDaysUntil = (dueDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to check if date is within 3 days
const isWithinThreeDays = (date: Date): boolean => {
  const daysUntil = calculateDaysUntil(date);
  return daysUntil >= 0 && daysUntil <= 3;
};

export const useNotifications = (userId: number | null) => {
  const [data, setData] = useState<NotificationData>({
    notifications: [],
    otherNotices: [],
    totalCount: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setData({
        notifications: [],
        otherNotices: [],
        totalCount: 0,
        loading: false,
        error: null,
      });
      return;
    }

    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch reminders for this user with announcement/schedule data
      const { data: reminders, error: remindersError } = await supabase
        .from('reminders')
        .select(`
          id,
          announcement_id,
          schedule_id,
          remind_at,
          announcements (
            id,
            title,
            description,
            type,
            due_date,
            subjects ( name ),
            subsubjects ( name )
          ),
          schedules (
            id,
            title,
            description,
            start_time,
            end_time,
            subjects ( name ),
            subsubjects ( name )
          )
        `)
        .or(`user_id.eq.${userId},class_id.is.null`)
        .order('remind_at', { ascending: true });

      if (remindersError) throw remindersError;

      const notifications: NotificationItem[] = [];
      const otherNotices: OtherNotice[] = [];
      const now = new Date();

      for (const reminder of reminders || []) {
        const remindAt = new Date(reminder.remind_at);

        // Only show reminders within 3 days
        if (!isWithinThreeDays(remindAt)) continue;

        // Process announcement-based reminders
        if (reminder.announcement_id && reminder.announcements) {
          const announcement = Array.isArray(reminder.announcements)
            ? reminder.announcements[0]
            : reminder.announcements;

          if (!announcement || !announcement.due_date) continue;

          const dueDate = new Date(announcement.due_date);
          const daysUntil = calculateDaysUntil(dueDate);

          // Check if assignment is completed
          if (announcement.type === 'assignment') {
            const { data: submission } = await supabase
              .from('submissions')
              .select('status')
              .eq('announcement_id', announcement.id)
              .eq('user_id', userId)
              .maybeSingle();

            // Skip completed assignments
            if (submission?.status === 'submitted') continue;
          }

          const subjectName = (Array.isArray(announcement.subjects)
            ? (announcement.subjects as any)[0]?.name
            : (announcement.subjects as any)?.name) || "";
          const subsubjectName = (Array.isArray(announcement.subsubjects)
            ? (announcement.subsubjects as any)[0]?.name
            : (announcement.subsubjects as any)?.name) || "";
          const displaySubject = subsubjectName ? `${subjectName} (${subsubjectName})` : subjectName;
          const subjectColor = SUBJECT_COLORS[subjectName] || "#7B9FE8";

          const deadlineFormatted = dueDate.toLocaleDateString('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          });

          notifications.push({
            id: announcement.id,
            type: announcement.type as 'assignment' | 'test',
            subject: displaySubject,
            subjectColor,
            title: announcement.title,
            description: announcement.description,
            dueDate: deadlineFormatted,
            dueDateObj: dueDate,
            daysUntil,
            isUrgent: daysUntil <= 1,
            reminderId: reminder.id,
          });
        }

        // Process schedule-based reminders
        if (reminder.schedule_id && reminder.schedules) {
          const schedule = Array.isArray(reminder.schedules)
            ? reminder.schedules[0]
            : reminder.schedules;

          if (!schedule) continue;

          const startTime = new Date(schedule.start_time);
          const dateFormatted = startTime.toLocaleDateString('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          });

          const subjectName = (Array.isArray(schedule.subjects)
            ? (schedule.subjects as any)[0]?.name
            : (schedule.subjects as any)?.name) || "";

          otherNotices.push({
            id: schedule.id,
            title: schedule.title,
            content: schedule.description || "",
            category: "スケジュール",
            categoryColor: SUBJECT_COLORS[subjectName] || "#A8D8E8",
            date: dateFormatted,
            dateObj: startTime,
            reminderId: reminder.id,
          });
        }
      }

      // Sort notifications by daysUntil
      notifications.sort((a, b) => a.daysUntil - b.daysUntil);

      // Sort other notices by date
      otherNotices.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

      const totalCount = notifications.length + otherNotices.length;

      setData({
        notifications,
        otherNotices,
        totalCount,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'エラーが発生しました',
      }));
    }
  };

  return data;
};
