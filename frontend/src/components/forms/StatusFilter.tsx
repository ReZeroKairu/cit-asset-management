import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  pendingCount: number;
  userRole?: string;
  onDateFilterChange?: (dateFilter: string) => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  value,
  onChange,
  pendingCount,
  userRole,
  onDateFilterChange
}) => {
  const getDateFilterOptions = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    return [
      { value: 'all', label: 'All Time' },
      { value: 'today', label: 'Today' },
      { value: 'yesterday', label: 'Yesterday' },
      { value: 'last7days', label: 'Last 7 Days' },
      { value: 'last30days', label: 'Last 30 Days' }
    ];
  };

  // For Admin users, only show date filter
  if (userRole === 'Admin') {
    return (
      <div className="flex gap-2 w-full sm:w-auto">
        {onDateFilterChange && (
          <Select onValueChange={onDateFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              {getDateFilterOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }

  // For non-Admin users, show both status and date filters
  return (
    <div className="flex gap-2 w-full sm:w-auto">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="Pending">Pending ({pendingCount})</SelectItem>
          <SelectItem value="Admin_Approved">Admin Approved</SelectItem>
          <SelectItem value="Custodian_Approved">Custodian Approved</SelectItem>
        </SelectContent>
      </Select>
      
      {onDateFilterChange && (
        <Select onValueChange={onDateFilterChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            {getDateFilterOptions().map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
