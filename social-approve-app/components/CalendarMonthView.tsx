'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { PostWithApproval } from '@/types';

interface CalendarMonthViewProps {
  currentDate: Date;
  scheduledPosts: PostWithApproval[];
  onDateClick: (date: Date) => void;
  onPostClick: (post: PostWithApproval) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: PostWithApproval[];
}

export default function CalendarMonthView({
  currentDate,
  scheduledPosts,
  onDateClick,
  onPostClick,
  onPrevMonth,
  onNextMonth,
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

      // Find posts scheduled for this day
      const dayPosts = scheduledPosts.filter((post) => {
        if (!post.approval?.scheduled_for) return false;
        const postDate = new Date(post.approval.scheduled_for);
        return postDate.toISOString().split('T')[0] === dateStr;
      });

      days.push({
        date: new Date(currentDateIter),
        dayOfMonth: currentDateIter.getDate(),
        isCurrentMonth: currentDateIter.getMonth() === month,
        isToday: currentDateIter.getTime() === today.getTime(),
        posts: dayPosts,
      });

      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    return days;
  }, [currentDate, scheduledPosts]);

  // Group days into weeks
  const weeks = useMemo(() => {
    const result: CalendarDay[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <button
          onClick={onPrevMonth}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={onNextMonth}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
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
                    ? 'bg-slate-800/30 hover:bg-slate-700/30'
                    : 'bg-slate-900/30 hover:bg-slate-800/30'
                } ${day.isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                {/* Day Number */}
                <div
                  className={`text-sm font-medium mb-1 ${
                    day.isCurrentMonth ? 'text-white' : 'text-slate-500'
                  } ${day.isToday ? 'text-blue-400' : ''}`}
                >
                  {day.dayOfMonth}
                </div>

                {/* Posts for this day */}
                <div className="space-y-1">
                  {day.posts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPostClick(post);
                      }}
                      className={`flex items-center gap-1.5 p-1.5 rounded text-xs cursor-pointer transition-colors ${
                        post.approval?.scheduled_status === 'published'
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30'
                          : post.approval?.scheduled_status === 'failed'
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30'
                          : 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-slate-700">
                        <Image
                          src={`/images/${post.image_filename}`}
                          alt={post.title}
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Title */}
                      <span className="truncate text-white/90">
                        {post.title.substring(0, 15)}...
                      </span>
                    </div>
                  ))}

                  {/* Show more indicator */}
                  {day.posts.length > 3 && (
                    <div className="text-xs text-slate-400 pl-1">
                      +{day.posts.length - 3} more
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
