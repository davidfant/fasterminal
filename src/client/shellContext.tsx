import React, {FC, ReactNode, createContext, useMemo, useCallback} from 'react';
import SocketIO from 'socket.io-client';

interface StreamChunk {
  type: 'stdin' | 'stdout' | 'stderr';
  chunk: Buffer;
}

type StreamListener = (data: StreamChunk) => void;

interface ShellContextProps {
  // process: ChildProcess;
  runCommand(command: string): void;
  addListener(listener: StreamListener): void;
  // removeListener(listener: StreamListener): void;
}

export const ShellContext = createContext<ShellContextProps>(undefined as any);

interface Props {
  children: ReactNode;
}

/*
// Connect to the socket.io server
var socket = io.connect('http://localhost:8080');
// Wait for data from the server
socket.on('output', function (data) {
   // Insert some line breaks where they belong
   data = data.replace("n", "");
   data = data.replace("r", "");
   // Append the data to our terminal
   $('.terminal').append(data);
});
// Listen for user input and pass it to the server
$(document).on("keypress",function(e){
var char = String.fromCharCode(e.which);
socket.emit("input", char);
});
*/



export const ShellProvider: FC<Props> = ({children}) => {
  const socket = useMemo(() => SocketIO.connect('http://localhost:3001'), []);

  /*
  const process = useMemo(() => spawn('bash', {detached: true}), []);

  const runCommand = useCallback((command: string) => process.stdin.write([command, '\n'].join('')), [process]);

  const addListener = useCallback((listener: StreamListener) => {
    process.stdout.on('data', (chunk: Buffer) => listener({type: 'stdout', chunk}));
    process.stderr.on('data', (chunk: Buffer) => listener({type: 'stderr', chunk}));
  }, [process]);
  */
  const runCommand = useCallback((command: string) => {
    socket.emit('input', [command, '\n'].join(''));
  }, [socket]);

  const addListener = useCallback((listener: StreamListener) => {
    console.error('register event listener...');
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
