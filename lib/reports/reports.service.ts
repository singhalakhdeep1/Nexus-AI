import { createClient } from '@supabase/supabase-js';

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  projectId?: string;
  filters: any;
  columns: string[];
  groupBy?: string[];
  aggregations?: any[];
}

export class ReportsService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async createReportConfig(userId: string, config: Omit<ReportConfig, 'id' | 'createdBy'>) {
    const { data, error } = await this.supabase
      .from('report_configs')
      .insert({
        name: config.name,
        description: config.description,
        created_by: userId,
        project_id: config.projectId,
        filters: config.filters,
        columns: config.columns,
        group_by: config.groupBy,
        aggregations: config.aggregations,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async generateReport(configId: string) {
    const { data: config, error } = await this.supabase
      .from('report_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (error) throw error;

    let query = this.supabase
      .from('tasks')
      .select(config.columns.join(', '));

    if (config.filters) {
      for (const [key, value] of Object.entries(config.filters)) {
        query = query.eq(key, value);
      }
    }

    if (config.project_id) {
      query = query.eq('project_id', config.project_id);
    }

    const { data: tasks, error: queryError } = await query;
    if (queryError) throw queryError;

    let reportData = tasks;
    if (config.group_by && config.group_by.length > 0) {
      reportData = this.groupData(tasks, config.group_by);
    }

    if (config.aggregations && config.aggregations.length > 0) {
      reportData = this.applyAggregations(reportData, config.aggregations);
    }

    return {
      config,
      data: reportData,
      generatedAt: new Date(),
    };
  }

  async getReportConfigs(userId: string, projectId?: string) {
    let query = this.supabase
      .from('report_configs')
      .select('*')
      .eq('created_by', userId);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data;
  }

  async deleteReportConfig(configId: string, userId: string) {
    const config = await this.getReportConfig(configId);
    
    if (config.created_by !== userId) {
      throw new Error('You can only delete your own report configs');
    }

    const { error } = await this.supabase
      .from('report_configs')
      .delete()
      .eq('id', configId);

    if (error) throw error;
  }

  async exportReport(configId: string, format: 'csv' | 'json') {
    const report = await this.generateReport(configId);

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'csv':
        return this.convertToCSV(report.data);
      default:
        throw new Error('Unsupported format');
    }
  }

  private async getReportConfig(configId: string) {
    const { data, error } = await this.supabase
      .from('report_configs')
      .select('*')
      .eq('id', configId)
      .single();

    if (error) throw error;
    return data;
  }

  private groupData(data: any[], groupBy: string[]) {
    const grouped = data.reduce((acc, item) => {
      const key = groupBy.map(field => item[field]).join('|');
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).map(([key, items]) => ({
      group: key,
      items,
      count: items.length,
    }));
  }

  private applyAggregations(data: any[], aggregations: any[]) {
    return data.map(group => {
      const result = { ...group };
      
      for (const agg of aggregations) {
        switch (agg.type) {
          case 'count':
            result[agg.field] = group.items.length;
            break;
          case 'sum':
            result[agg.field] = group.items.reduce((sum: number, item: any) => sum + (item[agg.sourceField] || 0), 0);
            break;
          case 'avg':
            const sum = group.items.reduce((sum: number, item: any) => sum + (item[agg.sourceField] || 0), 0);
            result[agg.field] = sum / group.items.length;
            break;
          case 'min':
            result[agg.field] = Math.min(...group.items.map((item: any) => item[agg.sourceField] || 0));
            break;
          case 'max':
            result[agg.field] = Math.max(...group.items.map((item: any) => item[agg.sourceField] || 0));
            break;
        }
      }

      return result;
    });
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  async getProjectSummary(projectId: string) {
    const { data: tasks } = await this.supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId);

    const { data: sprints } = await this.supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId);

    const summary = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t: any) => t.status === 'done').length,
      inProgressTasks: tasks.filter((t: any) => t.status === 'in_progress').length,
      todoTasks: tasks.filter((t: any) => t.status === 'todo').length,
      totalSprints: sprints.length,
      activeSprints: sprints.filter((s: any) => {
        const now = new Date();
        return new Date(s.start_date) <= now && new Date(s.end_date) >= now;
      }).length,
      tasksByPriority: {
        high: tasks.filter((t: any) => t.priority === 'high').length,
        medium: tasks.filter((t: any) => t.priority === 'medium').length,
        low: tasks.filter((t: any) => t.priority === 'low').length,
      },
    };

    return summary;
  }
}
