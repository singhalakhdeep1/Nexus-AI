import { createClient } from '@supabase/supabase-js';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  createdBy: string;
  isPublic: boolean;
  config: {
    taskStructure: any[];
    defaultSprints: any[];
    labels: string[];
    workflows: any[];
  };
}

export class ProjectTemplatesService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async createTemplate(userId: string, template: Omit<ProjectTemplate, 'id' | 'createdBy'>) {
    const { data, error } = await this.supabase
      .from('project_templates')
      .insert({
        name: template.name,
        description: template.description,
        category: template.category,
        created_by: userId,
        is_public: template.isPublic,
        config: template.config,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTemplates(category?: string, isPublic?: boolean) {
    let query = this.supabase
      .from('project_templates')
      .select('*');

    if (category) {
      query = query.eq('category', category);
    }

    if (isPublic !== undefined) {
      query = query.eq('is_public', isPublic);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data;
  }

  async getTemplate(id: string) {
    const { data, error } = await this.supabase
      .from('project_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async applyTemplate(templateId: string, projectId: string, userId: string) {
    const template = await this.getTemplate(templateId);
    
    // Create tasks from template structure
    const tasks = [];
    for (const taskConfig of template.config.taskStructure) {
      const { data, error } = await this.supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          title: taskConfig.title,
          description: taskConfig.description,
          status: taskConfig.status || 'todo',
          priority: taskConfig.priority || 'medium',
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      tasks.push(data);
    }

    // Create sprints from template
    const sprints = [];
    for (const sprintConfig of template.config.defaultSprints) {
      const { data, error } = await this.supabase
        .from('sprints')
        .insert({
          project_id: projectId,
          name: sprintConfig.name,
          start_date: sprintConfig.startDate,
          end_date: sprintConfig.endDate,
          goal: sprintConfig.goal,
        })
        .select()
        .single();

      if (error) throw error;
      sprints.push(data);
    }

    // Create labels
    const labels = [];
    for (const label of template.config.labels) {
      const { data, error } = await this.supabase
        .from('labels')
        .insert({
          project_id: projectId,
          name: label.name,
          color: label.color,
        })
        .select()
        .single();

      if (error) throw error;
      labels.push(data);
    }

    return {
      tasks,
      sprints,
      labels,
    };
  }

  async updateTemplate(id: string, userId: string, updates: Partial<ProjectTemplate>) {
    const template = await this.getTemplate(id);
    
    if (template.created_by !== userId) {
      throw new Error('You can only update your own templates');
    }

    const { data, error } = await this.supabase
      .from('project_templates')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.description && { description: updates.description }),
        ...(updates.category && { category: updates.category }),
        ...(updates.isPublic !== undefined && { is_public: updates.isPublic }),
        ...(updates.config && { config: updates.config }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTemplate(id: string, userId: string) {
    const template = await this.getTemplate(id);
    
    if (template.created_by !== userId) {
      throw new Error('You can only delete your own templates');
    }

    const { error } = await this.supabase
      .from('project_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getTemplateCategories() {
    const { data, error } = await this.supabase
      .from('project_templates')
      .select('category');

    if (error) throw error;

    const categories = [...new Set(data.map(t => t.category))];
    return categories;
  }
}
