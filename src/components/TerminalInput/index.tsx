import React, {FC, KeyboardEvent, ChangeEvent, useCallback} from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import './styles.less';

interface Props {
  autoFocus?: boolean;
  value?: string;
  autocomplete?: string;
  onChange?(value: string): void;
  onKeyDown?(event: KeyboardEvent): void;
}

export const TerminalInput: FC<Props> = ({autoFocus, value, autocomplete, onChange, onKeyDown}) => {
  const handleChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(event.target.value);
  }, [onChange]);
  return (
    <div className="terminal-input">
      <TextareaAutosize
        className="rs-input"
        autoFocus={autoFocus}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
      />
      {!!value && !!autocomplete && (
        <code className="autocomplete">
          {Array(value.length).fill('\u00a0').join('')}
          {autocomplete.slice(value.length)}
        </code>
      )}
    </div>
  );
}
