'use client';

import React, { useMemo } from 'react';
import { format, differenceInDays, startOfDay, addDays } from 'date-fns';

interface Task {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  assignee?: string;
  progress?: number;
  dependencies?: string[];
}

interface GanttChartProps {
  tasks: Task[];
  startDate: Date;
  endDate: Date;
  onTaskClick?: (task: Task) => void;
}

export function GanttChart({ tasks, startDate, endDate, onTaskClick }: GanttChartProps) {
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const dayWidth = 40;
  const rowHeight = 50;

  const dates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < totalDays; i++) {
      dates.push(addDays(startDate, i));
    }
    return dates;
  }, [startDate, totalDays]);

  const getTaskPosition = (task: Task) => {
    const startOffset = differenceInDays(task.startDate, startDate);
    const duration = differenceInDays(task.endDate, task.startDate) + 1;
    
    return {
      left: startOffset * dayWidth,
      width: duration * dayWidth,
    };
  };

  const getProgressColor = (progress?: number) => {
    if (!progress) return 'bg-blue-500';
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* Header with dates */}
        <div className="flex border-b">
          <div className="w-64 flex-shrink-0 p-2 font-semibold border-r bg-gray-50">
            Task
          </div>
          <div className="flex" style={{ width: totalDays * dayWidth }}>
            {dates.map((date, index) => (
              <div
                key={index}
                className="flex-shrink-0 p-2 text-xs border-r text-center"
                style={{ width: dayWidth }}
              >
                {format(date, 'MMM d')}
              </div>
            ))}
          </div>
        </div>

        {/* Task rows */}
        {tasks.map((task, index) => {
          const position = getTaskPosition(task);
          
          return (
            <div
              key={task.id}
              className="flex border-b hover:bg-gray-50 cursor-pointer"
              style={{ height: rowHeight }}
              onClick={() => onTaskClick?.(task)}
            >
              {/* Task name */}
              <div className="w-64 flex-shrink-0 p-2 border-r flex items-center">
                <div className="truncate text-sm">{task.title}</div>
              </div>

              {/* Timeline */}
              <div className="relative flex-shrink-0" style={{ width: totalDays * dayWidth }}>
                {/* Grid lines */}
                {dates.map((_, index) => (
                  <div
                    key={index}
                    className="absolute top-0 bottom-0 border-r border-gray-200"
                    style={{ left: index * dayWidth, width: dayWidth }}
                  />
                ))}

                {/* Task bar */}
                <div
                  className={`absolute top-3 bottom-3 rounded ${getProgressColor(task.progress)} opacity-90`}
                  style={{
                    left: position.left,
                    width: position.width,
                  }}
                >
                  {/* Progress indicator */}
                  {task.progress !== undefined && (
                    <div
                      className="absolute top-0 left-0 h-full bg-black bg-opacity-20"
                      style={{ width: `${task.progress}%` }}
                    />
                  )}
                  
                  {/* Task label */}
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                    {task.progress !== undefined && `${task.progress}%`}
                  </div>
                </div>

                {/* Dependencies */}
                {task.dependencies?.map((depId) => {
                  const depTask = tasks.find(t => t.id === depId);
                  if (!depTask) return null;
                  
                  const depPosition = getTaskPosition(depTask);
                  return (
                    <svg
                      key={depId}
                      className="absolute top-0 left-0 pointer-events-none"
                      style={{ width: totalDays * dayWidth, height: rowHeight }}
                    >
                      <path
                        d={`M ${depPosition.left + depPosition.width} ${rowHeight / 2} 
                            L ${position.left} ${rowHeight / 2}`}
                        stroke="#9ca3af"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                      />
                    </svg>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Arrow marker definition */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
