

interface MetricCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function MetricCard({ title, children, icon }: MetricCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col gap-3 border border-gray-700">
      <div className="flex items-center gap-2 text-gray-400 text-sm font-medium uppercase tracking-wide">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}
