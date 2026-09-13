import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import './calendar-view.css'

export type CalendarViewEvent = {
  id: string | number
  title: string
  startDate: string
  endDate: string
  time?: string
  description?: string
  color: string
  type?: string
}

type CalendarViewProps = {
  events: CalendarViewEvent[]
  onEventClick?: (event: CalendarViewEvent) => void
  onDateClick?: (date: Date) => void
  onMonthChange?: (month: string) => void
}

export function CalendarView({ events, onEventClick, onDateClick, onMonthChange }: CalendarViewProps) {
  const { t } = useTranslation()
  const [isInitialized, setIsInitialized] = useState(false)

  const calendarEvents = useMemo(() => {
    return events.map((event) => {
      const endDate = new Date(event.endDate)
      const calendarEndDate =
        event.startDate !== event.endDate
          ? new Date(endDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : undefined

      return {
        id: String(event.id),
        title: event.title,
        start: event.startDate,
        end: calendarEndDate,
        allDay: true,
        backgroundColor: event.color,
        borderColor: event.color,
        extendedProps: event,
      }
    })
  }, [events])

  return (
    <div className="fullcalendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={calendarEvents}
        height="auto"
        eventClick={(info) => onEventClick?.(info.event.extendedProps as CalendarViewEvent)}
        dateClick={(info) => onDateClick?.(new Date(info.dateStr))}
        datesSet={(info) => {
          if (isInitialized) {
            onMonthChange?.(info.start.toISOString().slice(0, 7))
          } else {
            setIsInitialized(true)
          }
        }}
        dayMaxEventRows={3}
        moreLinkText={t('more')}
        allDayText={t('All day')}
        eventMaxStack={3}
      />
    </div>
  )
}

