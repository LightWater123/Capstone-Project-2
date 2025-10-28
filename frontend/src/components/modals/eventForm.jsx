"use client";

import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  start: z.string(),
  end: z.string(),
  color: z.string().optional(),
});

export function EventForm({ start, end, onSubmit, onCancel }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      start: start.toISOString().slice(0, 16),
      end: end.toISOString().slice(0, 16),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full p-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter event title" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="start"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="end"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Color</FormLabel>
              <FormControl>
                <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a color" />
      </SelectTrigger>
      <SelectContent className={"w-full"}>

        <SelectGroup>
          <SelectLabel>Color</SelectLabel>
          <SelectItem className="hover:text-red-500 w-full" value="red">
            <div className="bg-red-600 size-10 w-full">Red</div></SelectItem>
          <SelectItem className="hover:text-green-500" value="green">Green</SelectItem>
          <SelectItem className="hover:text-blue-500" value="blue">Blue</SelectItem>
          <SelectItem className="hover:text-purple-500" value="purple">Purple</SelectItem>
          <SelectItem className="hover:text-yellow-600" value="yellow">Yellow</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create Event</Button>
        </div>
      </form>
    </Form>
  );
}