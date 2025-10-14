import { Bell } from "lucide-react";

interface NotificationBadgeProps {
  count: number;
  isActive?: boolean;
}

export function NotificationBadge({ count, isActive = false }: NotificationBadgeProps) {
  return (
    <div className="relative">
      <Bell className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center"
          style={{ fontWeight: 600 }}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
}
