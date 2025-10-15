import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface ReminderNotification {
  id: number;
  announcement_id: number | null;
  schedule_id: number | null;
  remind_at: string;
  announcements?: any;
  schedules?: any;
}

export const useReminderNotifications = (userId: number | null) => {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedRemindersRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!userId) return;

    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check reminders every minute
    const checkReminders = async () => {
      try {
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        // Fetch reminders that should trigger within the next 5 minutes
        const { data: reminders, error } = await supabase
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
              subjects ( name )
            )
          `)
          .eq('user_id', userId)
          .gte('remind_at', now.toISOString())
          .lte('remind_at', fiveMinutesFromNow.toISOString());

        if (error) {
          console.error('Error fetching reminders:', error);
          return;
        }

        for (const reminder of reminders || []) {
          // Skip if already notified
          if (notifiedRemindersRef.current.has(reminder.id)) continue;

          const remindAt = new Date(reminder.remind_at);

          // Check if it's time to show the notification
          if (remindAt <= now) {
            showNotification(reminder);
            notifiedRemindersRef.current.add(reminder.id);
          }
        }
      } catch (err) {
        console.error('Error checking reminders:', err);
      }
    };

    // Initial check
    checkReminders();

    // Set up interval to check every minute
    checkIntervalRef.current = setInterval(checkReminders, 60 * 1000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [userId]);

  const showNotification = (reminder: ReminderNotification) => {
    let title = '';
    let body = '';
    let icon = '🔔';

    if (reminder.announcement_id && reminder.announcements) {
      const announcement = Array.isArray(reminder.announcements)
        ? reminder.announcements[0]
        : reminder.announcements;

      if (announcement) {
        const subjectName = (Array.isArray(announcement.subjects)
          ? announcement.subjects[0]?.name
          : announcement.subjects?.name) || "";
        const subsubjectName = (Array.isArray(announcement.subsubjects)
          ? announcement.subsubjects[0]?.name
          : announcement.subsubjects?.name) || "";
        const displaySubject = subsubjectName ? `${subjectName} (${subsubjectName})` : subjectName;

        if (announcement.type === 'assignment') {
          icon = '📝';
          title = `提出物リマインダー: ${displaySubject}`;
          body = announcement.description || '提出期限が近づいています';
        } else if (announcement.type === 'test') {
          icon = '📖';
          title = `テストリマインダー: ${displaySubject}`;
          body = announcement.description || 'テストが近づいています';
        }
      }
    } else if (reminder.schedule_id && reminder.schedules) {
      const schedule = Array.isArray(reminder.schedules)
        ? reminder.schedules[0]
        : reminder.schedules;

      if (schedule) {
        icon = '📅';
        title = `スケジュールリマインダー: ${schedule.title}`;
        body = schedule.description || 'スケジュールが近づいています';
      }
    }

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon.png', // Add your app icon path here
        tag: `reminder-${reminder.id}`,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }

    // Also show toast notification
    toast(title, {
      description: body,
      icon: icon,
      duration: 10000,
      action: {
        label: '確認',
        onClick: () => {},
      },
    });
  };

  return null;
};
