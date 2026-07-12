import { createClient } from '@supabase/supabase-js';

interface Resource {
  id: string;
  userId: string;
  name: string;
  role: string;
  availability: number; // percentage (0-100)
  skills: string[];
  hourlyRate?: number;
}

interface Allocation {
  id: string;
  resourceId: string;
  projectId: string;
  taskId?: string;
  startDate: Date;
  endDate: Date;
  allocation: number; // percentage (0-100)
}

export class ResourceAllocationService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async createResource(resource: Omit<Resource, 'id'>) {
    const { data, error } = await this.supabase
      .from('resources')
      .insert({
        user_id: resource.userId,
        name: resource.name,
        role: resource.role,
        availability: resource.availability,
        skills: resource.skills,
        hourly_rate: resource.hourlyRate,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async allocateResource(allocation: Omit<Allocation, 'id'>) {
    const { data, error } = await this.supabase
      .from('resource_allocations')
      .insert({
        resource_id: allocation.resourceId,
        project_id: allocation.projectId,
        task_id: allocation.taskId,
        start_date: allocation.startDate.toISOString(),
        end_date: allocation.endDate.toISOString(),
        allocation: allocation.allocation,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getResourceAllocations(resourceId: string, startDate?: Date, endDate?: Date) {
    let query = this.supabase
      .from('resource_allocations')
      .select('*, resources(*), projects(*)')
      .eq('resource_id', resourceId);

    if (startDate) {
      query = query.gte('start_date', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('end_date', endDate.toISOString());
    }

    const { data, error } = await query.order('start_date', { ascending: true });
    if (error) throw error;
    return data;
  }

  async getProjectAllocations(projectId: string) {
    const { data, error } = await this.supabase
      .from('resource_allocations')
      .select('*, resources(*)')
      .eq('project_id', projectId)
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getAvailableResources(startDate: Date, endDate: Date, requiredSkills?: string[]) {
    const { data: resources, error } = await this.supabase
      .from('resources')
      .select('*');

    if (error) throw error;

    const availableResources = [];

    for (const resource of resources) {
      const allocations = await this.getResourceAllocations(resource.id, startDate, endDate);
      
      // Calculate total allocation during the period
      const totalAllocation = allocations.reduce((sum, alloc) => {
        return sum + alloc.allocation;
      }, 0);

      const available = resource.availability - totalAllocation;

      if (available > 0) {
        // Check if resource has required skills
        const hasSkills = !requiredSkills || 
          requiredSkills.every(skill => resource.skills.includes(skill));

        if (hasSkills) {
          availableResources.push({
            ...resource,
            availableAllocation: available,
          });
        }
      }
    }

    return availableResources;
  }

  async getResourceUtilization(resourceId: string, startDate: Date, endDate: Date) {
    const allocations = await this.getResourceAllocations(resourceId, startDate, endDate);
    
    const totalAllocation = allocations.reduce((sum, alloc) => {
      const days = Math.ceil(
        (new Date(alloc.end_date).getTime() - new Date(alloc.start_date).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      return sum + (alloc.allocation * days);
    }, 0);

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const utilization = totalAllocation / (totalDays * 100);

    return {
      resourceId,
      utilization: Math.min(utilization, 1),
      totalAllocation,
      totalDays,
    };
  }

  async updateAllocation(allocationId: string, updates: Partial<Allocation>) {
    const { data, error } = await this.supabase
      .from('resource_allocations')
      .update({
        ...(updates.startDate && { start_date: updates.startDate.toISOString() }),
        ...(updates.endDate && { end_date: updates.endDate.toISOString() }),
        ...(updates.allocation && { allocation: updates.allocation }),
      })
      .eq('id', allocationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAllocation(allocationId: string) {
    const { error } = await this.supabase
      .from('resource_allocations')
      .delete()
      .eq('id', allocationId);

    if (error) throw error;
  }
}
