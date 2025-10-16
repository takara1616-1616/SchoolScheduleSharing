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
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1時間後まで拡張

        console.log('🔔 Checking reminders...', {
          userId,
          now: now.toISOString(),
          oneHourFromNow: oneHourFromNow.toISOString()
        });

        // Fetch reminders that should trigger within the next hour (拡張)
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
          .lte('remind_at', oneHourFromNow.toISOString()); // 過去も含めて取得

        console.log('📋 Fetched reminders:', { count: reminders?.length || 0, reminders });

        if (error) {
          console.error('Error fetching reminders:', error);
          return;
        }

        for (const reminder of reminders || []) {
          const remindAt = new Date(reminder.remind_at);
          console.log('⏰ Checking reminder:', {
            id: reminder.id,
            remindAt: remindAt.toISOString(),
            now: now.toISOString(),
            shouldNotify: remindAt <= now,
            alreadyNotified: notifiedRemindersRef.current.has(reminder.id)
          });

          // Check if it's time to show the notification
          if (remindAt <= now) {
            // Skip if already notified in this session
            if (notifiedRemindersRef.current.has(reminder.id)) {
              console.log('⏭️ Skipping already notified reminder (in session):', reminder.id);
              continue;
            }

            console.log('✅ Showing notification for reminder:', reminder.id);

            // Show notification with delete callback
            showNotification(reminder, async () => {
              // Delete reminder when user clicks "確認"
              const { error: deleteError } = await supabase
                .from('reminders')
                .delete()
                .eq('id', reminder.id);

              if (deleteError) {
                console.error('❌ Error deleting reminder:', {
                  error: deleteError,
                  message: deleteError.message,
                  details: deleteError.details,
                  hint: deleteError.hint,
                  code: deleteError.code,
                  reminderId: reminder.id
                });
              } else {
                console.log('✅ Deleted reminder from DB after confirmation:', reminder.id);
              }
            });

            notifiedRemindersRef.current.add(reminder.id);
          }
        }
      } catch (err) {
        console.error('Error checking reminders:', err);
      }
    };

    // Initial check
    checkReminders();

    // Set up interval to check every 30 seconds (頻度を上げる)
    checkIntervalRef.current = setInterval(checkReminders, 30 * 1000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [userId]);

  const showNotification = (reminder: ReminderNotification, onConfirm?: () => void) => {
    let title = '';
    let body = '';
    let icon = '🔔';

    console.log('📢 showNotification called:', reminder);

    if (reminder.announcement_id && reminder.announcements) {
      const announcement = Array.isArray(reminder.announcements)
        ? reminder.announcements[0]
        : reminder.announcements;

      console.log('📌 Processing announcement:', announcement);

      if (announcement) {
        const subjectName = (Array.isArray(announcement.subjects)
          ? announcement.subjects[0]?.name
          : announcement.subjects?.name) || "";
        const subsubjectName = (Array.isArray(announcement.subsubjects)
          ? announcement.subsubjects[0]?.name
          : announcement.subsubjects?.name) || "";
        const displaySubject = subsubjectName ? `${subjectName} (${subsubjectName})` : subjectName;

        // 期限をフォーマット
        let deadlineText = '';
        if (announcement.due_date) {
          const dateStr = announcement.due_date.split('T')[0];
          const [year, month, day] = dateStr.split('-').map(Number);
          const dueDate = new Date(year, month - 1, day);
          deadlineText = dueDate.toLocaleDateString('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          });
        }

        if (announcement.type === 'assignment') {
          icon = '📝';
          title = `提出物リマインダー: ${displaySubject}`;
          const description = announcement.description || announcement.title || '提出期限が近づいています';
          body = `${description}${deadlineText ? `\n📅 期限: ${deadlineText}` : ''}`;
        } else if (announcement.type === 'test') {
          icon = '📖';
          title = `テストリマインダー: ${displaySubject}`;
          const description = announcement.description || announcement.title || 'テストが近づいています';
          body = `${description}${deadlineText ? `\n📅 試験日: ${deadlineText}` : ''}`;
        } else if (announcement.type === 'general_notice') {
          icon = '📢';
          title = `お知らせ: ${announcement.title || '連絡事項'}`;
          body = `${announcement.description || ''}${deadlineText ? `\n📅 ${deadlineText}` : ''}`;
        }
      }
    } else if (reminder.schedule_id && reminder.schedules) {
      const schedule = Array.isArray(reminder.schedules)
        ? reminder.schedules[0]
        : reminder.schedules;

      if (schedule) {
        icon = '📅';
        title = `スケジュールリマインダー: ${schedule.title}`;

        // スケジュールの開始時刻をフォーマット
        let startTimeText = '';
        if (schedule.start_time) {
          const startTime = new Date(schedule.start_time);
          startTimeText = startTime.toLocaleString('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        body = `${schedule.description || 'スケジュールが近づいています'}${startTimeText ? `\n📅 ${startTimeText}` : ''}`;
      }
    }

    console.log('🎯 Notification content:', { title, body, icon });

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      console.log('🌐 Showing browser notification');
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
    } else {
      console.log('🚫 Browser notification not available. Permission:',
        'Notification' in window ? Notification.permission : 'not supported');
    }

    // Also show toast notification (always show)
    console.log('🍞 Showing toast notification');
    toast(title, {
      description: body,
      icon: icon,
      duration: Infinity, // 確認するまでずっと表示
      action: {
        label: '確認',
        onClick: () => {
          if (onConfirm) {
            onConfirm();
          }
          toast.dismiss();
        },
      },
    });
  };

  return null;
};
