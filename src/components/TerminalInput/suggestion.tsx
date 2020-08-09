import React, {FC, useEffect, useRef} from 'react';
import {findDOMNode} from 'react-dom';
import {Tag, Dropdown, HelpBlock} from 'rsuite';
import {AutocompleteSuggestion} from '../../types';

interface Props {
  suggestion: AutocompleteSuggestion;
  selected: boolean;
}

export const SuggestionItem: FC<Props> = ({suggestion, selected}) => {
  const containerRef = useRef<any>(undefined);
  useEffect(() => {
    if (selected) {
      const node = findDOMNode(containerRef.current) as any;
      node?.scrollIntoViewIfNeeded?.();
    }
  }, [selected, containerRef]);

  return (
    <Dropdown.Item 
      ref={containerRef}
      className={selected ? 'active' : undefined}
      eventKey={suggestion}
    >
      <Tag componentClass="code" style={{marginRight: 8}}>
        {suggestion.command}
      </Tag>
      {suggestion.name}
      {!!suggestion.description && <HelpBlock tooltip>{suggestion.description}</HelpBlock>}
    </Dropdown.Item>
  );
}
