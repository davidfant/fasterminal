import {Command} from "../types";

export const dockerCompose: Command = {
  name: 'Define and run multi-container applications with Docker.',
  subcommands: {
    build: {name: 'Build or rebuild services'},
    config: {name: 'Validate and view the Compose file'},
    create: {name: 'Create services'},
    down: {name: 'Stop and remove containers, networks, images, and volumes'},
    events: {name: 'Receive real time events from containers'},
    exec: {name: 'Execute a command in a running container'},
    help: {name: 'Get help on a command'},
    images: {name: 'List images'},
    kill: {name: 'Kill containers'},
    logs: {
      name: 'View output from containers',
      options: [{
        type: 'field',
        title: 'Tail logs',
        name: 'follow',
        shortname: 'f',
        fieldType: 'boolean',
      }, {
        type: 'select',
        title: 'Select Containers (leave empty to show all)',
        name: '',
        multi: true,
        items: [
          {value: 'core-api'},
          {value: 'frontend'},
          {value: 'legacy-api'},
          {value: 'elasticsearch'},
        ]
      }]
    },
    pause: {name: 'Pause services'},
    port: {name: 'Print the public port for a port binding'},
    ps: {name: 'List containers'},
    pull: {name: 'Pull service images'},
    push: {name: 'Push service images'},
    restart: {name: 'Restart services'},
    rm: {name: 'Remove stopped containers'},
    run: {name: 'Run a one-off command'},
    scale: {name: 'Set number of containers for a service'},
    start: {name: 'Start services'},
    stop: {name: 'Stop services'},
    top: {name: 'Display the running processes'},
    unpause: {name: 'Unpause services'},
    up: {name: 'Create and start containers'},
    version: {name: 'Show the Docker-Compose version information'},
  }
};