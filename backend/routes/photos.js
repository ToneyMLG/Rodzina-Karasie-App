import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('family_photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const photos = data.map(row => ({
      id: row.id,
      url: row.url,
      title: row.title,
      taggedMemberIds: row.tagged_member_ids || [],
      customTags: row.custom_tags || [],
      uploadDate: row.upload_date,
      memberId: row.member_id,
      createdAt: row.created_at
    }));

    res.json(photos);
  } catch (error) {
    next(error);
  }
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, taggedMemberIds, customTags, memberId } = req.body;
    const fileExt = req.file.mimetype.split('/')[1];
    const fileName = `${uuidv4()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('family-tree-files')
      .upload(`photos/${fileName}`, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600'
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('family-tree-files')
      .getPublicUrl(`photos/${fileName}`);

    const taggedIds = taggedMemberIds ? JSON.parse(taggedMemberIds) : [];
    const tags = customTags ? JSON.parse(customTags) : [];

    const { data, error } = await supabase
      .from('family_photos')
      .insert({
        url: publicUrl,
        title: title || 'Untitled',
        tagged_member_ids: taggedIds,
        custom_tags: tags,
        upload_date: new Date().toISOString(),
        member_id: memberId || null
      })
      .select()
      .single();

    if (error) throw error;

    const photo = {
      id: data.id,
      url: data.url,
      title: data.title,
      taggedMemberIds: data.tagged_member_ids || [],
      customTags: data.custom_tags || [],
      uploadDate: data.upload_date,
      memberId: data.member_id,
      createdAt: data.created_at
    };

    res.status(201).json(photo);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, taggedMemberIds, customTags } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (taggedMemberIds !== undefined) updateData.tagged_member_ids = taggedMemberIds;
    if (customTags !== undefined) updateData.custom_tags = customTags;

    const { data, error } = await supabase
      .from('family_photos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = {
      id: data.id,
      url: data.url,
      title: data.title,
      taggedMemberIds: data.tagged_member_ids || [],
      customTags: data.custom_tags || [],
      uploadDate: data.upload_date,
      memberId: data.member_id,
      createdAt: data.created_at
    };

    res.json(photo);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: photoData, error: fetchError } = await supabase
      .from('family_photos')
      .select('url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!photoData) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const urlParts = photoData.url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const { error: deleteFileError } = await supabase.storage
      .from('family-tree-files')
      .remove([`photos/${fileName}`]);

    if (deleteFileError) {
      console.warn('Warning: Failed to delete file from storage:', deleteFileError);
    }

    const { error: deleteDbError } = await supabase
      .from('family_photos')
      .delete()
      .eq('id', id);

    if (deleteDbError) throw deleteDbError;

    res.json({ success: true, message: 'Photo deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
