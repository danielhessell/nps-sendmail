import { Request, Response } from "express";
import { resolve } from "path";
import { getCustomRepository } from "typeorm";
import { AppError } from "../errors/AppError";
import { AnswersRepository } from "../repositories/AnswersRepository";
import { SurveysRepository } from "../repositories/SurveysRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import EtherealMailService from "../services/EtherealMailService";

export class SendMailController {
  async handle(request: Request, response: Response) {
    const { survey_id, email } = request.body;

    const answersRepository = getCustomRepository(AnswersRepository);
    const usersRepository = getCustomRepository(UsersRepository);
    const surveysRepository = getCustomRepository(SurveysRepository);

    const checkSurveyExists = await surveysRepository.findOne(survey_id);

    if (!checkSurveyExists) {
      throw new AppError("Survey does not exists!");
    }

    const checkUserExists = await usersRepository.findOne({ email });

    if (!checkUserExists) {
      throw new AppError("User does not exists!");
    }

    const surveyUserAlreadyExists = await answersRepository.findOne({
      where: { user_id: checkUserExists.id, value: null },
      relations: ["user", "survey"],
    });

    const path = resolve(__dirname, "..", "templates", "emails", "nps_mail.hbs");
    const { name } = checkUserExists;
    const { title, description } = checkSurveyExists;

    if (surveyUserAlreadyExists) {
      await EtherealMailService.execute({
        to: { email },
        subject: title,
        variables: {
          id: surveyUserAlreadyExists.id,
          name,
          title,
          description,
          link: process.env.URL_MAIL,
        },
        path,
      });

      return response.json(surveyUserAlreadyExists);
    }

    const surveyUser = answersRepository.create({
      user_id: checkUserExists.id,
      survey_id,
    });

    await answersRepository.save(surveyUser);

    await EtherealMailService.execute({
      to: { email },
      subject: title,
      variables: {
        id: surveyUser.id,
        name,
        title,
        description,
        link: process.env.URL_MAIL,
      },
      path,
    });

    return response.status(201).json(surveyUser);
  }
}
