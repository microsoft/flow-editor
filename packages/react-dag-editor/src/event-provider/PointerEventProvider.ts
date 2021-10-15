import { EventEmitter } from "eventemitter3";
import { IEventProvider, IGlobalMoveEventTypes } from "./types";

export class PointerEventProvider implements IEventProvider<IGlobalMoveEventTypes> {
  private readonly target: Window | Element;
  private readonly pointerId: number | null;
  private readonly eventEmitter = new EventEmitter();

  public constructor(target: Window | Element, pointerId: number | null = null) {
    this.target = target;
    this.pointerId = pointerId;
  }

  public off<Type extends keyof IGlobalMoveEventTypes>(
    type: Type,
    callback: (...args: IGlobalMoveEventTypes[Type]) => void
  ): PointerEventProvider {
    this.eventEmitter.off(type, callback);
    this.ensureRemoveListener(type);
    return this;
  }

  public on<Type extends keyof IGlobalMoveEventTypes>(
    type: Type,
    callback: (...args: IGlobalMoveEventTypes[Type]) => void
  ): PointerEventProvider {
    this.ensureAddListener(type);
    this.eventEmitter.on(type, callback);
    return this;
  }

  private ensureAddListener(type: keyof IGlobalMoveEventTypes): void {
    if (!this.eventEmitter.listeners(type).length) {
      switch (type) {
        case "move":
          this.target.addEventListener("pointermove", this.onMove);
          break;
        case "end":
          this.target.addEventListener("pointerup", this.onUp);
          break;
        default:
      }
    }
  }

  private ensureRemoveListener(type: keyof IGlobalMoveEventTypes): void {
    if (!this.eventEmitter.listeners(type).length) {
      switch (type) {
        case "move":
          this.target.removeEventListener("pointermove", this.onMove);
          break;
        case "end":
          this.target.removeEventListener("pointerup", this.onUp);
          break;
        default:
      }
    }
  }

  private readonly onMove = (e: PointerEvent) => {
    if (this.pointerId === null || this.pointerId === e.pointerId) {
      this.eventEmitter.emit("move", e);
    }
  };

  private readonly onUp = (e: PointerEvent) => {
    if (this.pointerId === null || this.pointerId === e.pointerId) {
      this.eventEmitter.emit("end", e);
    }
  };
}
