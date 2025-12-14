'use client';

import { useMemo } from 'react';
import Image from 'next/image';

// Support both old PostWithApproval and new ScheduleInstance formats
interface ScheduleInstance {
  id: number;
  schedule_id: number;
  post_id: number;
  scheduled_for: string;
  status: 'pending' | 'approved' | 'sending' | 'sent' | 'failed' | 'skipped';
  post_title: string;
  post_content: string;
  post_image: string;
  repeat_type: 'none' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  schedule_status: string;
  is_modified?: boolean;
}

interface CalendarMonthViewProps {
  currentDate: Date;
  instances: ScheduleInstance[];
  onDateClick: (date: Date) => void;
  onInstanceClick: (instance: ScheduleInstance) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToMonth?: (date: Date) => void; // Quick jump to specific month
}

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  instances: ScheduleInstance[];
}

export default function CalendarMonthView({
  currentDate,
  instances,
  onDateClick,
  onInstanceClick,
  onPrevMonth,
  onNextMonth,
  onGoToMonth,
}: CalendarMonthViewProps) {
  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End on Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDateIter = new Date(startDate);
    while (currentDateIter <= endDate) {
      const dateStr = currentDateIter.toISOString().split('T')[0];

      // Find instances scheduled for this day
      const dayInstances = instances.filter((inst) => {
        const instDate = new Date(inst.scheduled_for);
        return instDate.toISOString().split('T')[0] === dateStr;
      });

      const dayDate = new Date(currentDateIter);
      dayDate.setHours(0, 0, 0, 0);

      days.push({
        date: new Date(currentDateIter),
        dayOfMonth: currentDateIter.getDate(),
        isCurrentMonth: currentDateIter.getMonth() === month,
        isToday: currentDateIter.getTime() === today.getTime(),
        isPast: dayDate < today,
        instances: dayInstances,
      });

      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    return days;
  }, [currentDate, instances]);

  // Group days into weeks
  const weeks = useMemo(() => {
    const result: CalendarDay[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  // Calculate months for quick navigation (current + 6 months)
  const monthOptions = useMemo(() => {
    const options: { date: Date; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      options.push({
        date: d,
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      });
    }
    return options;
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get status color for instance
  const getStatusColor = (status: string, repeatType: string) => {
    const isRepeat = repeatType !== 'none';

    switch (status) {
      case 'sent':
        return isRepeat
          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 border-l-4 border-l-emerald-500'
          : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30';
      case 'failed':
        return 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/30';
      case 'skipped':
        return 'bg-slate-500/20 hover:bg-slate-500/30 border-slate-500/30 opacity-50';
      case 'approved':
      case 'sending':
        return isRepeat
          ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/30 border-l-4 border-l-cyan-500'
          : 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/30';
      case 'pending':
      default:
        return isRepeat
          ? 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 border-l-4 border-l-blue-500'
          : 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30';
    }
  };

  // Count instances by status for header stats
  const stats = useMemo(() => {
    return instances.reduce(
      (acc, inst) => {
        acc[inst.status] = (acc[inst.status] || 0) + 1;
        acc.total++;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, sent: 0, failed: 0, skipped: 0 } as Record<string, number>
    );
  }, [instances]);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Month/Year with dropdown for quick navigation */}
          {onGoToMonth ? (
            <select
              value={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-').map(Number);
                onGoToMonth(new Date(year, month, 1));
              }}
              className="text-xl font-semibold text-white bg-transparent border-none focus:ring-0 cursor-pointer hover:text-blue-400 transition-colors"
            >
              {monthOptions.map((opt) => (
                <option
                  key={`${opt.date.getFullYear()}-${opt.date.getMonth()}`}
                  value={`${opt.date.getFullYear()}-${opt.date.getMonth()}`}
                  className="bg-slate-800"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <h2 className="text-xl font-semibold text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          )}

          <button
            onClick={onNextMonth}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Month Stats */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">{stats.total} posts this month</span>
          {stats.pending > 0 && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">{stats.pending} pending</span>
          )}
          {stats.sent > 0 && (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">{stats.sent} sent</span>
          )}
          {stats.failed > 0 && (
            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded">{stats.failed} failed</span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-700/50 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-500/30 border border-blue-500/50 rounded"></div>
          <span className="text-slate-400">One-time</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-500/30 border border-blue-500/50 border-l-4 border-l-blue-500 rounded"></div>
          <span className="text-slate-400">Repeating</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-emerald-500/30 border border-emerald-500/50 rounded"></div>
          <span className="text-slate-400">Sent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-cyan-500/30 border border-cyan-500/50 rounded"></div>
          <span className="text-slate-400">Approved</span>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-slate-700/50">
        {dayNames.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-medium text-slate-400 border-r border-slate-700/50 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="divide-y divide-slate-700/50">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 divide-x divide-slate-700/50">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                onClick={() => onDateClick(day.date)}
                className={`min-h-[120px] p-2 cursor-pointer transition-colors ${
                  day.isCurrentMonth
                    ? day.isPast
                      ? 'bg-slate-900/30 hover:bg-slate-800/30'
                      : 'bg-slate-800/30 hover:bg-slate-700/30'
                    : 'bg-slate-900/50 hover:bg-slate-800/30'
                } ${day.isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                {/* Day Number */}
                <div
                  className={`text-sm font-medium mb-1 ${
                    day.isCurrentMonth
                      ? day.isPast
                        ? 'text-slate-500'
                        : 'text-white'
                      : 'text-slate-600'
                  } ${day.isToday ? 'text-blue-400' : ''}`}
                >
                  {day.dayOfMonth}
                </div>

                {/* Instances for this day */}
                <div className="space-y-1">
                  {day.instances.slice(0, 3).map((inst) => (
                    <div
                      key={inst.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onInstanceClick(inst);
                      }}
                      className={`flex items-center gap-1.5 p-1.5 rounded text-xs cursor-pointer transition-colors border ${getStatusColor(
                        inst.status,
                        inst.repeat_type
                      )}`}
                    >
                      {/* Thumbnail */}
                      <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-slate-700">
                        <Image
                          src={`/images/${inst.post_image}`}
                          alt={inst.post_title}
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Title + Status indicator */}
                      <span className={`truncate ${inst.status === 'skipped' ? 'line-through text-slate-500' : 'text-white/90'}`}>
                        {inst.post_title.substring(0, 12)}...
                      </span>
                      {inst.is_modified && (
                        <span className="text-amber-400" title="Modified">*</span>
                      )}
                    </div>
                  ))}

                  {/* Show more indicator */}
                  {day.instances.length > 3 && (
                    <div className="text-xs text-slate-400 pl-1">
                      +{day.instances.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
