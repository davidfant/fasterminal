import express from 'express';
import * as http from 'http';
import SocketIO from 'socket.io';
import {spawn} from 'child_process';

const app = express();
const server = http
  .createServer(app)
  .listen(1997, () => console.log('listening'));

const io = SocketIO(server);
io.on('connect', (socket) => {
  const bashProcess = spawn('bash', {detached: true, cwd: process.env.HOME});
  // const bashProcess = spawn('bash', {detached: true, cwd: '/Users/fant/repos/fasterminal'});
  bashProcess.stdout.on('data', (chunk: Buffer) => socket.emit('stdout', chunk.toString()));
  bashProcess.stderr.on('data', (chunk: Buffer) => socket.emit('stderr', chunk.toString()));
  bashProcess.stderr.on('data', (chunk: Buffer) => console.log('stderr', chunk.toString()));

  socket.on('input', (data: string) => {
    console.log('input: ', data);
    console.log('input decoded: ', decodeURI(data));
    bashProcess.stdin.write(data);
    socket.emit('stdin', `$ ${data}`);
  });
  socket.on('disconnect', () => {
    console.log('disconnect');
    bashProcess.kill();
  });
});
