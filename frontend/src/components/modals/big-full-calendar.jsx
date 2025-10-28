"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import moment from "moment";
import { useState } from "react";
import { momentLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { EventForm } from "./eventForm";
import ShadcnBigCalendar from "./big-calendar";
import { toast } from "sonner";
import api from "@/api/api";
import { v4 as uuidv4 } from "uuid";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/App";

const DnDCalendar = withDragAndDrop(ShadcnBigCalendar);
const localizer = momentLocalizer(moment);

const LandingPage = () => {
  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(new Date());
  // const [events, setEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleNavigate = (newDate) => setDate(newDate);
  const handleViewChange = (newView) => setView(newView);

  const handleSelectSlot = (slotInfo) => {
    setSelectedSlot(slotInfo);
    setSelectedEvent(null);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
  };


  const { data: events = [] } = useQuery({
    queryKey: ["getCalendarEvents"],
    queryFn: async () => {
      const result = await api.get("/api/events");
      const data = {
        id: result.data.id,
        title: result.data.title,
        start: result.data.startDate,
        end: result.data.endDate,
        color: result.data.color,
      };
      return result.data;
    },
    staleTime: 5000,
    refetchInterval: 5000,
  });

  const handleCreateEvent = async (data) => {
    const newEvent = {
      id: uuidv4(),
      title: data.title,
      start: new Date(data.start),
      end: new Date(data.end),
      color: data.color || "#3b82f6", // default to blue if not provided
    };
    // setEvents([...events, newEvent]);
    setSelectedSlot(null);

    console.log(data);
    await api
      .post("/api/events", {
        title: data.title,
        startDate: data.start,
        endDate: data.end,
        color: data.color,
      })
      .catch(() => {
        toast.error("failed to add new event");
      })
      .finally(() => {
        queryClient.invalidateQueries({ queryKey: ["getCalendarEvents"] });
      });

    toast.success("Added new event!");
  };

  const handleDeleteEvent = async () => {

    if (selectedEvent) {
      console.log(selectedEvent);
      // setEvents(events.filter((e) => e !== selectedEvent));
      setSelectedEvent(null);
      await api.delete(`/api/event/${selectedEvent.id}`).finally(() => {
        queryClient.invalidateQueries({ queryKey: ["getCalendarEvents"] });
      });
    }
  };

  const handleEventDrop = ({ event, start, end }) => {
    const updatedEvents = events.map((existingEvent) =>
      existingEvent === event ? { ...existingEvent, start, end } : existingEvent
    );
    // setEvents(updatedEvents);
  };

  const handleEventResize = ({ event, start, end }) => {
    const updatedEvents = events.map((existingEvent) =>
      existingEvent === event ? { ...existingEvent, start, end } : existingEvent
    );
    // setEvents(updatedEvents);
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color || "#3b82f6",
        borderRadius: "6px",
        color: "white",
        border: "none",
        padding: "2px 6px",
      },
    };
  };

  return (
    <main className="w-full p-5">
      <div className="mb-4">
        <Button
          onClick={() =>
            setSelectedSlot({
              start: new Date(),
              end: new Date(),
              slots: [],
              action: "click",
            })
          }
        >
          <Plus className="size-5 mr-2" />
          Create Event
        </Button>
      </div>

      <Dialog
        open={selectedSlot !== null || selectedEvent !== null}
        onOpenChange={() => {
          setSelectedSlot(null);
          setSelectedEvent(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <h2 className="scroll-m-20 text-xl font-semibold tracking-tight">
              {selectedEvent ? "Event Details" : "Create Event"}
            </h2>
          </DialogHeader>

          {selectedSlot && (
            <EventForm
              start={selectedSlot.start}
              end={selectedSlot.end}
              onSubmit={handleCreateEvent}
              onCancel={() => setSelectedSlot(null)}
            />
          )}

          {selectedEvent && (
            <div className="space-y-4">
              <p>
                <strong>Title:</strong> {selectedEvent.title}
              </p>
              <p>
                <strong>Start:</strong>{" "}
                {moment(selectedEvent.start).format("LLLL")}
              </p>
              <p>
                <strong>End:</strong> {moment(selectedEvent.end).format("LLLL")}
              </p>
              <Button variant="destructive" onClick={handleDeleteEvent}>
                <Trash2 className="size-4 mr-2" />
                Delete Event
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DnDCalendar
        localizer={localizer}
        style={{ height: 600, width: "100%" }}
        className="border-border border-rounded-md border-solid border-2 rounded-lg"
        selectable
        date={date}
        onNavigate={handleNavigate}
        view={view}
        onView={handleViewChange}
        resizable
        draggableAccessor={() => true}
        resizableAccessor={() => true}
        events={events}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        eventPropGetter={eventStyleGetter}
      />
    </main>
  );
};


export default LandingPage;
