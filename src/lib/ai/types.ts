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

export type ScheduleGenerationRequest = {
  tasks: Array<{
    id: string;
    title: string;
    deadline: string | null;
    estimated_hours: number | null;
    task_type: string | null;
    prioritas: number | null;
  }>;
  freeSlots: Array<{
    day: string;
    start: string;
    end: string;
  }>;
};

export type GeneratedScheduleItem = {
  taskId: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
};

export type ScheduleGenerationResponse = {
  schedules: GeneratedScheduleItem[];
};

export type ScheduleApiResponse = {
  success: true;
  schedules: GeneratedScheduleItem[];
};

export type ScheduleApiError = {
  success: false;
  error: string;
};
