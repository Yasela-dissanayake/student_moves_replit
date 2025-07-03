import { useUserStatus } from '../hooks/use-user-status';

interface UserStatusIndicatorProps {
  userId: number;
  size?: 'sm' | 'md' | 'lg';
  showActivity?: boolean;
}

export function UserStatusIndicator({ userId, size = 'md', showActivity = false }: UserStatusIndicatorProps) {
  const { getUserStatus } = useUserStatus();
  const userStatus = getUserStatus(userId);

  if (!userStatus) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400'
  };

  return (
    <div className="flex items-center gap-1">
      <div className={`rounded-full ${sizeClasses[size]} ${statusColors[userStatus.status]}`} />
      {showActivity && userStatus.activity && (
        <span className="text-xs text-gray-600 truncate max-w-20">
          {userStatus.activity}
        </span>
      )}
    </div>
  );
}