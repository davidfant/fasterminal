import React, {ReactNode, useState, useCallback, useEffect, useMemo} from 'react';
import * as _ from 'lodash';
import { Tag, Icon, Dropdown, Loader, Modal, Button } from 'rsuite';
import {StackExchange, Question, Answer} from 'stackexchange-api';

export function useStackoverflowSearch(command: string, visible: boolean): {
  visible: boolean;
  component: ReactNode;
  onPressArrowUp(): void;
  onPressArrowDown(): void;
  onPressTab(): void;
} {
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[] | undefined>(undefined);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [answer, setAnswer] = useState<Answer | undefined>(undefined);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | undefined>(undefined);

  const startSearching = useCallback(async () => {
    setSearching(true);
    setQuestions(undefined);

    try {
      setLoading(true);
      /*
      const res = await StackExchange.advancedSearch({
        site: 'stackoverflow',
        q: command,
        sort: 'relevance',
        pageSize: 5
      });
      // */
      //*
      const res = await fetch(`https://api.stackexchange.com/search/advanced?pagesize=5&site=stackoverflow&sort=relevance&q=${command}`)
        .then((res) => res.json())
        .then((res) => ({
          items: res.items?.map((item: any) => new Question(item))
        }));
      // */

      setQuestions(res.items?.filter((q: Question) => !!q.acceptedAnswerId));
    } finally {
      setLoading(false);
    }
  }, [command]);

  const showAnswer = useCallback(async (question: Question) => {
    /*
    const res = await StackExchange.getAnswersByIds({
      ids: [String(question.acceptedAnswerId)],
      site: 'stackoverflow',
      filter: 'withbody',
    });
    // */
    //*
    const res = await fetch(`https://api.stackexchange.com/answers/${question.acceptedAnswerId}?site=stackoverflow&filter=withbody`)
      .then((res) => res.json())
      .then((res) => ({
        items: res.items?.map((item: any) => new Answer(item))
      }));
    // */

    setAnswer(res.items?.[0]);
    setSelectedQuestion(question);
    setShowingAnswer(true);
  }, []);

  const closeAnswer = useCallback(() => setShowingAnswer(false), []);

  useEffect(() => {
    if (!visible) setSearching(false);
  }, [visible]);
  useEffect(() => setSearching(false), [command]);

  const component = useMemo<ReactNode>(() => {
    if (!visible || !command) return null;
    if (!searching) {
      return (
        <Dropdown.Menu onSelect={startSearching}>
          <Dropdown.Item>
            <Icon icon="stack-overflow" />
            Search on Stack Overflow:
            <Tag componentClass="code" style={{marginLeft: 8}}>
              {command}
            </Tag>
          </Dropdown.Item>
        </Dropdown.Menu>
      );
    }
    if (loading) return <Loader style={{padding: 8}} content="Searching..." />;
    if (!!questions) {
      return (
        <>
          <Dropdown.Menu onSelect={showAnswer}>
            {questions.map((question) => (
              <Dropdown.Item eventKey={question} key={question.questionId || undefined}>
                <Tag componentClass="code" style={{marginRight: 8}}>
                  {question.score} votes
                </Tag>
                <div style={{display: 'inline'}} dangerouslySetInnerHTML={{__html: question.title!}} />
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
          <Modal full show={showingAnswer} onHide={closeAnswer}>
            <Modal.Header>
              <Modal.Title>{selectedQuestion?.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div dangerouslySetInnerHTML={{__html: answer?.body!}} />
            </Modal.Body>
            <Modal.Footer>
              {/* TODO(fant): get the answer.shareLink from the bs API */}
              <Button>
                <a target="_blank" href={`https://stackoverflow.com/a/${answer?.answerId}`}>
                  <Icon icon="external-link" /> Open on Stack Overflow
                </a>
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      );
    }
    return null;
  }, [answer, closeAnswer, command, loading, questions, searching, selectedQuestion, showAnswer, showingAnswer, startSearching, visible]);
  const onPressArrowUp = useCallback(() => console.error('up'), []);
  const onPressArrowDown = useCallback(() => console.error('own'), []);
  const onPressTab = useCallback(() => console.error('tab'), []);

  return useMemo(() => ({visible, component, onPressArrowUp, onPressArrowDown, onPressTab}), [visible, component, onPressArrowUp, onPressArrowDown, onPressTab]);
}
