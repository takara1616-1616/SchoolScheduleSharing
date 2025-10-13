export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      announcements: {
        Row: {
          id: number;
          subject_id: number | null;
          subsubject_id: number | null;
          created_by: number | null;
          title: string;
          description: string;
          type: string;
          due_date: string | null;
          expire_at: string | null;
          created_at: string;
          submission_method: string;
        };
        Insert: {
          id?: number;
          subject_id?: number | null;
          subsubject_id?: number | null;
          created_by?: number | null;
          title: string;
          description: string;
          type: string;
          due_date?: string | null;
          expire_at?: string | null;
          created_at?: string;
          submission_method: string;
        };
        Update: {
          id?: number;
          subject_id?: number | null;
          subsubject_id?: number | null;
          created_by?: number | null;
          title?: string;
          description?: string;
          type?: string;
          due_date?: string | null;
          expire_at?: string | null;
          created_at?: string;
          submission_method?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ANNOUNCEMENTS_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ANNOUNCEMENTS_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ANNOUNCEMENTS_subsubject_id_fkey";
            columns: ["subsubject_id"];
            isOneToOne: false;
            referencedRelation: "subsubjects";
            referencedColumns: ["id"];
          },
        ];
      };
      subjects: {
        Row: {
          id: number;
          name: string;
        };
        Insert: {
          id?: number;
          name: string;
        };
        Update: {
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      subsubjects: {
        Row: {
          id: number;
          subject_id: number | null;
          name: string;
        };
        Insert: {
          id?: number;
          subject_id?: number | null;
          name: string;
        };
        Update: {
          id?: number;
          subject_id?: number | null;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "SUBSUBJECTS_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      submissions: {
        Row: {
          id: number;
          announcement_id: number | null;
          subsubject_id: number | null;
          teacher_id: number | null;
          user_id: number | null;
          submitted_at: string | null;
          status: string;
          submission_method: string;
        };
        Insert: {
          id?: number;
          announcement_id?: number | null;
          subsubject_id?: number | null;
          teacher_id?: number | null;
          user_id?: number | null;
          submitted_at?: string | null;
          status: string;
          submission_method: string;
        };
        Update: {
          id?: number;
          announcement_id?: number | null;
          subsubject_id?: number | null;
          teacher_id?: number | null;
          user_id?: number | null;
          submitted_at?: string | null;
          status?: string;
          submission_method?: string;
        };
        Relationships: [
          {
            foreignKeyName: "SUBMISSIONS_announcement_id_fkey";
            columns: ["announcement_id"];
            isOneToOne: false;
            referencedRelation: "announcements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "SUBMISSIONS_subsubject_id_fkey";
            columns: ["subsubject_id"];
            isOneToOne: false;
            referencedRelation: "subsubjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "SUBMISSIONS_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "SUBMISSIONS_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          id: number;
          name: string | null;
          email: string | null;
          password_hash: string | null;
          ms_account_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name?: string | null;
          email?: string | null;
          password_hash?: string | null;
          ms_account_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string | null;
          email?: string | null;
          password_hash?: string | null;
          ms_account_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      schedules: {
        Row: {
          id: number;
          user_id: number;
          subject_id: number | null;
          subsubject_id: number | null;
          location_id: number | null;
          title: string;
          description: string;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: number;
          subject_id?: number | null;
          subsubject_id?: number | null;
          location_id?: number | null;
          title: string;
          description: string;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: number;
          subject_id?: number | null;
          subsubject_id?: number | null;
          location_id?: number | null;
          title?: string;
          description?: string;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schedules_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schedules_subsubject_id_fkey";
            columns: ["subsubject_id"];
            isOneToOne: false;
            referencedRelation: "subsubjects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database['public'];

export type Tables<
  TableName extends keyof PublicSchema['Tables']
> = {
  Row: PublicSchema['Tables'][TableName]['Row'];
  Insert: PublicSchema['Tables'][TableName]['Insert'];
  Update: PublicSchema['Tables'][TableName]['Update'];
};

export type Enums<EnumName extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][EnumName];
