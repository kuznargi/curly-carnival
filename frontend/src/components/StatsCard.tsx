import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export const StatsCard = ({ icon: Icon, iconColor, iconBgColor, title, value, change, changeType = 'positive' }: StatsCardProps) => {
  const changeColorClass = {
    positive: 'text-green-600 dark:text-green-500',
    negative: 'text-red-600 dark:text-red-500',
    neutral: 'text-muted-foreground'
  }[changeType];

  return (
    <div className="bg-card rounded-xl border p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className={`w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>

          {change && (
            <p className={`text-xs font-medium ${changeColorClass}`}>
              {change}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
