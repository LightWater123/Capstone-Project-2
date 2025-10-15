import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(null);

  const today = new Date();
  const isSameDay = (date1, date2) =>
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();

  return (
    <div className="bg-white rounded-xl shadow-md p-4 w-[378px] h-[350px]">
      <h2 className="text-xl font-bold text-gray-700 mb-3">Calendar</h2>
      
      <div className='items-center justify-center flex'>
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
