import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'orange' | 'green' | 'pink';
  subtitle?: string;
}

const colorClasses = {
  blue: {
    icon: 'text-blue-600 bg-blue-100',
    text: 'text-blue-600'
  },
  orange: {
    icon: 'text-orange-600 bg-orange-100',
    text: 'text-orange-600'
  },
  green: {
    icon: 'text-green-600 bg-green-100',
    text: 'text-green-600'
  },
  pink: {
    icon: 'text-pink-600 bg-pink-100',
    text: 'text-pink-600'
  }
};

const StatsCard = ({ title, value, icon: Icon, color, subtitle }: StatsCardProps) => {
  const classes = colorClasses[color];

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${Math.floor(val / 1000)} ${(val % 1000).toString().padStart(3, '0')}`;
      }
      return val.toLocaleString('fr-FR');
    }
    return val;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-full ${classes.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${classes.text}`}>
          {formatValue(value)}
          {typeof value === 'number' && value >= 1000 && title.includes('FCFA') && (
            <span className="text-sm font-normal text-gray-500 ml-1">FCFA</span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
