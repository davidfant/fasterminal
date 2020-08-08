import React, {FC, KeyboardEvent, ChangeEvent, ChangeEventHandler, useCallback} from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import './styles.less';

interface Props {
  autoFocus?: boolean;
  value?: string;
  onChange?(value: string): void;
  onKeyDown?(event: KeyboardEvent): void;
}

export const TerminalInput: FC<Props> = ({autoFocus, value, onChange, onKeyDown}) => {
  const handleChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(event.target.value);
  }, [onChange]);
  return (
    <TextareaAutosize
      className="rs-input terminal-input"
      autoFocus={autoFocus}
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
    />
  );
}
