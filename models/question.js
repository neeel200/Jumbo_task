import { Schema, model } from 'mongoose';

const QuestionSchema = new Schema({
  questionText: String,
  choices: [String],
  correctAnswer: Number
});

const QuestionModel = model('Question', QuestionSchema);

export { QuestionSchema, QuestionModel };
