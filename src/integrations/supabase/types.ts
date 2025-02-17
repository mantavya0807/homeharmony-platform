export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          role: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          role?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          roomTag: any;
          address: string;
          unit: string;
          bathrooms: number;
          bedrooms: number;
          city: string;
          created_at: string;
          description: string | null;
          id: string;
          images: string[] | null;
          price: number;
          property_type: Database["public"]["Enums"]["property_type"];
          seller_id: string | null;
          square_feet: number;
          state: string;
          title: string;
          updated_at: string;
          zip_code: string;
        };
        Insert: {
          address: string;
          unit: string;
          bathrooms: number;
          bedrooms: number;
          city: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: string[] | null;
          price: number;
          property_type: Database["public"]["Enums"]["property_type"];
          seller_id?: string | null;
          square_feet: number;
          state: string;
          title: string;
          updated_at?: string;
          zip_code: string;
        };
        Update: {
          address?: string;
          unit?: string;
          bathrooms?: number;
          bedrooms?: number;
          city?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: string[] | null;
          price?: number;
          property_type?: Database["public"]["Enums"]["property_type"];
          seller_id?: string | null;
          square_feet?: number;
          state?: string;
          title?: string;
          updated_at?: string;
          zip_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "properties_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      saved_properties: {
        Row: {
          created_at: string;
          id: string;
          property_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          property_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          property_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_properties_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      // Add your new table here:
      property_media: {
        Row: {
          id: string;
          property_id: string;
          bedroom: string[] | null;
          living_room: string[] | null;
          bathroom: string[] | null;
          kitchen: string[] | null;
          floorplan: string[] | null;
          other: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          bedroom?: string[] | null;
          living_room?: string[] | null;
          bathroom?: string[] | null;
          kitchen?: string[] | null;
          floorplan?: string[] | null;
          other?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          bedroom?: string[] | null;
          living_room?: string[] | null;
          bathroom?: string[] | null;
          kitchen?: string[] | null;
          floorplan?: string[] | null;
          other?: string[] | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_media_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          }
        ];
      };
      property_clicks: {
        Row: {
          id: string;
          property_id: string;
          user_id: string | null;
          latitude: number | null;
          longitude: number | null;
          clicked_at: string;
          created_at: string;
        };
        Insert: {
          property_id: string;
          user_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          clicked_at?: string;
          created_at?: string;
        };
        Update: {
          property_id?: string;
          user_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          clicked_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_clicks_property_id_fkey";
            columns: ["property_id"];
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_clicks_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
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
      property_type: "house" | "apartment" | "condo" | "townhouse";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}