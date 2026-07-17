export type TaskForPrioritization = {
  id: string;
  title: string;
  mata_kuliah?: string | null;
  task_type: string;
  due_date: string | null;
  estimated_hours: number | null;
  status: string;
};

export type PrioritizedTaskResult = {
  id: string;
  ai_score: number;
  risk_percentage: number;
  tingkat_kesulitan: number;
  alasan: string;
  // Premium fields
  faktor_analisis?: {
    deadline_weight: number;
    jenis_weight: number;
    estimasi_weight: number;
    histori_weight: number;
  };
  rekomendasi_tindakan?: string;
  strategi_mitigasi?: string;
  waktu_pengerjaan_optimal?: string;
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
    ai_score?: number | null;
  }>;
  freeSlots: Array<{
    day: string;
    start: string;
    end: string;
  }>;
  productiveHours: number[];
};

export type GeneratedScheduleItem = {
  taskId: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  rekomendasi_ai?: string;
  // Premium fields
  durasi_istirahat?: number;
  energi_level?: "tinggi" | "sedang" | "rendah";
  tips_fokus?: string;
};

export type ScheduleGenerationResponse = {
  schedules: GeneratedScheduleItem[];
};

export type ScheduleApiResponse = {
  success: true;
  schedules: GeneratedScheduleItem[];
  // Premium fields
  analisis_gaya_belajar?: {
    tipe_belajar: string;
    jam_optimal: string[];
    pola_belajar: string;
  };
  rekomendasi_umum?: string[];
};

export type ScheduleApiError = {
  success: false;
  error: string;
};

export type RiskPredictionResult = {
  task_id: string;
  risk_percentage: number;
  reason: string;
};

export type AlertApiResponse = {
  success: true;
  alerts: Array<{
    title: string;
    message: string;
    severity: string;
  }>;
  riskPredictions: RiskPredictionResult[];
};

export type AlertApiError = {
  success: false;
  error: string;
};
