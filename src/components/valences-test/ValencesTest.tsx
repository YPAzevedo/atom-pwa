import * as React from "react";
import { useHistory } from "react-router-dom";
import AppSettings, {
  ITestElementSettings,
  IValencesTestSettings,
} from "../../AppSettings";
import { IElement } from "../../Element";
import ElementManager from "../../ElementManager";
import { i18n } from "../../Locale";
import { TEST_SELECTION } from "../../routes";
import { shuffle } from "../../utils/shuffle";
import { Answer } from "../questions-test/question-card/question-card-answer/QuestionCardAnswer";
import { Question } from "../questions-test/question-card/QuestionCard";
import QuestionsTest from "../questions-test/QuestionsTest";
import Card from "../shared/card/Card";
import Navbar from "../shared/navbar/Navbar";
import TestResults from "../test-results/TestResults";
import { getValencesTestSettings } from "./settings/ValencesTestSettings";
import "./ValencesTest.scss";

interface ValencesTestQuestionCard extends Question {
  data: IElement;
}

function createAnswer(answer: string, right = false): Answer {
  return {
    answer,
    right,
  };
}

function createQuestionAnswers(element: IElement): Answer[] {
  const rightAnswer = createAnswer(element.valency, true);
  const wrongAnswerPool = shuffle(element.wrongValences)
    .map((wrongValency) => createAnswer(wrongValency))
    .slice(0, 3);

  return shuffle([rightAnswer, ...wrongAnswerPool]);
}

function createQuestion(element: IElement): ValencesTestQuestionCard {
  return {
    answers: createQuestionAnswers(element),
    data: element,
    question: element.symbol,
    questionClass: `valences-test__question element ${element.group}`,
  };
}

function createTestQuestions(settings: IValencesTestSettings) {
  const questions = settings
    .elements!.filter((element) => element.enabled)
    .map((element) => ElementManager.getElement(element.atomic))
    .map((element) => createQuestion(element!));

  return shuffle(questions);
}

function ValencesTest() {
  const history = useHistory();
  const settings = React.useMemo(() => getValencesTestSettings(), []);
  const [questions, setQuestions] = React.useState(() =>
    createTestQuestions(settings)
  );
  const [right, setRight] = React.useState<ValencesTestQuestionCard[]>([]);
  const [wrong, setWrong] = React.useState<ValencesTestQuestionCard[]>([]);

  const hasQuestions = !!questions.length;

  function onQuestionAnswer(
    question: ValencesTestQuestionCard,
    answer: Answer
  ) {
    const elementSetting = settings.elements!.find(
      (element: ITestElementSettings) => element.atomic === question.data.atomic
    );
    if (!elementSetting) return;

    const alreadyAnswered =
      right.includes(question) || wrong.includes(question);

    if (!alreadyAnswered) {
      elementSetting.stats.times++;

      if (answer.right) {
        elementSetting.stats.right++;
        setRight((previousRight) => [...previousRight, question]);
      } else {
        elementSetting.stats.wrong++;
        setWrong((previousWrong) => [...previousWrong, question]);
      }
    }

    if (answer.right) {
      setQuestions((previousQuestions) =>
        previousQuestions.filter((value) => value !== question)
      );
    }

    AppSettings.save();
  }

  function onNavbarBackButtonClick() {
    history.push(TEST_SELECTION);
  }

  function repeatTest() {
    setWrong([]);
    setRight([]);
    setQuestions(createTestQuestions(settings));
  }

  function repeatWrongAnswers() {
    setQuestions(shuffle(wrong));
    setWrong([]);
  }

  return (
    <div className="valences-test">
      <Navbar
        title={i18n("valences_test")}
        onBackButtonClick={onNavbarBackButtonClick}
      />

      {hasQuestions && (
        <div className="valences-test__test">
          <QuestionsTest
            title={i18n("select_valence")}
            questions={questions}
            // @ts-ignore Fix types
            onQuestionAnswer={onQuestionAnswer}
          />
        </div>
      )}

      {!hasQuestions && (
        <div className="valences-test__result">
          <Card className="valences-test__result-card">
            <TestResults
              gaTestName="Valences Test"
              wrongAnswers={wrong.length}
              rightAnswers={right.length}
              onRepeat={repeatTest}
              onRepeatWrongAnswers={repeatWrongAnswers}
            />
          </Card>
        </div>
      )}
    </div>
  );
}

export default ValencesTest;
