export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskType = "tugas" | "ujian" | "proyek" | "presentasi";

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          user_id: string;
          nama_tugas: string;
          jenis_tugas: TaskType;
          deadline: string;
          estimasi_waktu: number | null;
          tingkat_kesulitan: string | null;
          prioritas: number | null;
          status: TaskStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nama_tugas: string;
          jenis_tugas: TaskType;
          deadline: string;
          estimasi_waktu?: number | null;
          tingkat_kesulitan?: string | null;
          prioritas?: number | null;
          status?: TaskStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nama_tugas?: string;
          jenis_tugas?: TaskType;
          deadline?: string;
          estimasi_waktu?: number | null;
          tingkat_kesulitan?: string | null;
          prioritas?: number | null;
          status?: TaskStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      schedules: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          waktu_mulai: string;
          waktu_selesai: string;
          rekomendasi_ai: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id: string;
          waktu_mulai: string;
          waktu_selesai: string;
          rekomendasi_ai?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string;
          waktu_mulai?: string;
          waktu_selesai?: string;
          rekomendasi_ai?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedules_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          }
        ];
      };
      free_time: {
        Row: {
          id: string;
          user_id: string;
          hari: string;
          jam_mulai: string;
          jam_selesai: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hari: string;
          jam_mulai: string;
          jam_selesai: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          hari?: string;
          jam_mulai?: string;
          jam_selesai?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          task_id: string | null;
          title: string;
          message: string;
          severity: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id?: string | null;
          title: string;
          message: string;
          severity?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string | null;
          title?: string;
          message?: string;
          severity?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type ScheduleItem = Database["public"]["Tables"]["schedules"]["Row"];
export type FreeTimeItem = Database["public"]["Tables"]["free_time"]["Row"];
export type AlertItem = Database["public"]["Tables"]["alerts"]["Row"];
