import { Actor, RenderOrder } from '../entity';
import { BaseComponent } from './base-component';
import { Colours } from '../helpers';

export class Fighter implements BaseComponent {
  entity: Actor | null;
  _hp: number;

  constructor(public maxHp: number, public defence: number, public power: number) {
    this._hp = maxHp;
    this.entity = null;
  }

  public get hp(): number {
    return this._hp;
  }

  public set hp(value: number) {
    this._hp = Math.max(0, Math.min(value, this.maxHp));
    if (this._hp === 0 && this.entity?.isAlive) {
      this.die();
    }
  }

  die() {
    if (!this.entity) return;

    let deathMessage = '';
    let fg = null;
    if (window.engine.player === this.entity) {
      deathMessage = 'You died!';
      fg = Colours.PlayerDie;
    } else {
      deathMessage = `${this.entity.name} is dead!`;
      fg = Colours.EnemyDie;
    }

    this.entity.char = '%';
    this.entity.fg = '#bf0000';
    this.entity.blocksMovement = false;
    this.entity.ai = null;
    this.entity.name = `Remains of ${this.entity.name}`;
    this.entity.renderOrder = RenderOrder.Corpse;

    window.engine.messageLog.addMessage(deathMessage, fg);
  }
}
