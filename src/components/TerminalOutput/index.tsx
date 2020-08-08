import React, {FC, useContext, useCallback, useEffect, useState, useRef} from 'react';
// @ts-ignore
import ConvertANSI from 'ansi-to-html';
import { ShellContext } from '../../client/shellContext';

// var Convert = require('ansi-to-html');
// var convert = new Convert();


const converter = new ConvertANSI({
  newline: true,
  // stream: true,
});

interface Props {

}

export const TerminalOutput: FC<Props> = ({}) => {
  const [log, setLog] = useState('');

  const appendLog = useCallback((newLog: string) => setLog([log, newLog].join('\n')), [log]);
  const appendLogRef = useRef(appendLog);
  appendLogRef.current = appendLog;

  const shell = useContext(ShellContext);
  useEffect(() => shell.addListener(({type, chunk}) => {
    appendLogRef.current(converter.toHtml(chunk.toString()));
  }), [shell.addListener]); // eslint-disable-line

  return (
    <code>
      {/*
      {log}
    */}
    <div dangerouslySetInnerHTML={{__html: log}} />
    </code>
  );
}
