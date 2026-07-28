'use client';

import type { ProductionState } from '@ubos/shared';
import { UnifiedChatMessage } from './UnifiedChatMessage';
import './UnifiedChat.css';

export function UnifiedChatZone({ state }: { state: ProductionState }) {
  const { chat } = state;

  return (
    <div className="unified-chat-zone">
      {(!chat || chat.length === 0) ? (
        <div className="uc-empty">No chat messages</div>
      ) : (
        <div className="uc-stream">
          {chat.map((msg) => (
            <UnifiedChatMessage key={msg.id} msg={msg} />
          ))}
        </div>
      )}
    </div>
  );
}
