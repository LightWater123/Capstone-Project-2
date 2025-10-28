/*  LandingPage.jsx  –  events + maintenance + reminders  */
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import "react-big-calendar/lib/css/react-big-calendar.css";

const DnDCalendar = withDragAndDrop(ShadcnBigCalendar);
const localizer = momentLocalizer(moment);

const LandingPage = () => {
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  /* ----------------------------------------------------------
   *  merged events + maintenance + reminders
   * ---------------------------------------------------------- */
  const { data: events = [] } = useQuery({
    queryKey: ["getCalendarEvents"],
    queryFn: async () => {
      const [norm, maint, rem] = await Promise.all([
        api.get("/api/events").then((r) => r.data),
        api.get("/api/events/maintenance").then((r) => r.data),
        api.get("/api/events/reminders").then((r) => r.data), // <-- new
      ]);
      return [
        ...norm.map((e) => ({
          id: e.id,
          title: e.title,
          start: new Date(e.startDate),
          end: new Date(e.endDate),
          color: e.color || "#3b82f6",
          resource: { type: "event" },
        })),
        ...maint.map((e) => ({
          id: e.id,
          title: e.title,
          start: new Date(e.startDate),
          end: new Date(e.endDate),
          color: e.color || "#f59e0b",
          resource: { type: "maintenance", ...e.extendedProps },
        })),
        ...rem.map((e) => ({ // <-- reminders
          id: e.id,
          title: e.title,
          start: new Date(e.startDate),
          end: new Date(e.endDate),
          color: e.color || "#ef4444",
          resource: { type: "reminder", ...e.extendedProps },
        })),
      ];
    },
    staleTime: 5000,
    refetchInterval: 5000,
  });

  const handleNavigate = (d) => setDate(d);
  const handleViewChange = (v) => setView(v);

  const handleSelectSlot = (slotInfo) => {
    setSelectedSlot(slotInfo);
    setSelectedEvent(null);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
  };


  /* ----------------------------------------------------------
   *  CRUD  (only regular events)
   * ---------------------------------------------------------- */
  const handleCreateEvent = async (data) => {
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
    toast.success("Event created");
    setSelectedSlot(null);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    if (["maintenance", "reminder"].includes(selectedEvent.resource?.type)) {
      toast.error("Read-only item");
      return;
    }
    try {
      await api.delete(`/api/events/${selectedEvent.id}`);
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setSelectedEvent(null);
      queryClient.invalidateQueries(["getCalendarEvents"]);
    }
  };

  const handleEventDrop = async ({ event, start, end }) => {
    if (["maintenance", "reminder"].includes(event.resource?.type)) {
      toast.error("Read-only item");
      return;
    }
    try {
      await api.put(`/api/events/${event.id}`, {
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
    } catch {
      toast.error("Move failed");
    } finally {
      queryClient.invalidateQueries(["getCalendarEvents"]);
    }
  };

  const handleEventResize = async ({ event, start, end }) => {
    if (["maintenance", "reminder"].includes(event.resource?.type)) {
      toast.error("Read-only item");
      return;
    }
    try {
      await api.put(`/api/events/${event.id}`, {
        title: event.title,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        color: event.color,
      });
      toast.success("Resized");
    } catch {
      toast.error("Resize failed");
    } finally {
      queryClient.invalidateQueries(["getCalendarEvents"]);
    }
  };

  /* ----------------------------------------------------------
   *  styling
   * ---------------------------------------------------------- */
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: "6px",
      color: "#fff",
      border: "none",
      padding: "2px 6px",
    },
  });

  /* ----------------------------------------------------------
   *  render
   * ---------------------------------------------------------- */
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
              {selectedEvent.resource?.type === "maintenance" && (
                <>
                  <p><strong>Article:</strong> {selectedEvent.resource.article}</p>
                  <p><strong>Description:</strong> {selectedEvent.resource.description}</p>
                  <p><strong>Status:</strong> {selectedEvent.resource.status}</p>
                  <p><strong>Assigned tech:</strong> {selectedEvent.resource.email}</p>
                </>
              )}
              {selectedEvent.resource?.type === "reminder" && (
                <>
                  <p><strong>Asset:</strong> {selectedEvent.resource.article}</p>
                  <p><strong>Description:</strong> {selectedEvent.resource.description}</p>
                  <p><strong>Status:</strong> {selectedEvent.resource.status}</p>
                  <p><strong>Assigned tech:</strong> {selectedEvent.resource.email}</p>
                </>
              )}
              {selectedEvent.resource?.type === "event" && (
                <>
                  <p><strong>Title:</strong> {selectedEvent.title}</p>
                  <p><strong>Start:</strong> {moment(selectedEvent.start).format("LLLL")}</p>
                  <p><strong>End:</strong> {moment(selectedEvent.end).format("LLLL")}</p>
                </>
              )}

              {selectedEvent.resource?.type === "event" && (
                <Button variant="destructive" onClick={handleDeleteEvent}>
                  <Trash2 className="size-4 mr-2" />
                  Delete Event
                </Button>
              )}
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