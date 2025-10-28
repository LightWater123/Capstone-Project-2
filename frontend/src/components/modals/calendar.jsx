import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/datepicker.css';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/api';

export default function CalendarModal() {
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();
  const today = new Date();

  const isSameDay = (date1, date2) =>
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();

  const { data: events = [] } = useQuery({
    queryKey: ['getCalendarEvents'],
    queryFn: async () => {
      const [norm, maint] = await Promise.all([
        api.get('/api/events').then(r => r.data),
        api.get('/api/events/maintenance').then(r => r.data),
      ]);
      return [
        ...norm.map(e => ({ ...e, start: new Date(e.startDate), end: new Date(e.endDate) })),
        ...maint.map(e => ({ ...e, start: new Date(e.startDate), end: new Date(e.endDate) })),
      ];
    },
    staleTime: 5_000,
    refetchInterval: 5_000,
  });

  const getEventColorForDate = (date) => {
    const match = events.find((event) => isSameDay(new Date(event.start), date));
    return match?.color || null;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col flex-1">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-xl font-bold text-gray-700">Calendar</h2>
        <button
          onClick={() => navigate('/calendar-full')}
          className="text-sm text-yellow-400 hover:underline"
        >
          View Full Calendar
        </button>
      </div>

      <div className="flex-1 w-full min-h-0 items-center justify-center flex">
       
       <DatePicker
  selected={selectedDate}
  onChange={(date) => setSelectedDate(date)}
  inline
  calendarClassName="custom-calendar"
  renderDayContents={(day, date) => {
  const event = events.find((e) => isSameDay(new Date(e.start), date));
  const isToday = isSameDay(date, today);
  const backgroundColor = isToday
    ? '#facc15' // yellow for today
    : event?.color || null;

  return (
    <div
      className="relative group"
      style={{
        backgroundColor: backgroundColor || 'transparent',
        color: backgroundColor ? 'white' : 'inherit',
        borderRadius: '9999px',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: event ? 'pointer' : 'default',
      }}
    >
      {day}
      {event && (
        <span className="absolute bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap">
          {event.title}
        </span>
      )}
    </div>
  );
}}

/>


      </div>
    </div>
  );
}
