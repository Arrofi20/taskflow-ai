export type TaskForPrioritization = {
  id: string;
  title: string;
  task_type: string;
  due_date: string | null;
  estimated_hours: number | null;
  status: string;
};

export type PrioritizedTaskResult = {
  id: string;
  prioritas: number;
  tingkat_kesulitan: number;
  alasan: string;
};

export type PrioritizeTasksResponse = {
  tasks: PrioritizedTaskResult[];
};

export type PrioritizeApiResponse = {
  success: true;
  analyzedCount: number;
  tasks: PrioritizedTaskResult[];
};

export type PrioritizeApiError = {
  success: false;
  error: string;
};
