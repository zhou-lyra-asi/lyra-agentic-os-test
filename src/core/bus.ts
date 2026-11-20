import type { Channel, Envelope, Phase, SpeakerId } from './types';
import { uid } from './util';

export type BusListener = (envelope: Envelope) => void;

/**
 * Lyra Message Bus — event-driven, dengan correlation id, provenance,
 * dan channel terpisah. Ini BUKAN animasi: semua temuan, kritik, suara,
 * artefak, dan audit melewati jalur yang sama di Web / Desktop / CLI.
 */
export class MessageBus {
  private listeners = new Set<BusListener>();
  private _history: Envelope[] = [];
  private seq = 0;
  private correlation = uid('run');

  constructor(private readonly maxHistory = 600) {}

  newRun(): string {
    this.correlation = uid('run');
    this.seq = 0;
    return this.correlation;
  }

  get correlationId(): string {
    return this.correlation;
  }

  subscribe(fn: BusListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  publish(input: {
    from: SpeakerId;
    to?: SpeakerId | 'broadcast';
    channel: Channel;
    phase: Phase;
    subject: string;
    body: string;
    confidence?: number;
    refs?: string[];
    meta?: Record<string, string | number | boolean>;
  }): Envelope {
    const env: Envelope = {
      id: uid('msg'),
      seq: ++this.seq,
      ts: Date.now(),
      from: input.from,
      to: input.to ?? 'broadcast',
      channel: input.channel,
      phase: input.phase,
      subject: input.subject,
      body: input.body,
      correlationId: this.correlation,
      confidence: input.confidence,
      refs: input.refs,
      meta: input.meta,
    };
    this._history.push(env);
    if (this._history.length > this.maxHistory) this._history.splice(0, this._history.length - this.maxHistory);
    for (const fn of this.listeners) fn(env);
    return env;
  }

  get history(): Envelope[] {
    return this._history.slice();
  }

  byChannel(channel: Channel): Envelope[] {
    return this._history.filter((e) => e.channel === channel);
  }
}
