import mongoose from "mongoose";

const audioCacheSchema = new mongoose.Schema(
  {
    bookId: { type: String, required: true },
    pageId: { type: String, required: true },
    voiceId: { type: String, required: true },
    url: { type: String, required: true },
  },
  { timestamps: true }
);

audioCacheSchema.index({ bookId: 1, pageId: 1, voiceId: 1 }, { unique: true });

export default mongoose.model("AudioCache", audioCacheSchema);