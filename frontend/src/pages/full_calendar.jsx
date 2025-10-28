import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import BTRheader from '../components/modals/btrHeader';
import BTRNavbar from '../components/modals/btrNavbar';
import CreateEvent from '../components/modals/createEvent';
import '../components/modals/calendar-full.css';
import { CalendarPlus } from 'lucide-react';
import { Binoculars } from 'lucide-react';
import LandingPage from '@/components/modals/big-full-calendar';

export default function CalendarFullPage() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEventList, setShowEventList] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [eventForm, setEventForm] = useState({
    title: '',
    date: null,
    startTime: '',
    endTime: '',
    location: '',
    color: '#FFC107'
  });

  const [eventDates, setEventDates] = useState([]);
  const today = new Date();

  const isSameDay = (date1, date2) =>
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();

  const handleSaveEvent = () => {
    if (eventForm.date) {
      const iso = eventForm.date.toISOString().split('T')[0];
      const exists = eventDates.some((e) => e.date === iso);
      if (!exists) {
        setEventDates([
          ...eventDates,
          {
            date: iso,
            title: eventForm.title,
            startTime: eventForm.startTime,
            endTime: eventForm.endTime,
            location: eventForm.location,
            color: eventForm.color
          }
        ]);
      }
    }
    setShowModal(false);
    setEventForm({
      title: '',
      date: null,
      startTime: '',
      endTime: '',
      location: '',
      color: '#FFC107'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <BTRheader />
      <BTRNavbar />

      <LandingPage />

      {/* <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-6xl h-auto min-h-[400px] overflow-visible flex flex-col mx-auto">
        <div className="w-full h-full">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Calendar</h2>

          <div className="flex justify-end mb-4 gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-500"
            >
              <CalendarPlus className='h-5 w-5 inline-block mr-2'/>
              Create Event
            </button>
            <button
              onClick={() => setShowEventList(true)}
              className="bg-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-500"
            >
              <Binoculars className='h-5 w-5 inline-block mr-2'/>
              View All Events
            </button>
          </div>

          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            inline
            calendarClassName="calendar-expanded"
            dayClassName={(date) => {
              const iso = date.toISOString().split('T')[0];
              const event = eventDates.find((e) => e.date === iso);
              const isToday = isSameDay(date, today);

              let base = 'relative ';
              if (isToday) base += 'ring-2 ring-yellow-400 ';
              if (event) base += `event-${iso} `;

              return base.trim();
            }}
          />

          <style>
            {eventDates
              .map(
                (e) => `
                .event-${e.date} {
                  background-color: ${e.color} !important;
                  color: white !important;
                  border-radius: 0.375rem;
                  position: relative;
                }
                .event-${e.date}::after {
                  content: "${e.title}";
                  position: absolute;
                  bottom: 100%;
                  left: 50%;
                  transform: translateX(-50%);
                  background: #333;
                  color: #fff;
                  padding: 4px 8px;
                  font-size: 0.75rem;
                  white-space: nowrap;
                  border-radius: 4px;
                  opacity: 0;
                  pointer-events: none;
                  transition: opacity 0.2s ease-in-out;
                  z-index: 10;
                }
                .event-${e.date}:hover::after {
                  opacity: 1;
                }
              `
              )
              .join('\n')}
          </style>
        </div>
      </div>

      <CreateEvent
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveEvent}
        formData={eventForm}
        setFormData={setEventForm}
      />

      {showEventList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Scheduled Events</h3>

            {eventDates.length === 0 ? (
              <p className="text-gray-500">No events created yet.</p>
            ) : (
              <ul className="space-y-4">
                {eventDates.map((e, i) => (
                  <li key={i} className="border p-4 rounded-md relative">
                    {editIndex === i ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={e.title}
                          onChange={(ev) => {
                            const updated = [...eventDates];
                            updated[i].title = ev.target.value;
                            setEventDates(updated);
                          }}
                          className="w-full border px-2 py-1 rounded"
                        />
                        <input
                          type="time"
                          value={e.startTime}
                          onChange={(ev) => {
                            const updated = [...eventDates];
                            updated[i].startTime = ev.target.value;
                            setEventDates(updated);
                          }}
                          className="w-full border px-2 py-1 rounded"
                        />
                        <input
                          type="time"
                          value={e.endTime}
                          onChange={(ev) => {
                            const updated = [...eventDates];
                            updated[i].endTime = ev.target.value;
                            setEventDates(updated);
                          }}
                          className="w-full border px-2 py-1 rounded"
                        />
                        <input
                          type="text"
                          value={e.location}
                          onChange={(ev) => {
                            const updated = [...eventDates];
                            updated[i].location = ev.target.value;
                            setEventDates(updated);
                          }}
                          className="w-full border px-2 py-1 rounded"
                        />
                        <input
                          type="color"
                          value={e.color}
                          onChange={(ev) => {
                            const updated = [...eventDates];
                            updated[i].color = ev.target.value;
                            setEventDates(updated);
                          }}
                          className="w-full h-8"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setEditIndex(null)}
                            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p><strong>{e.title}</strong></p>
                        <p>{e.date} | {e.startTime} – {e.endTime}</p>
                        <p>{e.location}</p>
                        <div className="mt-2 w-4 h-4 rounded-full" style={{ backgroundColor: e.color }} />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            onClick={() => setEditIndex(i)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              const updated = [...eventDates];
                              updated.splice(i, 1);
                              setEventDates(updated);
                            }}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowEventList(false);
                  setEditIndex(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}
