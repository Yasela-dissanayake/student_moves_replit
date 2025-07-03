import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { Property } from '@shared/schema';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  Check,
  X,
  Users,
  Home,
  Wrench,
  Info
} from 'lucide-react';

// Setup the localizer
const localizer = momentLocalizer(moment);

// Define event types
const EVENT_TYPES = [
  { value: 'viewing', label: 'Property Viewing', color: '#3b82f6' }, // blue
  { value: 'maintenance', label: 'Maintenance', color: '#f97316' }, // orange
  { value: 'inspection', label: 'Inspection', color: '#10b981' }, // green
  { value: 'meeting', label: 'Meeting', color: '#8b5cf6' }, // purple
  { value: 'deadline', label: 'Deadline', color: '#ef4444' }, // red
  { value: 'other', label: 'Other', color: '#6b7280' }, // gray
];

// Interface for calendar events
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  status?: string;
  description?: string;
  propertyId?: number;
  allDay?: boolean;
  color?: string;
  recurringPattern?: string;
}

// Type for dragging event interactions
type DraggedEvent = {
  event: CalendarEvent;
  start: Date;
  end: Date;
};

interface DragDropCalendarProps {
  events: CalendarEvent[];
  properties: Property[];
  onCreateEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
}

export default function DragDropCalendar({
  events,
  properties,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent
}: DragDropCalendarProps) {
  // State
  const [view, setView] = useState<string>(Views.WEEK);
  const [date, setDate] = useState<Date>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState<boolean>(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState<CalendarEvent>({
    id: '',
    title: '',
    start: new Date(),
    end: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
    type: 'viewing',
    status: 'scheduled',
    description: '',
  });

  // Handlers for view changes
  const handleViewChange = (newView: string) => {
    setView(newView);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  // Open add event dialog with slot information
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setNewEvent({
      id: `new-${Date.now()}`,
      title: '',
      start,
      end,
      type: 'viewing',
      status: 'scheduled',
      description: '',
    });
    setIsAddEventOpen(true);
  };

  // Open event details/edit dialog when clicking an event
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditEventOpen(true);
  };

  // Handle event resizing
  const handleResizeEvent = ({ event, start, end }: DraggedEvent) => {
    onUpdateEvent(event.id, { start, end });
  };

  // Handle event dragging
  const handleDragEvent = ({ event, start, end }: DraggedEvent) => {
    onUpdateEvent(event.id, { start, end });
  };

  // Create a new event
  const handleCreateEvent = () => {
    onCreateEvent(newEvent);
    setIsAddEventOpen(false);
    setNewEvent({
      id: '',
      title: '',
      start: new Date(),
      end: new Date(new Date().getTime() + 60 * 60 * 1000),
      type: 'viewing',
      status: 'scheduled',
      description: '',
    });
  };

  // Update an existing event
  const handleUpdateEvent = () => {
    if (selectedEvent) {
      onUpdateEvent(selectedEvent.id, selectedEvent);
      setIsEditEventOpen(false);
      setSelectedEvent(null);
    }
  };

  // Delete an event
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      onDeleteEvent(selectedEvent.id);
      setIsDeleteDialogOpen(false);
      setIsEditEventOpen(false);
      setSelectedEvent(null);
    }
  };

  // Format slot date for display
  const formatSlotDate = (date: Date) => {
    return format(date, 'PPP');
  };

  // Format slot time for display
  const formatSlotTime = (date: Date) => {
    return format(date, 'p');
  };

  // Get the color for an event type
  const getEventTypeColor = (type: string) => {
    const eventType = EVENT_TYPES.find(t => t.value === type);
    return eventType ? eventType.color : '#6b7280';
  };

  // Get status badge style
  const getStatusBadgeStyle = (status?: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Custom event component for the calendar
  const eventStyleGetter = (event: CalendarEvent) => {
    const color = event.color || getEventTypeColor(event.type);
    return {
      style: {
        backgroundColor: color,
        borderRadius: '4px',
        opacity: 0.8,
        color: '#fff',
        border: '0px',
        display: 'block',
        fontWeight: 500,
      }
    };
  };

  // Custom event component with additional information
  const EventComponent = ({ event }: { event: CalendarEvent }) => (
    <div title={event.description}>
      <div className="text-xs truncate">
        {event.title}
      </div>
      {event.propertyId && (
        <div className="text-xs truncate">
          {properties.find(p => p.id === event.propertyId)?.title || `Property ID: ${event.propertyId}`}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Manage viewings, inspections, and maintenance visits
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Tabs 
            value={view} 
            onValueChange={handleViewChange} 
            className="hidden sm:flex"
          >
            <TabsList>
              <TabsTrigger value={Views.DAY}>Day</TabsTrigger>
              <TabsTrigger value={Views.WEEK}>Week</TabsTrigger>
              <TabsTrigger value={Views.MONTH}>Month</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            onClick={() => {
              setNewEvent({
                id: `new-${Date.now()}`,
                title: '',
                start: new Date(),
                end: new Date(new Date().getTime() + 60 * 60 * 1000),
                type: 'viewing',
                status: 'scheduled',
                description: '',
              });
              setIsAddEventOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden p-0 border shadow-sm">
        <CardContent className="p-0">
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={[Views.DAY, Views.WEEK, Views.MONTH]}
              view={view as any}
              date={date}
              onView={handleViewChange as any}
              onNavigate={handleNavigate}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              resizable
              onEventResize={handleResizeEvent as any}
              onEventDrop={handleDragEvent as any}
              eventPropGetter={eventStyleGetter as any}
              components={{
                event: EventComponent as any,
              }}
              popup
              step={30}
              timeslots={2}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new event on your calendar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}
                >
                  <SelectTrigger id="event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: type.color }}
                          />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="event-status">Status</Label>
                <Select
                  value={newEvent.status}
                  onValueChange={(value) => setNewEvent({ ...newEvent, status: value })}
                >
                  <SelectTrigger id="event-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="property">Related Property (Optional)</Label>
              <Select
                value={newEvent.propertyId?.toString() || ''}
                onValueChange={(value) => 
                  setNewEvent({ ...newEvent, propertyId: value ? parseInt(value) : undefined })
                }
              >
                <SelectTrigger id="property">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                  <span className="text-sm">
                    {formatSlotDate(newEvent.start)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="all-day">All Day</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="all-day"
                    checked={!!newEvent.allDay}
                    onCheckedChange={(checked) => {
                      setNewEvent({ ...newEvent, allDay: checked });
                    }}
                  />
                  <Label htmlFor="all-day" className="text-sm">
                    {newEvent.allDay ? 'Yes' : 'No'}
                  </Label>
                </div>
              </div>
            </div>
            
            {!newEvent.allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 opacity-70" />
                    <span className="text-sm">
                      {formatSlotTime(newEvent.start)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 opacity-70" />
                    <span className="text-sm">
                      {formatSlotTime(newEvent.end)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newEvent.description || ''}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Add details about this event"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} disabled={!newEvent.title}>
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Event Dialog */}
      {selectedEvent && (
        <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update the details of your event.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Event Title</Label>
                <Input
                  id="edit-title"
                  value={selectedEvent.title}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-event-type">Event Type</Label>
                  <Select
                    value={selectedEvent.type}
                    onValueChange={(value) => setSelectedEvent({ ...selectedEvent, type: value })}
                  >
                    <SelectTrigger id="edit-event-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: type.color }}
                            />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-event-status">Status</Label>
                  <Select
                    value={selectedEvent.status || 'scheduled'}
                    onValueChange={(value) => setSelectedEvent({ ...selectedEvent, status: value })}
                  >
                    <SelectTrigger id="edit-event-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 mr-2">
                            Scheduled
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="pending">
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 mr-2">
                            Pending
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 mr-2">
                            <Check className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 mr-2">
                            <X className="h-3 w-3 mr-1" />
                            Cancelled
                          </Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-property">Related Property (Optional)</Label>
                <Select
                  value={selectedEvent.propertyId?.toString() || ''}
                  onValueChange={(value) => 
                    setSelectedEvent({ ...selectedEvent, propertyId: value ? parseInt(value) : undefined })
                  }
                >
                  <SelectTrigger id="edit-property">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    <span className="text-sm">
                      {formatSlotDate(selectedEvent.start)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-all-day">All Day</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-all-day"
                      checked={!!selectedEvent.allDay}
                      onCheckedChange={(checked) => {
                        setSelectedEvent({ ...selectedEvent, allDay: checked });
                      }}
                    />
                    <Label htmlFor="edit-all-day" className="text-sm">
                      {selectedEvent.allDay ? 'Yes' : 'No'}
                    </Label>
                  </div>
                </div>
              </div>
              
              {!selectedEvent.allDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 opacity-70" />
                      <span className="text-sm">
                        {formatSlotTime(selectedEvent.start)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 opacity-70" />
                      <span className="text-sm">
                        {formatSlotTime(selectedEvent.end)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={selectedEvent.description || ''}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                  placeholder="Add details about this event"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button 
                variant="outline" 
                className="text-red-600 hover:bg-red-100 hover:text-red-700"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsEditEventOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateEvent}>
                  Update Event
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event "{selectedEvent?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}