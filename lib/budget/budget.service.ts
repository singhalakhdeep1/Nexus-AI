import { createClient } from '@supabase/supabase-js';

interface Budget {
  id: string;
  projectId: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
}

interface Expense {
  id: string;
  projectId: string;
  budgetId?: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  date: Date;
  approvedBy?: string;
}

export class BudgetService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async createBudget(budget: Omit<Budget, 'id' | 'spentAmount'>) {
    const { data, error } = await this.supabase
      .from('budgets')
      .insert({
        project_id: budget.projectId,
        category: budget.category,
        allocated_amount: budget.allocatedAmount,
        spent_amount: 0,
        currency: budget.currency,
        period_start: budget.periodStart.toISOString(),
        period_end: budget.periodEnd.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async recordExpense(expense: Omit<Expense, 'id'>) {
    const { data, error } = await this.supabase
      .from('expenses')
      .insert({
        project_id: expense.projectId,
        budget_id: expense.budgetId,
        category: expense.category,
        amount: expense.amount,
        currency: expense.currency,
        description: expense.description,
        date: expense.date.toISOString(),
        approved_by: expense.approvedBy,
      })
      .select()
      .single();

    if (error) throw error;

    // Update budget spent amount if budget is specified
    if (expense.budgetId) {
      await this.updateBudgetSpentAmount(expense.budgetId);
    }

    return data;
  }

  async getProjectBudgets(projectId: string) {
    const { data, error } = await this.supabase
      .from('budgets')
      .select('*')
      .eq('project_id', projectId)
      .order('period_start', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getProjectExpenses(projectId: string, startDate?: Date, endDate?: Date) {
    let query = this.supabase
      .from('expenses')
      .select('*')
      .eq('project_id', projectId);

    if (startDate) {
      query = query.gte('date', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('date', endDate.toISOString());
    }

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getBudgetStatus(budgetId: string) {
    const { data: budget, error } = await this.supabase
      .from('budgets')
      .select('*')
      .eq('id', budgetId)
      .single();

    if (error) throw error;

    const utilization = budget.spent_amount / budget.allocated_amount;
    const remaining = budget.allocated_amount - budget.spent_amount;

    return {
      ...budget,
      utilization,
      remaining,
      isOverBudget: utilization > 1,
      isNearLimit: utilization > 0.8 && utilization <= 1,
    };
  }

  async updateBudgetSpentAmount(budgetId: string) {
    // Calculate total expenses for this budget
    const { data: expenses, error } = await this.supabase
      .from('expenses')
      .select('amount')
      .eq('budget_id', budgetId);

    if (error) throw error;

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Update budget
    const { data, error: updateError } = await this.supabase
      .from('budgets')
      .update({ spent_amount: totalSpent })
      .eq('id', budgetId)
      .select()
      .single();

    if (updateError) throw updateError;
    return data;
  }

  async getBudgetReport(projectId: string, startDate: Date, endDate: Date) {
    const budgets = await this.getProjectBudgets(projectId);
    const expenses = await this.getProjectExpenses(projectId, startDate, endDate);

    const report = {
      totalBudget: 0,
      totalSpent: 0,
      categories: {} as Record<string, { budget: number; spent: number; utilization: number }>,
    };

    for (const budget of budgets) {
      report.totalBudget += budget.allocated_amount;
      report.totalSpent += budget.spent_amount;

      const categoryExpenses = expenses
        .filter(exp => exp.category === budget.category)
        .reduce((sum, exp) => sum + exp.amount, 0);

      report.categories[budget.category] = {
        budget: budget.allocated_amount,
        spent: categoryExpenses,
        utilization: categoryExpenses / budget.allocated_amount,
      };
    }

    return {
      ...report,
      overallUtilization: report.totalSpent / report.totalBudget,
      remaining: report.totalBudget - report.totalSpent,
    };
  }

  async approveExpense(expenseId: string, approverId: string) {
    const { data, error } = await this.supabase
      .from('expenses')
      .update({ approved_by: approverId })
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
