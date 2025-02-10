import mongoose from "mongoose";
import { QuestionSchema } from "./question.js"
import { Schema, model } from 'mongoose';

const GameSessionSchema = new Schema({
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  questions: [QuestionSchema],
  // Using a Map to store scores: key is userId (as a string), value is the score.
  scores: { type: Map, of: Number },
  currentUserQuestionsMap: { type: Map, of: Number },
  // currentQuestionIndex: { type: [Number], default: [0, 0] },
  finished: { type: Boolean, default: false },
});
const GameSession = model('GameSession', GameSessionSchema);

export { GameSession }