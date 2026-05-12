/**
 * Hand-written Database types — replace with `supabase gen types typescript`
 * (or the Supabase MCP `generate_typescript_types` tool) once the project is
 * provisioned. Until then, this gives `@supabase/ssr` the typings it needs
 * for `from('certificates').select(...)` calls to be type-checked.
 *
 * Keep in sync with `supabase/migrations/0001_init.sql`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CertificateStatus = "draft" | "published" | "revoked";
export type CampaignStatus = "draft" | "published" | "archived";
export type ProfileRole = "super_admin" | "admin" | "viewer";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: ProfileRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: ProfileRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          issue_date: string;
          signer_name: string | null;
          signer_title: string | null;
          drive_folder_id: string | null;
          status: CampaignStatus;
          template_config: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          issue_date: string;
          signer_name?: string | null;
          signer_title?: string | null;
          drive_folder_id?: string | null;
          status?: CampaignStatus;
          template_config?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
        Relationships: [];
      };
      certificates: {
        Row: {
          id: string;
          campaign_id: string;
          student_code: string;
          full_name: string;
          full_name_normalized: string;
          class_name: string | null;
          email: string | null;
          date_of_birth: string | null;
          certificate_title: string | null;
          issue_date: string;
          file_name: string;
          drive_file_id: string | null;
          drive_view_url: string | null;
          drive_download_url: string | null;
          verification_code: string;
          qr_payload: string;
          status: CertificateStatus;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          student_code: string;
          full_name: string;
          full_name_normalized: string;
          class_name?: string | null;
          email?: string | null;
          date_of_birth?: string | null;
          certificate_title?: string | null;
          issue_date: string;
          file_name: string;
          drive_file_id?: string | null;
          drive_view_url?: string | null;
          drive_download_url?: string | null;
          verification_code: string;
          qr_payload: string;
          status?: CertificateStatus;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["certificates"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "certificates_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      import_batches: {
        Row: {
          id: string;
          campaign_id: string;
          original_file_name: string | null;
          row_count: number;
          success_count: number;
          error_count: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          original_file_name?: string | null;
          row_count?: number;
          success_count?: number;
          error_count?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["import_batches"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "import_batches_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      lookup_logs: {
        Row: {
          id: string;
          student_code: string | null;
          verification_code: string | null;
          certificate_id: string | null;
          success: boolean;
          ip_hash: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_code?: string | null;
          verification_code?: string | null;
          certificate_id?: string | null;
          success: boolean;
          ip_hash?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lookup_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      public_lookup_certificate: {
        Args: { p_student_code: string };
        Returns: PublicCertificate[];
      };
      public_verify_certificate: {
        Args: { p_code: string };
        Returns: PublicCertificate[];
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
};

/**
 * The narrow subset of certificate fields safe to expose to anonymous users
 * via `public_lookup_certificate` / `public_verify_certificate`. Mirrors the
 * RPC return type in `0003_rpc_public_lookup.sql`.
 */
export type PublicCertificate = {
  student_code: string;
  full_name: string;
  certificate_title: string | null;
  issue_date: string;
  signer_name: string | null;
  signer_title: string | null;
  campaign_title: string;
  verification_code: string;
  drive_view_url: string | null;
  drive_download_url: string | null;
};
