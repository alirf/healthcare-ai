"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Mic,
  Paperclip,
  Loader2,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function ChatInput({ onSend, disabled, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual voice recording
  };

  return (
    <div className="border-t border-border bg-card/95 backdrop-blur-sm p-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-2 bg-muted rounded-2xl p-2">
          {/* Attach Button */}
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-xl shrink-0 text-muted-foreground hover:text-foreground"
            disabled={disabled}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="علائم خود را بنویسید..."
            disabled={disabled || isRecording}
            className="flex-1 bg-transparent py-2.5 px-2 text-sm outline-none resize-none min-h-[40px] max-h-[120px] placeholder:text-muted-foreground"
            rows={1}
          />

          {/* Voice / Send Button */}
          <div className="flex gap-1 shrink-0">
            {message.trim() ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={disabled || isLoading}
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-trust-500 to-healing-500 hover:from-trust-600 hover:to-healing-600 text-white shadow-lg shadow-trust-500/25"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRecording}
                className={cn(
                  "w-9 h-9 rounded-xl transition-all",
                  isRecording
                    ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-1.5">
          هوش مصنوعی سلامت هوشمند • اطلاعات پزشکی جایگزین مشاوره پزشک نیست
        </p>
      </div>
    </div>
  );
}