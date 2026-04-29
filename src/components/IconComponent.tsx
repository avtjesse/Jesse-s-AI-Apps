import { MessageSquare, Image as ImageIcon, Music, Video, Brain, Zap, Church, Briefcase, BarChart, Heart, LucideIcon } from 'lucide-react';
import { IconName } from '../types';

const iconMap: Record<IconName, LucideIcon> = {
  Chat: MessageSquare,
  Image: ImageIcon,
  Music: Music,
  Video: Video,
  Brain: Brain,
  Zap: Zap,
  Church: Church,
  Briefcase: Briefcase,
  BarChart: BarChart,
  Heart: Heart,
};

interface IconComponentProps {
  name: IconName;
  className?: string;
}

export function IconComponent({ name, className }: IconComponentProps) {
  const Icon = iconMap[name] || Heart;
  return <Icon className={className} />;
}
