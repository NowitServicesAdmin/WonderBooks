import mongoose from "mongoose";

/*
  |--------------------------------------------------------------------------
  | PLAN SETTINGS (singleton)
  |--------------------------------------------------------------------------
  | Exactly one document ever exists here (_id: "global"). Holds the one
  | pricing knob that applies across every plan rather than per-plan:
  | the % discount applied when a user pays yearly instead of monthly.
  |
  | getSettings() below is the only way this doc should be read/created -
  | it upserts on first read so the rest of the app never has to handle
  | "no settings doc yet".
*/
const planSettingsSchema = new mongoose.Schema(
    {
        _id: { type: String, default: "global" },
        yearlySaving: {
            type: Number,
            default: 15,
            min: 0,
            max: 90,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

const PlanSettings = mongoose.model("PlanSettings", planSettingsSchema);

export const getSettings = async () => {
    let settings = await PlanSettings.findById("global");
    if (!settings) {
        settings = await PlanSettings.create({ _id: "global" });
    }
    return settings;
};

export default PlanSettings;
