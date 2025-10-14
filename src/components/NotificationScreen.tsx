import { Bell, List, Calendar, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useNotifications } from "../hooks/useNotifications";

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

export function NotificationScreen() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);
  const { notifications, otherNotices, totalCount, loading, error } = useNotifications(userId);

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][today.getDay()];

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      const id = await getUserIdByEmail(user.email);
      setUserId(id);
    };
    fetchUserId();
  }, [navigate]);

  const getDaysText = (days: number) => {
    if (days === 0) return "今日締切";
    if (days === 1) return "明日締切";
    return `${days}日後`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">エラー: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-center max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-xl text-[#7B9FE8]" style={{ fontWeight: 600 }}>
              通知
            </h1>
            <p className="text-xs text-muted-foreground">
              {dateStr}({dayOfWeek})
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="w-full max-w-full px-4 py-4 space-y-6">
          {/* Assignment and Test Notifications */}
          <div className="space-y-3">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              提出物・テスト
            </h2>
            {notifications.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-border text-center">
                <p className="text-muted-foreground text-sm">
                  通知はありません
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-2xl p-4 shadow-sm w-full max-w-full cursor-pointer hover:shadow-md transition-shadow ${
                    notification.isUrgent
                      ? "border-2 border-destructive bg-red-50"
                      : "border border-border bg-white"
                  }`}
                  onClick={() => navigate(`/detail/${notification.id}`)}
                >
                  <div className="flex gap-3 w-full max-w-full min-w-0">
                    {/* Left Color Bar */}
                    <div
                      className="w-1 rounded-full shrink-0"
                      style={{ backgroundColor: notification.subjectColor }}
                    ></div>

                    {/* Card Content */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      {/* Top: Days Until */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-lg shrink-0 ${
                              notification.isUrgent ? "text-destructive" : "text-foreground"
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            {getDaysText(notification.daysUntil)}
                          </span>
                          {notification.isUrgent && (
                            <Badge
                              variant="destructive"
                              className="text-xs px-2 py-0.5 rounded-full shrink-0"
                            >
                              締切間近
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Middle: Subject & Title */}
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span
                          className="text-sm px-2.5 py-1 rounded-lg text-white whitespace-nowrap shrink-0"
                          style={{ backgroundColor: notification.subjectColor, fontWeight: 500 }}
                        >
                          {notification.subject}
                        </span>
                        <span className="text-base break-words" style={{ fontWeight: 500 }}>
                          {notification.title}
                        </span>
                        <span className="text-base text-muted-foreground">
                          {notification.type === "test" ? "テスト" : "提出物"}
                        </span>
                      </div>

                      {/* Content */}
                      {notification.description && (
                        <p className="text-base text-foreground break-words" style={{ fontWeight: 500 }}>
                          {notification.description}
                        </p>
                      )}

                      {/* Due Date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="whitespace-nowrap">📅 {notification.dueDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Other Notices Section */}
          <div className="space-y-3">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              その他
            </h2>
            {otherNotices.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-border text-center">
                <p className="text-muted-foreground text-sm">
                  3日以内のお知らせはありません
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {otherNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className="bg-white rounded-2xl p-4 border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-1 h-16 rounded-full shrink-0"
                        style={{ backgroundColor: notice.categoryColor }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="inline-block px-2.5 py-1 rounded-lg text-white text-sm"
                            style={{
                              backgroundColor: notice.categoryColor,
                              fontWeight: 500,
                            }}
                          >
                            {notice.category}
                          </span>
                          <span className="text-base break-words" style={{ fontWeight: 600 }}>
                            {notice.title}
                          </span>
                        </div>
                        {notice.content && (
                          <p className="text-sm mb-2 break-words text-muted-foreground">
                            {notice.content}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span>{notice.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              onClick={() => navigate("/calendar")}
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-2 gap-1"
            >
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">スケジュール</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-col h-auto py-2 gap-1">
              <Bell className="h-5 w-5 text-primary" />
              <span className="text-xs text-primary">通知</span>
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
    </div>
  );
}
