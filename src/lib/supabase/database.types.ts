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
          tingkat_kesulitan: number | null;
          prioritas: number | null;
          status: TaskStatus;
          created_at: string;
          completed_at: string | null;
          actual_hours: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          nama_tugas: string;
          jenis_tugas: TaskType;
          deadline: string;
          estimasi_waktu?: number | null;
          tingkat_kesulitan?: number | null;
          prioritas?: number | null;
          status?: TaskStatus;
          created_at?: string;
          completed_at?: string | null;
          actual_hours?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          nama_tugas?: string;
          jenis_tugas?: TaskType;
          deadline?: string;
          estimasi_waktu?: number | null;
          tingkat_kesulitan?: number | null;
          prioritas?: number | null;
          status?: TaskStatus;
          created_at?: string;
          completed_at?: string | null;
          actual_hours?: number | null;
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
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          is_premium: boolean;
          premium_until: string | null;
          onboarding_completed: boolean;
          referral_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          is_premium?: boolean;
          premium_until?: string | null;
          onboarding_completed?: boolean;
          referral_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          is_premium?: boolean;
          premium_until?: string | null;
          onboarding_completed?: boolean;
          referral_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string | null;
          referral_code: string;
          status: "pending" | "completed";
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_id?: string | null;
          referral_code: string;
          status?: "pending" | "completed";
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          referred_id?: string | null;
          referral_code?: string;
          status?: "pending" | "completed";
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      b2b_leads: {
        Row: {
          id: string;
          institution_name: string;
          contact_name: string;
          email: string;
          phone: string | null;
          message: string | null;
          status: "new" | "contacted" | "qualified" | "closed";
          created_at: string;
        };
        Insert: {
          id?: string;
          institution_name: string;
          contact_name: string;
          email: string;
          phone?: string | null;
          message?: string | null;
          status?: "new" | "contacted" | "qualified" | "closed";
          created_at?: string;
        };
        Update: {
          id?: string;
          institution_name?: string;
          contact_name?: string;
          email?: string;
          phone?: string | null;
          message?: string | null;
          status?: "new" | "contacted" | "qualified" | "closed";
          created_at?: string;
        };
        Relationships: [];
      };
      user_streaks: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_active_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
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

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type ScheduleItem = Database["public"]["Tables"]["schedules"]["Row"];
export type FreeTimeItem = Database["public"]["Tables"]["free_time"]["Row"];
export type AlertItem = Database["public"]["Tables"]["alerts"]["Row"];
export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
export type Referral = Database["public"]["Tables"]["referrals"]["Row"];
export type B2BLead = Database["public"]["Tables"]["b2b_leads"]["Row"];
export type UserStreak = Database["public"]["Tables"]["user_streaks"]["Row"];
export type PushSubscription = Database["public"]["Tables"]["push_subscriptions"]["Row"];
