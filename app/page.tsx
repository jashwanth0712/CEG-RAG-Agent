// Step 5 - Chat UI: frontend page using the AI SDK's useChat hook
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  // Step 5a - useChat hook manages chat state and sends messages to /api/chat
  const { messages, sendMessage } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div className="space-y-4">
        {messages.map(m => (
          <div key={m.id} className="whitespace-pre-wrap">
            <div>
              <div className="font-bold">{m.role}</div>
              {/* Step 5b - Render message parts: text responses and tool call indicators */}
              {m.parts.map(part => {
                switch (part.type) {
                  case 'text':
                    return <p key={part.text}>{part.text}</p>;
                  // Step 5c - Show tool call status (calling/called) with input details
                  case 'tool-addResource':
                  case 'tool-getInformation':
                    return (
                      <p key={part.type}>
                        call{part.state === 'output-available' ? 'ed' : 'ing'}{' '}
                        tool: {part.type}
                        <pre className="my-4 bg-zinc-100 p-2 rounded-sm">
                          {JSON.stringify(part.input, null, 2)}
                        </pre>
                      </p>
                    );
                }
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Step 5d - Input form: sends message on submit via sendMessage */}
      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
