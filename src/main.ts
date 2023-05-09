import { Colours } from './helpers';
import { Engine } from './engine';
import { MessageLog } from './message-log';
import { spawnPlayer } from './entity';

declare global {
  interface Window {
    engine: Engine;
    messageLog: MessageLog;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.messageLog = new MessageLog();
  window.engine = new Engine(spawnPlayer(Engine.WIDTH / 2, Engine.HEIGHT / 2));
  window.messageLog.addMessage(
    'Hello and welcome, adventurer, to yet another dungeon!',
    Colours.WelcomeText
  );
  window.engine.render();
});
