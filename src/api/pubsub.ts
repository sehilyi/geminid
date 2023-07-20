import type { _EventMap } from '../core/gosling.schema';
import PubSub from 'pubsub-js';

type EventName = keyof _EventMap;

export function publish<Name extends EventName>(name: Name, data: _EventMap[Name]): void {
    PubSub.publish(name, data);
}

export function subscribe<Name extends EventName>(
    name: Name,
    callback: (msg: string, data: _EventMap[Name]) => void
): void {
    PubSub.subscribe(name, callback);
}

export function unsubscribe(name: EventName): void {
    PubSub.unsubscribe(name);
}
