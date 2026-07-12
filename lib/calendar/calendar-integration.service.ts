import { createClient } from '@supabase/supabase-js';

interface CalendarEvent {
  id: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees?: string[];
  externalCalendarId?: string;
  provider?: 'google' | 'outlook' | 'apple';
}

export class CalendarIntegrationService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async syncTaskToCalendar(taskId: string, userId: string, provider: 'google' | 'outlook') {
    const { data: task, error } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) throw error;

    // Create calendar event from task
    const event: Omit<CalendarEvent, 'id'> = {
      userId,
      taskId,
      title: task.title,
      description: task.description,
      startDate: new Date(task.due_date || new Date()),
      endDate: new Date(task.due_date || new Date()),
      provider,
    };

    const { data: calendarEvent, error: eventError } = await this.supabase
      .from('calendar_events')
      .insert({
        user_id: userId,
        task_id: taskId,
        title: event.title,
        description: event.description,
        start_date: event.startDate.toISOString(),
        end_date: event.endDate.toISOString(),
        provider,
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // In production, this would call the external calendar API
    // For now, we just store the reference
    return calendarEvent;
  }

  async syncSprintToCalendar(sprintId: string, userId: string, provider: 'google' | 'outlook') {
    const { data: sprint, error } = await this.supabase
      .from('sprints')
      .select('*')
      .eq('id', sprintId)
      .single();

    if (error) throw error;

    const event: Omit<CalendarEvent, 'id'> = {
      userId,
      projectId: sprint.project_id,
      title: `Sprint: ${sprint.name}`,
      description: sprint.goal,
      startDate: new Date(sprint.start_date),
      endDate: new Date(sprint.end_date),
      provider,
    };

    const { data: calendarEvent, error: eventError } = await this.supabase
      .from('calendar_events')
      .insert({
        user_id: userId,
        project_id: event.projectId,
        title: event.title,
        description: event.description,
        start_date: event.startDate.toISOString(),
        end_date: event.endDate.toISOString(),
        provider,
      })
      .select()
      .single();

    if (eventError) throw eventError;
    return calendarEvent;
  }

  async getCalendarEvents(userId: string, startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', startDate.toISOString())
      .lte('end_date', endDate.toISOString())
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  async updateCalendarEvent(eventId: string, updates: Partial<CalendarEvent>) {
    const { data, error } = await this.supabase
      .from('calendar_events')
      .update({
        ...(updates.title && { title: updates.title }),
        ...(updates.description && { description: updates.description }),
        ...(updates.startDate && { start_date: updates.startDate.toISOString() }),
        ...(updates.endDate && { end_date: updates.endDate.toISOString() }),
        ...(updates.location && { location: updates.location }),
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCalendarEvent(eventId: string) {
    const { error } = await this.supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  }

  async connectExternalCalendar(userId: string, provider: 'google' | 'outlook', accessToken: string) {
    const { data, error } = await this.supabase
      .from('calendar_connections')
      .upsert({
        user_id: userId,
        provider,
        access_token: accessToken,
        connected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async disconnectExternalCalendar(userId: string, provider: 'google' | 'outlook') {
    const { error } = await this.supabase
      .from('calendar_connections')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);

    if (error) throw error;
  }

  async getCalendarConnection(userId: string, provider: 'google' | 'outlook') {
    const { data, error } = await this.supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}
