import { createClient } from '@supabase/supabase-js';

interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_completed' | 'comment_added' | 'mention' | 'sprint_started' | 'deadline_reminder';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export class NotificationsService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async createNotification(userId: string, notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // In production, this would trigger real-time notification via WebSocket
    // or send email/push notification based on user preferences
    return data;
  }

  async getUserNotifications(userId: string, unreadOnly?: boolean) {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async markAsRead(notificationId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async markAllAsRead(userId: string) {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return data;
  }

  async deleteNotification(notificationId: string, userId: string) {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getUnreadCount(userId: string) {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return data.length;
  }

  // Notification helpers
  async notifyTaskAssigned(taskId: string, assigneeId: string, assignerId: string) {
    const { data: task } = await this.supabase
      .from('tasks')
      .select('title, project_id')
      .eq('id', taskId)
      .single();

    const { data: assigner } = await this.supabase
      .from('profiles')
      .select('name')
      .eq('id', assignerId)
      .single();

    return this.createNotification(assigneeId, {
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `${assigner.name} assigned you to task: ${task.title}`,
      data: { taskId, projectId: task.project_id },
    });
  }

  async notifyTaskCompleted(taskId: string, projectId: string, userId: string) {
    const { data: task } = await this.supabase
      .from('tasks')
      .select('title')
      .eq('id', taskId)
      .single();

    // Notify project members
    const { data: members } = await this.supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId);

    for (const member of members) {
      if (member.user_id !== userId) {
        await this.createNotification(member.user_id, {
          type: 'task_completed',
          title: 'Task Completed',
          message: `Task "${task.title}" has been completed`,
          data: { taskId, projectId },
        });
      }
    }
  }

  async notifyMention(userId: string, mentionedBy: string, taskId: string, comment: string) {
    const { data: mentioner } = await this.supabase
      .from('profiles')
      .select('name')
      .eq('id', mentionedBy)
      .single();

    return this.createNotification(userId, {
      type: 'mention',
      title: 'You were mentioned',
      message: `${mentioner.name} mentioned you in a comment`,
      data: { taskId, comment },
    });
  }

  async notifyDeadlineReminder(taskId: string, userId: string) {
    const { data: task } = await this.supabase
      .from('tasks')
      .select('title, due_date')
      .eq('id', taskId)
      .single();

    return this.createNotification(userId, {
      type: 'deadline_reminder',
      title: 'Deadline Approaching',
      message: `Task "${task.title}" is due on ${new Date(task.due_date).toLocaleDateString()}`,
      data: { taskId },
    });
  }
}
