export type Category = '全部' | '教會' | '職場' | '工具' | '創意' | '數據' | '遊戲' | '其他';

export type IconName = 'Chat' | 'Image' | 'Music' | 'Video' | 'Brain' | 'Zap' | 'Church' | 'Briefcase' | 'BarChart' | 'Heart';

export interface AppItem {
  id: string;
  name: string;
  description: string;
  link: string;
  category: Category;
  icon: IconName;
  aspectRatio?: '4:3' | '16:9' | '1:1' | 'auto';
}
