import { createClient } from '@supabase/supabase-js';

interface TimeEntry {
  id: string;
  userId: string;
  taskId: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  description?: string;
  billable: boolean;
}

export class TimeTrackingService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async startTimeEntry(userId: string, taskId: string, projectId: string, description?: string) {
    const { data, error } = await this.supabase
      .from('time_entries')
      .insert({
        user_id: userId,
        task_id: taskId,
        project_id: projectId,
        start_time: new Date().toISOString(),
        description,
        billable: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async stopTimeEntry(entryId: string) {
    const entry = await this.getTimeEntry(entryId);
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - new Date(entry.start_time).getTime()) / 1000);

    const { data, error } = await this.supabase
      .from('time_entries')
      .update({
        end_time: endTime.toISOString(),
        duration,
      })
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTimeEntry(entryId: string) {
    const { data, error } = await this.supabase
      .from('time_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserTimeEntries(userId: string, startDate?: Date, endDate?: Date) {
    let query = this.supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('start_time', endDate.toISOString());
    }

    const { data, error } = await query.order('start_time', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getTaskTimeEntries(taskId: string) {
    const { data, error } = await this.supabase
      .from('time_entries')
      .select('*')
      .eq('task_id', taskId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getProjectTimeEntries(projectId: string) {
    const { data, error } = await this.supabase
      .from('time_entries')
      .select('*')
      .eq('project_id', projectId)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getActiveTimeEntry(userId: string) {
    const { data, error } = await this.supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .is('end_time', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async deleteTimeEntry(entryId: string) {
    const { error } = await this.supabase
      .from('time_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
  }

  async getTimeReport(projectId: string, startDate: Date, endDate: Date) {
    const entries = await this.getProjectTimeEntries(projectId);
    
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.start_time);
      return entryDate >= startDate && entryDate <= endDate;
    });

    const totalDuration = filteredEntries.reduce((sum, entry) => {
      return sum + (entry.duration || 0);
    }, 0);

    const billableDuration = filteredEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);

    const byUser = filteredEntries.reduce((acc, entry) => {
      acc[entry.user_id] = (acc[entry.user_id] || 0) + (entry.duration || 0);
      return acc;
    }, {} as Record<string, number>);

    const byTask = filteredEntries.reduce((acc, entry) => {
      acc[entry.task_id] = (acc[entry.task_id] || 0) + (entry.duration || 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDuration,
      billableDuration,
      totalEntries: filteredEntries.length,
      byUser,
      byTask,
    };
  }
}
