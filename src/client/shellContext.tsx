import React, {FC, ReactNode, createContext, useMemo, useCallback} from 'react';
import SocketIO from 'socket.io-client';

interface StreamChunk {
  type: 'stdin' | 'stdout' | 'stderr';
  chunk: Buffer;
}

type StreamListener = (data: StreamChunk) => void;

interface ShellContextProps {
  runCommand(command: string): void;
  addListener(listener: StreamListener): void;
  // removeListener(listener: StreamListener): void;
}

export const ShellContext = createContext<ShellContextProps>(undefined as any);

interface Props {
  children: ReactNode;
}

export const ShellProvider: FC<Props> = ({children}) => {
  const socket = useMemo(() => SocketIO.connect('http://localhost:1997'), []);

  const runCommand = useCallback((command: string) => {
    socket.emit('input', [command, '\n'].join(''));
  }, [socket]);

  const addListener = useCallback((listener: StreamListener) => {
    console.log('register event listener...');
    socket.on('stdin', (chunk: Buffer) => listener({type: 'stdin', chunk}));
    socket.on('stdout', (chunk: Buffer) => listener({type: 'stdout', chunk}));
    socket.on('stderr', (chunk: Buffer) => listener({type: 'stderr', chunk}));
  }, [socket]);

  return (
    <ShellContext.Provider value={useMemo(() => ({runCommand, addListener}), [runCommand, addListener])}>
      {children}
    </ShellContext.Provider>
  );
}
