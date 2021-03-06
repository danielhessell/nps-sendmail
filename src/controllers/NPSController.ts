import { Request, Response } from "express";
import { getCustomRepository, IsNull, Not } from "typeorm";
import { AnswersRepository } from "../repositories/AnswersRepository";

export class NPSController {
  async handle(request: Request, response: Response) {
    const { survey_id } = request.params;

    const answersRepository = getCustomRepository(AnswersRepository);

    const surveysUsers = await answersRepository.find({
      survey_id,
      value: Not(IsNull()),
    });

    const detractors = surveysUsers.filter(survey => (
      survey.value >= 0 && survey.value <= 6
    )).length;

    const passive = surveysUsers.filter(survey => (
      survey.value >= 7 && survey.value <= 8
    )).length;

    const promoters = surveysUsers.filter(survey => (
      survey.value >= 9 && survey.value <= 10
    )).length;

    const totalAnswers = surveysUsers.length;

    const calculate = Number((((promoters - detractors) / totalAnswers) * 100).toFixed(2));

    return response.json({
      detractors,
      passive,
      promoters,
      answers: totalAnswers,
      nps: calculate,
    });
  }
}
