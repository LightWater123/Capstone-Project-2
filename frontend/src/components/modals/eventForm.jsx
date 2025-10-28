"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 w-full p-4"
      >
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
                <Select onValueChange={field.onChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent className={"w-full"}>
                    <SelectGroup>
                      <SelectLabel>Color</SelectLabel>
                      <SelectItem
                        className="focus:bg-red-600 hover:text-red-500 w-full"
                        value="red"
                      >
                        Red
                      </SelectItem>
                      <SelectItem className="focus:bg-green-600" value="green">
                        Green
                      </SelectItem>
                      <SelectItem className="focus:bg-blue-600" value="blue">
                        Blue
                      </SelectItem>
                      <SelectItem
                        className="focus:bg-purple-600"
                        value="purple"
                      >
                        Purple
                      </SelectItem>
                      <SelectItem
                        className="focus:bg-yellow-600"
                        value="yellow"
                      >
                        Yellow
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button 
          variant="ghost" 
          type="button"
          className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-red-800 hover:text-red-900
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-red-900 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
          onClick={onCancel}>
            Cancel
          </Button>
          <Button 
          type="submit"
          variant="ghost"
          className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-blue-900 hover:text-blue-950
            after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
            after:h-[3px] after:w-0 after:bg-blue-950 after:rounded-full after:-translate-x-1/2
            after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
          >Create Event</Button>
        </div>
      </form>
    </Form>
  );
}
