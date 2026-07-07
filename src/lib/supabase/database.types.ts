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
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          task_type: TaskType;
          due_date: string | null;
          estimated_hours: number | null;
          prioritas: number | null;
          tingkat_kesulitan: number | null;
          priority: number;
          status: TaskStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          task_type?: TaskType;
          due_date?: string | null;
          estimated_hours?: number | null;
          prioritas?: number | null;
          tingkat_kesulitan?: number | null;
          priority?: number;
          status?: TaskStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          task_type?: TaskType;
          due_date?: string | null;
          estimated_hours?: number | null;
          prioritas?: number | null;
          tingkat_kesulitan?: number | null;
          priority?: number;
          status?: TaskStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      study_schedules: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          scheduled_date: string;
          start_time: string | null;
          end_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          scheduled_date: string;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          scheduled_date?: string;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
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

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type StudySchedule = Database["public"]["Tables"]["study_schedules"]["Row"];
