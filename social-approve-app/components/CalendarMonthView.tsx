'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ScheduleInstance } from '@/types';

interface CalendarMonthViewProps {
  currentDate: Date;
  instances: ScheduleInstance[];
  onDateClick: (date: Date) => void;
  onInstanceClick: (instance: ScheduleInstance) => void;
  onApproveToOneUp?: (instance: ScheduleInstance) => Promise<void>;
  onUnschedule?: (instance: ScheduleInstance) => Promise<void>;
  onRepeatPost?: (instance: ScheduleInstance) => Promise<void>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToMonth?: (date: Date) => void;
}

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  instances: ScheduleInstance[];
}

// Post status: pre-scheduled (orange) vs sent (green)
type PostStatus = 'pre-scheduled' | 'sending' | 'sent' | 'failed';

function getPostStatus(instance: ScheduleInstance): PostStatus {
  if (instance.status === 'sent') return 'sent';
  if (instance.status === 'sending') return 'sending';
  if (instance.status === 'failed') return 'failed';
  // pending, approved, skipped = pre-scheduled (not yet sent to OneUp)
  return 'pre-scheduled';
}

export default function CalendarMonthView({
  currentDate,
  instances,
  onDateClick,
  onInstanceClick,
  onApproveToOneUp,
  onUnschedule,
  onRepeatPost,
  onPrevMonth,
  onNextMonth,
  onGoToMonth,
}: CalendarMonthViewProps) {
  const [selectedInstance, setSelectedInstance] = useState<ScheduleInstance | null>(null);
  const [approving, setApproving] = useState(false);
  const [unscheduling, setUnscheduling] = useState(false);
  const [repeating, setRepeating] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDateIter = new Date(startDate);
    while (currentDateIter <= endDate) {
      const dateStr = currentDateIter.toISOString().split('T')[0];

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

  // Month navigation options
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

  // Stats
  const stats = useMemo(() => {
    let preScheduled = 0;
    let sent = 0;
    let failed = 0;

    instances.forEach((inst) => {
      const status = getPostStatus(inst);
      if (status === 'sent' || status === 'sending') sent++;
      else if (status === 'failed') failed++;
      else preScheduled++;
    });

    return { total: instances.length, preScheduled, sent, failed };
  }, [instances]);

  // Get grid layout based on post count
  const getGridClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-3'; // Max 3 columns, will scroll if more
  };

  // Get square size based on count
  const getSquareSize = (count: number) => {
    if (count <= 1) return 'w-full h-16';
    if (count <= 2) return 'w-full h-12';
    if (count <= 4) return 'w-full h-10';
    return 'w-full h-8';
  };

  // Handle approve to OneUp
  const handleApprove = async () => {
    if (!selectedInstance || !onApproveToOneUp) return;
    setApproving(true);
    try {
      await onApproveToOneUp(selectedInstance);
      setSelectedInstance(null);
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setApproving(false);
    }
  };

  // Handle unschedule
  const handleUnschedule = async () => {
    if (!selectedInstance || !onUnschedule) return;
    setUnscheduling(true);
    try {
      await onUnschedule(selectedInstance);
      setSelectedInstance(null);
    } catch (error) {
      console.error('Failed to unschedule:', error);
    } finally {
      setUnscheduling(false);
    }
  };

  // Handle repeat post (add back to ready to schedule)
  const handleRepeat = async () => {
    if (!selectedInstance || !onRepeatPost) return;
    setRepeating(true);
    try {
      await onRepeatPost(selectedInstance);
      setSelectedInstance(null);
    } catch (error) {
      console.error('Failed to repeat post:', error);
    } finally {
      setRepeating(false);
    }
  };

  return (
    <>
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden w-full">
        {/* Calendar Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-slate-700/50 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevMonth}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

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

          {/* Status Legend & Stats */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-orange-500 rounded"></div>
              <span className="text-slate-400">Pre-scheduled ({stats.preScheduled})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded"></div>
              <span className="text-slate-400">Sent ({stats.sent})</span>
            </div>
            {stats.failed > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded"></div>
                <span className="text-slate-400">Failed ({stats.failed})</span>
              </div>
            )}
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-slate-700/50">
          {dayNames.map((day) => (
            <div
              key={day}
              className="py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-slate-400 border-r border-slate-700/50 last:border-r-0"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
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
                  className={`min-h-[60px] sm:min-h-[100px] p-1 sm:p-1.5 cursor-pointer transition-colors ${
                    day.isCurrentMonth
                      ? day.isPast
                        ? 'bg-slate-900/30 hover:bg-slate-800/30'
                        : 'bg-slate-800/30 hover:bg-slate-700/30'
                      : 'bg-slate-900/50 hover:bg-slate-800/30'
                  } ${day.isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                >
                  {/* Day Number */}
                  <div
                    className={`text-xs font-medium mb-1 ${
                      day.isCurrentMonth
                        ? day.isPast
                          ? 'text-slate-500'
                          : 'text-white'
                        : 'text-slate-600'
                    } ${day.isToday ? 'text-blue-400' : ''}`}
                  >
                    {day.dayOfMonth}
                  </div>

                  {/* Post Grid */}
                  {day.instances.length > 0 && (
                    <div className={`grid ${getGridClass(day.instances.length)} gap-1`}>
                      {day.instances.map((inst) => {
                        const status = getPostStatus(inst);
                        const bgColor =
                          status === 'sent' || status === 'sending' ? 'bg-emerald-500' :
                          status === 'failed' ? 'bg-red-500' :
                          'bg-orange-500';

                        return (
                          <button
                            key={`${inst.source}-${inst.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInstance(inst);
                            }}
                            className={`${getSquareSize(day.instances.length)} ${bgColor} rounded overflow-hidden hover:ring-2 hover:ring-white/50 transition-all relative group`}
                            title={inst.post_title}
                          >
                            {/* Image thumbnail */}
                            <Image
                              src={`/images/${inst.post_image}`}
                              alt={inst.post_title}
                              fill
                              className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                            {/* Status indicator overlay */}
                            <div className={`absolute inset-0 ${bgColor} opacity-30`} />
                            {/* Time badge */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white text-center py-0.5 truncate">
                              {new Date(inst.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedInstance && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedInstance(null)}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Status */}
            <div className={`px-5 py-3 flex items-center justify-between ${
              getPostStatus(selectedInstance) === 'sent' || getPostStatus(selectedInstance) === 'sending'
                ? 'bg-emerald-600'
                : getPostStatus(selectedInstance) === 'failed'
                ? 'bg-red-600'
                : 'bg-orange-600'
            }`}>
              <div className="flex items-center gap-2">
                {getPostStatus(selectedInstance) === 'sent' ? (
                  <>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white font-semibold">SENT TO ONEUP</span>
                  </>
                ) : getPostStatus(selectedInstance) === 'sending' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-white font-semibold">SENDING...</span>
                  </>
                ) : getPostStatus(selectedInstance) === 'failed' ? (
                  <>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-white font-semibold">FAILED</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-white font-semibold">PRE-SCHEDULED</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedInstance(null)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Post Image */}
            <div className="relative w-full h-48 bg-slate-900">
              <Image
                src={`/images/${selectedInstance.post_image}`}
                alt={selectedInstance.post_title}
                fill
                className="object-contain"
              />
            </div>

            {/* Post Details */}
            <div className="p-5">
              <h3 className="text-lg font-semibold text-white mb-2">{selectedInstance.post_title}</h3>

              <div className="mb-4 p-3 bg-slate-700/50 rounded-lg max-h-32 overflow-y-auto">
                <p className="text-slate-300 text-sm whitespace-pre-wrap">{selectedInstance.post_content}</p>
              </div>

              {/* Schedule Info */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Scheduled For</p>
                  <p className="text-white font-medium">
                    {new Date(selectedInstance.scheduled_for).toLocaleDateString()}
                  </p>
                  <p className="text-slate-300">
                    {new Date(selectedInstance.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Schedule Type</p>
                  <p className="text-white font-medium capitalize">
                    {selectedInstance.repeat_type === 'none' ? 'One-time' : selectedInstance.repeat_type}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {getPostStatus(selectedInstance) === 'pre-scheduled' && onApproveToOneUp && (
                  <button
                    onClick={handleApprove}
                    disabled={approving || unscheduling}
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {approving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        APPROVE &amp; SEND TO ONEUP
                      </>
                    )}
                  </button>
                )}

                {getPostStatus(selectedInstance) === 'pre-scheduled' && onUnschedule && (
                  <button
                    onClick={handleUnschedule}
                    disabled={approving || unscheduling}
                    className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {unscheduling ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Unschedule
                      </>
                    )}
                  </button>
                )}

                {getPostStatus(selectedInstance) === 'sent' && (
                  <>
                    {onRepeatPost && (
                      <button
                        onClick={handleRepeat}
                        disabled={repeating}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {repeating ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            REPEAT POST
                          </>
                        )}
                      </button>
                    )}
                    <div className="px-4 py-3 bg-slate-700 text-slate-400 text-sm rounded-lg text-center">
                      Already in OneUp
                    </div>
                  </>
                )}

                {getPostStatus(selectedInstance) === 'failed' && onApproveToOneUp && (
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {approving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        RETRY SEND TO ONEUP
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setSelectedInstance(null)}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Warning for pre-scheduled */}
              {getPostStatus(selectedInstance) === 'pre-scheduled' && (
                <p className="mt-3 text-xs text-orange-400 text-center">
                  This post is only in your dashboard. Click &quot;Approve &amp; Send&quot; to publish to OneUp.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
