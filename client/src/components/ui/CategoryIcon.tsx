import React from 'react';
import {
  BookOpen,
  Scroll,
  FileText,
  Atom,
  Cpu,
  Binary,
  TrendingUp,
  Sparkles,
  Compass,
  Palette,
  Coffee,
  Smile,
  Flame,
  Layers,
  GraduationCap,
  Languages,
  Scale,
  Landmark,
  Headphones,
  Newspaper,
  BookMarked
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Scroll,
  FileText,
  Atom,
  Cpu,
  Binary,
  TrendingUp,
  Sparkles,
  Compass,
  Palette,
  Coffee,
  Smile,
  Flame,
  Layers,
  GraduationCap,
  Languages,
  Scale,
  Landmark,
  Headphones,
  Newspaper
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4' }) => {
  const IconComponent = ICON_MAP[name] || BookMarked;
  return <IconComponent className={className} />;
};
