export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      attendances: {
        Row: {
          attendance_date: string | null;
          created_at: string;
          id: string;
          lecture_id: string | null;
          status: Database["public"]["Enums"]["attendance_status"] | null;
          student_id: string | null;
        };
        Insert: {
          attendance_date?: string | null;
          created_at?: string;
          id?: string;
          lecture_id?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"] | null;
          student_id?: string | null;
        };
        Update: {
          attendance_date?: string | null;
          created_at?: string;
          id?: string;
          lecture_id?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"] | null;
          student_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_enrollments";
            columns: ["student_id", "lecture_id"];
            isOneToOne: false;
            referencedRelation: "enrollments";
            referencedColumns: ["student_id", "lecture_id"];
          },
        ];
      };
      classrooms: {
        Row: {
          created_at: string;
          id: string;
          name: string | null;
          school_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name?: string | null;
          school_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string | null;
          school_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "classrooms_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          created_at: string;
          lecture_id: string;
          student_id: string;
        };
        Insert: {
          created_at?: string;
          lecture_id: string;
          student_id: string;
        };
        Update: {
          created_at?: string;
          lecture_id?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_lecture_id_fkey";
            columns: ["lecture_id"];
            isOneToOne: false;
            referencedRelation: "lectures";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      lectures: {
        Row: {
          classroom_id: string | null;
          created_at: string;
          holiday: Json[] | null;
          id: string;
          module: string | null;
          name: string | null;
          schedule: Json[] | null;
          semester: string | null;
          teacher_id: string | null;
        };
        Insert: {
          classroom_id?: string | null;
          created_at?: string;
          holiday?: Json[] | null;
          id?: string;
          module?: string | null;
          name?: string | null;
          schedule?: Json[] | null;
          semester?: string | null;
          teacher_id?: string | null;
        };
        Update: {
          classroom_id?: string | null;
          created_at?: string;
          holiday?: Json[] | null;
          id?: string;
          module?: string | null;
          name?: string | null;
          schedule?: Json[] | null;
          semester?: string | null;
          teacher_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lecturess_classroom_id_fkey";
            columns: ["classroom_id"];
            isOneToOne: false;
            referencedRelation: "classrooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lecturess_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          },
        ];
      };
      schools: {
        Row: {
          created_at: string;
          id: string;
          name: string | null;
          semester_schedule: Json[] | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name?: string | null;
          semester_schedule?: Json[] | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string | null;
          semester_schedule?: Json[] | null;
        };
        Relationships: [];
      };
      students: {
        Row: {
          created_at: string;
          device_name: string | null;
          id: string;
          last_detected_place: string | null;
          name: string | null;
          num: string | null;
          school_id: string | null;
        };
        Insert: {
          created_at?: string;
          device_name?: string | null;
          id?: string;
          last_detected_place?: string | null;
          name?: string | null;
          num?: string | null;
          school_id?: string | null;
        };
        Update: {
          created_at?: string;
          device_name?: string | null;
          id?: string;
          last_detected_place?: string | null;
          name?: string | null;
          num?: string | null;
          school_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "students_last_detected_place_fkey";
            columns: ["last_detected_place"];
            isOneToOne: false;
            referencedRelation: "classrooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      teachers: {
        Row: {
          created_at: string;
          id: string;
          is_admin: boolean | null;
          name: string | null;
          school_id: string | null;
        };
        Insert: {
          created_at?: string;
          id: string;
          is_admin?: boolean | null;
          name?: string | null;
          school_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_admin?: boolean | null;
          name?: string | null;
          school_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      temporal_lectures: {
        Row: {
          classroom_id: string | null;
          created_at: string;
          id: string;
          module: string | null;
          name: string | null;
          schedule: Json[] | null;
          teacher_id: string | null;
        };
        Insert: {
          classroom_id?: string | null;
          created_at?: string;
          id?: string;
          module?: string | null;
          name?: string | null;
          schedule?: Json[] | null;
          teacher_id?: string | null;
        };
        Update: {
          classroom_id?: string | null;
          created_at?: string;
          id?: string;
          module?: string | null;
          name?: string | null;
          schedule?: Json[] | null;
          teacher_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "temporal_lectures_classroom_id_fkey";
            columns: ["classroom_id"];
            isOneToOne: false;
            referencedRelation: "classrooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "temporal_lectures_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
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
      attendance_status:
        | "present"
        | "absent"
        | "late"
        | "excused"
        | "sick leave";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      attendance_status: ["present", "absent", "late", "excused", "sick leave"],
    },
  },
} as const;
