import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export const db = {
  familyMembers: {
    list: async () => {
      try {
        const { data, error } = await supabase
          .from('family_members')
          .select('*')
          .order('created_at', { ascending: true });
        if (error) throw error;
        return data.map(row => ({
          id: row.id,
          firstName: row.first_name,
          surname: row.surname,
          dateOfBirth: row.date_of_birth,
          dateOfDeath: row.date_of_death,
          isAlive: row.is_alive,
          birthPlace: row.birth_place,
          tombstoneLocation: row.tombstone_location,
          tombstonePhoto: row.tombstone_photo,
          profilePicture: row.profile_picture,
          fatherId: row.father_id,
          motherId: row.mother_id,
          spouseId: row.spouse_id,
          positionX: row.position_x,
          positionY: row.position_y,
          notes: row.notes
        }));
      } catch (error) {
        console.error('Error fetching family members:', error);
        return [];
      }
    },

    create: async (data) => {
      try {
        const { data: result, error } = await supabase
          .from('family_members')
          .insert({
            first_name: data.firstName,
            surname: data.surname,
            date_of_birth: data.dateOfBirth,
            date_of_death: data.dateOfDeath,
            is_alive: data.isAlive !== false,
            birth_place: data.birthPlace,
            tombstone_location: data.tombstoneLocation,
            tombstone_photo: data.tombstonePhoto,
            profile_picture: data.profilePicture,
            father_id: data.fatherId,
            mother_id: data.motherId,
            spouse_id: data.spouseId,
            position_x: data.positionX,
            position_y: data.positionY,
            notes: data.notes
          })
          .select()
          .single();
        if (error) throw error;
        return {
          id: result.id,
          firstName: result.first_name,
          surname: result.surname,
          dateOfBirth: result.date_of_birth,
          dateOfDeath: result.date_of_death,
          isAlive: result.is_alive,
          birthPlace: result.birth_place,
          tombstoneLocation: result.tombstone_location,
          tombstonePhoto: result.tombstone_photo,
          profilePicture: result.profile_picture,
          fatherId: result.father_id,
          motherId: result.mother_id,
          spouseId: result.spouse_id,
          positionX: result.position_x,
          positionY: result.position_y,
          notes: result.notes
        };
      } catch (error) {
        console.error('Error creating family member:', error);
        throw error;
      }
    },

    update: async (id, data) => {
      try {
        const updateData = {};
        if (data.firstName !== undefined) updateData.first_name = data.firstName;
        if (data.surname !== undefined) updateData.surname = data.surname;
        if (data.dateOfBirth !== undefined) updateData.date_of_birth = data.dateOfBirth;
        if (data.dateOfDeath !== undefined) updateData.date_of_death = data.dateOfDeath;
        if (data.isAlive !== undefined) updateData.is_alive = data.isAlive;
        if (data.birthPlace !== undefined) updateData.birth_place = data.birthPlace;
        if (data.tombstoneLocation !== undefined) updateData.tombstone_location = data.tombstoneLocation;
        if (data.tombstonePhoto !== undefined) updateData.tombstone_photo = data.tombstonePhoto;
        if (data.profilePicture !== undefined) updateData.profile_picture = data.profilePicture;
        if (data.fatherId !== undefined) updateData.father_id = data.fatherId;
        if (data.motherId !== undefined) updateData.mother_id = data.motherId;
        if (data.spouseId !== undefined) updateData.spouse_id = data.spouseId;
        if (data.positionX !== undefined) updateData.position_x = data.positionX;
        if (data.positionY !== undefined) updateData.position_y = data.positionY;
        if (data.notes !== undefined) updateData.notes = data.notes;

        const { data: result, error } = await supabase
          .from('family_members')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return {
          id: result.id,
          firstName: result.first_name,
          surname: result.surname,
          dateOfBirth: result.date_of_birth,
          dateOfDeath: result.date_of_death,
          isAlive: result.is_alive,
          birthPlace: result.birth_place,
          tombstoneLocation: result.tombstone_location,
          tombstonePhoto: result.tombstone_photo,
          profilePicture: result.profile_picture,
          fatherId: result.father_id,
          motherId: result.mother_id,
          spouseId: result.spouse_id,
          positionX: result.position_x,
          positionY: result.position_y,
          notes: result.notes
        };
      } catch (error) {
        console.error('Error updating family member:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('family_members')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('Error deleting family member:', error);
        throw error;
      }
    }
  },

  familyPhotos: {
    list: async () => {
      try {
        const { data, error } = await supabase
          .from('family_photos')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(row => ({
          id: row.id,
          url: row.url,
          title: row.title,
          taggedMemberIds: row.tagged_member_ids || [],
          customTags: row.custom_tags || [],
          uploadDate: row.upload_date,
          memberId: row.member_id
        }));
      } catch (error) {
        console.error('Error fetching family photos:', error);
        return [];
      }
    },

    create: async (data) => {
      try {
        const { data: result, error } = await supabase
          .from('family_photos')
          .insert({
            url: data.url,
            title: data.title,
            tagged_member_ids: data.taggedMemberIds || [],
            custom_tags: data.customTags || [],
            upload_date: data.uploadDate,
            member_id: data.memberId
          })
          .select()
          .single();
        if (error) throw error;
        return {
          id: result.id,
          url: result.url,
          title: result.title,
          taggedMemberIds: result.tagged_member_ids || [],
          customTags: result.custom_tags || [],
          uploadDate: result.upload_date,
          memberId: result.member_id
        };
      } catch (error) {
        console.error('Error creating family photo:', error);
        throw error;
      }
    },

    update: async (id, data) => {
      try {
        const updateData = {};
        if (data.url !== undefined) updateData.url = data.url;
        if (data.title !== undefined) updateData.title = data.title;
        if (data.taggedMemberIds !== undefined) updateData.tagged_member_ids = data.taggedMemberIds;
        if (data.customTags !== undefined) updateData.custom_tags = data.customTags;
        if (data.uploadDate !== undefined) updateData.upload_date = data.uploadDate;
        if (data.memberId !== undefined) updateData.member_id = data.memberId;

        const { data: result, error } = await supabase
          .from('family_photos')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return {
          id: result.id,
          url: result.url,
          title: result.title,
          taggedMemberIds: result.tagged_member_ids || [],
          customTags: result.custom_tags || [],
          uploadDate: result.upload_date,
          memberId: result.member_id
        };
      } catch (error) {
        console.error('Error updating family photo:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('family_photos')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('Error deleting family photo:', error);
        throw error;
      }
    }
  },

  shareLinks: {
    list: async () => {
      try {
        const { data, error } = await supabase
          .from('share_links')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(row => ({
          id: row.id,
          token: row.token,
          role: row.role,
          expiresAt: row.expires_at,
          isActive: row.is_active,
          accessCount: row.access_count
        }));
      } catch (error) {
        console.error('Error fetching share links:', error);
        return [];
      }
    },

    filter: async (filters) => {
      try {
        let query = supabase.from('share_links').select('*');
        if (filters.token) {
          query = query.eq('token', filters.token);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map(row => ({
          id: row.id,
          token: row.token,
          role: row.role,
          expiresAt: row.expires_at,
          isActive: row.is_active,
          accessCount: row.access_count
        }));
      } catch (error) {
        console.error('Error filtering share links:', error);
        return [];
      }
    },

    create: async (data) => {
      try {
        const { data: result, error } = await supabase
          .from('share_links')
          .insert({
            token: data.token,
            role: data.role,
            expires_at: data.expiresAt,
            is_active: data.isActive,
            access_count: data.accessCount || 0
          })
          .select()
          .single();
        if (error) throw error;
        return {
          id: result.id,
          token: result.token,
          role: result.role,
          expiresAt: result.expires_at,
          isActive: result.is_active,
          accessCount: result.access_count
        };
      } catch (error) {
        console.error('Error creating share link:', error);
        throw error;
      }
    },

    update: async (id, data) => {
      try {
        const updateData = {};
        if (data.token !== undefined) updateData.token = data.token;
        if (data.role !== undefined) updateData.role = data.role;
        if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt;
        if (data.isActive !== undefined) updateData.is_active = data.isActive;
        if (data.accessCount !== undefined) updateData.access_count = data.accessCount;

        const { data: result, error } = await supabase
          .from('share_links')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return {
          id: result.id,
          token: result.token,
          role: result.role,
          expiresAt: result.expires_at,
          isActive: result.is_active,
          accessCount: result.access_count
        };
      } catch (error) {
        console.error('Error updating share link:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        const { error } = await supabase
          .from('share_links')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (error) {
        console.error('Error deleting share link:', error);
        throw error;
      }
    }
  },

  treeLayouts: {
    list: async () => {
      try {
        const { data, error } = await supabase
          .from('tree_layouts')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(row => ({
          id: row.id,
          positions: row.positions,
          customLines: row.custom_lines || []
        }));
      } catch (error) {
        console.error('Error fetching tree layouts:', error);
        return [];
      }
    },

    create: async (data) => {
      try {
        const { data: result, error } = await supabase
          .from('tree_layouts')
          .insert({
            positions: data.positions,
            custom_lines: data.customLines || []
          })
          .select()
          .single();
        if (error) throw error;
        return {
          id: result.id,
          positions: result.positions,
          customLines: result.custom_lines || []
        };
      } catch (error) {
        console.error('Error creating tree layout:', error);
        throw error;
      }
    },

    update: async (id, data) => {
      try {
        const updateData = {
          updated_at: new Date().toISOString()
        };
        if (data.positions !== undefined) updateData.positions = data.positions;
        if (data.customLines !== undefined) updateData.custom_lines = data.customLines;

        const { data: result, error } = await supabase
          .from('tree_layouts')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return {
          id: result.id,
          positions: result.positions,
          customLines: result.custom_lines || []
        };
      } catch (error) {
        console.error('Error updating tree layout:', error);
        throw error;
      }
    }
  },

  knowledgeDocuments: {
    list: async () => {
      try {
        const { data, error } = await supabase
          .from('knowledge_documents')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(row => ({
          id: row.id,
          title: row.title,
          content: row.content,
          documentType: row.document_type
        }));
      } catch (error) {
        console.error('Error fetching knowledge documents:', error);
        return [];
      }
    }
  },

  storage: {
    upload: async (file) => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { data, error } = await supabase.storage
          .from('family-tree-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('family-tree-files')
          .getPublicUrl(filePath);

        return { file_url: publicUrl };
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    }
  }
};
