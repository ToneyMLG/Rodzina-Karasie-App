import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const members = data.map(row => ({
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
      notes: row.notes,
      createdAt: row.created_at
    }));

    res.json(members);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = {
      id: data.id,
      firstName: data.first_name,
      surname: data.surname,
      dateOfBirth: data.date_of_birth,
      dateOfDeath: data.date_of_death,
      isAlive: data.is_alive,
      birthPlace: data.birth_place,
      tombstoneLocation: data.tombstone_location,
      tombstonePhoto: data.tombstone_photo,
      profilePicture: data.profile_picture,
      fatherId: data.father_id,
      motherId: data.mother_id,
      spouseId: data.spouse_id,
      positionX: data.position_x,
      positionY: data.position_y,
      notes: data.notes,
      createdAt: data.created_at
    };

    res.json(member);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      firstName,
      surname,
      dateOfBirth,
      dateOfDeath,
      isAlive,
      birthPlace,
      tombstoneLocation,
      tombstonePhoto,
      profilePicture,
      fatherId,
      motherId,
      spouseId,
      positionX,
      positionY,
      notes
    } = req.body;

    if (!firstName || !surname) {
      return res.status(400).json({ error: 'firstName and surname are required' });
    }

    const { data, error } = await supabase
      .from('family_members')
      .insert({
        first_name: firstName,
        surname,
        date_of_birth: dateOfBirth,
        date_of_death: dateOfDeath,
        is_alive: isAlive !== false,
        birth_place: birthPlace,
        tombstone_location: tombstoneLocation,
        tombstone_photo: tombstonePhoto,
        profile_picture: profilePicture,
        father_id: fatherId,
        mother_id: motherId,
        spouse_id: spouseId,
        position_x: positionX,
        position_y: positionY,
        notes
      })
      .select()
      .single();

    if (error) throw error;

    const member = {
      id: data.id,
      firstName: data.first_name,
      surname: data.surname,
      dateOfBirth: data.date_of_birth,
      dateOfDeath: data.date_of_death,
      isAlive: data.is_alive,
      birthPlace: data.birth_place,
      tombstoneLocation: data.tombstone_location,
      tombstonePhoto: data.tombstone_photo,
      profilePicture: data.profile_picture,
      fatherId: data.father_id,
      motherId: data.mother_id,
      spouseId: data.spouse_id,
      positionX: data.position_x,
      positionY: data.position_y,
      notes: data.notes,
      createdAt: data.created_at
    };

    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      surname,
      dateOfBirth,
      dateOfDeath,
      isAlive,
      birthPlace,
      tombstoneLocation,
      tombstonePhoto,
      profilePicture,
      fatherId,
      motherId,
      spouseId,
      positionX,
      positionY,
      notes
    } = req.body;

    const updateData = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (surname !== undefined) updateData.surname = surname;
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth;
    if (dateOfDeath !== undefined) updateData.date_of_death = dateOfDeath;
    if (isAlive !== undefined) updateData.is_alive = isAlive;
    if (birthPlace !== undefined) updateData.birth_place = birthPlace;
    if (tombstoneLocation !== undefined) updateData.tombstone_location = tombstoneLocation;
    if (tombstonePhoto !== undefined) updateData.tombstone_photo = tombstonePhoto;
    if (profilePicture !== undefined) updateData.profile_picture = profilePicture;
    if (fatherId !== undefined) updateData.father_id = fatherId;
    if (motherId !== undefined) updateData.mother_id = motherId;
    if (spouseId !== undefined) updateData.spouse_id = spouseId;
    if (positionX !== undefined) updateData.position_x = positionX;
    if (positionY !== undefined) updateData.position_y = positionY;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('family_members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = {
      id: data.id,
      firstName: data.first_name,
      surname: data.surname,
      dateOfBirth: data.date_of_birth,
      dateOfDeath: data.date_of_death,
      isAlive: data.is_alive,
      birthPlace: data.birth_place,
      tombstoneLocation: data.tombstone_location,
      tombstonePhoto: data.tombstone_photo,
      profilePicture: data.profile_picture,
      fatherId: data.father_id,
      motherId: data.mother_id,
      spouseId: data.spouse_id,
      positionX: data.position_x,
      positionY: data.position_y,
      notes: data.notes,
      createdAt: data.created_at
    };

    res.json(member);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Member deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
