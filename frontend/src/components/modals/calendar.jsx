import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/datepicker.css';

export default function CalendarModal() {
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();

  const today = new Date();
  const isSameDay = (date1, date2) =>
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();

  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col flex-1 ">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-xl font-bold text-gray-700">Calendar</h2>
        <button
          onClick={() => navigate('/calendar-full')}
          className="text-sm text-yellow-400 hover:underline"
        >
          View Full Calendar
        </button>
      </div>

      <div className='flex-1 w-full min-h-0 items-center justify-center flex'>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          inline
          calendarClassName="custom-calendar"
          dayClassName={(date) =>
            isSameDay(date, today)
              ? 'bg-yellow-300 text-black rounded-full'
              : undefined
          }
        />
      </div>
    </div>
  );
}
