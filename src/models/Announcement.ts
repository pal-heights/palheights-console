import mongoose, { Schema, model, models } from 'mongoose';

const AnnouncementSchema = new Schema({
  text: { type: String, required: true },
}, { timestamps: true });

const Announcement = models.Announcement || model('Announcement', AnnouncementSchema);

export default Announcement; 