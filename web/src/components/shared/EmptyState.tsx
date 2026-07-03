import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const EmptyState = ({ title, description, icon }: EmptyStateProps) => (
  <div className="empty-state">
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
      {icon || <FileQuestion className="w-8 h-8 text-muted-foreground" />}
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground max-w-md">{description}</p>
  </div>
);

export default EmptyState;
