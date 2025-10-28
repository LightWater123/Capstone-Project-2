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
  const [view, setView] = useState(Views.MONTH);
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
    return result.data.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_date),
      end: new Date(event.end_date),
      color: event.color || "#3b82f6",
    }));
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
        start_date: data.start,
        end_date: data.end,
        color: data.color,
      })
      .then(() => {
        toast.success("Added new event!");
      })
      .catch(() => {
        toast.error("failed to add new event");
      })
      .finally(() => {
        queryClient.invalidateQueries({ queryKey: ["getCalendarEvents"] });
      });

  };

  const handleDeleteEvent = async () => {
  if (!selectedEvent) return;

  try {
    await api.delete(`/api/events/${selectedEvent.id}`);
    toast.success("Event deleted!");
  } catch (error) {
    toast.error("Failed to delete event.");
  } finally {
    setSelectedEvent(null);
    queryClient.invalidateQueries({ queryKey: ["getCalendarEvents"] });
  }
};


  const handleEventDrop = async ({ event, start, end }) => {
  try {
    console.log(event, start, end)
    const response = await api.put(`/api/events/${event.id}`, {
      title: event.title,
      start_date: start,
      end_date: end,
      color: event.color,
    });

    if (response.status === 200) {
      toast.success("Event updated!");
      queryClient.invalidateQueries({ queryKey: ["getCalendarEvents"] });
    } else {
      toast.error("Update failed: unexpected response");
    }
  } catch (error) {
    console.error("Update error:", error);
    toast.error("Failed to update event.");
  }
};


const handleEventResize = async ({ event, start, end }) => {
  try {
    await api.put(`/api/events/${event.id}`, {
      title: event.title,
      start_date: start,
      end_date: end,
      color: event.color,
    });
    toast.success("Event resized!");
  } catch (error) {
    toast.error("Failed to resize event.");
  } finally {
    queryClient.invalidateQueries({ queryKey: ["getCalendarEvents"] });
  }
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
