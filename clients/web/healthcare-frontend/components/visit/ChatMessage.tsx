"use client";

import { motion } from "framer-motion";
import { User, Bot, Stethoscope, Check, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/visit";
import SymptomBox from "./SymptomBox";
import type { SymptomData } from "@/types/visit";

interface ChatMessageProps {
  message: ChatMessage;
  onSymptomUpdate: (symptom: SymptomData) => void;
  onSymptomRemove: (id: string) => void;
}

export default function ChatMessage({ message, onSymptomUpdate, onSymptomRemove }: ChatMessageProps) {
  const isUser = message.sender === "user";
  const isAI = message.sender === "ai";
  const isDoctor = message.sender === "doctor";

  const getAvatar = () => {
    if (isUser) return <User className="w-4 h-4 text-white" />;
    if (isAI) return <Bot className="w-4 h-4 text-white" />;
    return <Stethoscope className="w-4 h-4 text-white" />;
  };

  const getAvatarBg = () => {
    if (isUser) return "bg-gradient-to-br from-trust-500 to-healing-500";
    if (isAI) return "bg-gradient-to-br from-violet-500 to-purple-500";
    return "bg-gradient-to-br from-amber-500 to-orange-500";
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("flex gap-3", isUser ? "flex-row" : "flex-row-reverse")}
    >
      {/* Avatar */}
      <div className="shrink-0 flex flex-col items-center gap-1">
        <Avatar className={cn("w-9 h-9 ring-2 ring-white dark:ring-slate-800 shadow-md", getAvatarBg())}>
          <AvatarImage src={message.avatar} />
          <AvatarFallback className="bg-transparent">{getAvatar()}</AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className={cn("flex-1 max-w-[85%]", isUser ? "items-end" : "items-start")}>
        {/* Name & Time */}
        <div className={cn("flex items-center gap-2 mb-1", isUser ? "justify-end" : "justify-start")}>
          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
          <span className="text-xs font-medium text-foreground">
            {isUser ? "شما" : isAI ? "هوش مصنوعی" : message.doctorName}
          </span>
          {isUser && <CheckCheck className="w-3 h-3 text-trust-500" />}
        </div>

        {/* Message Bubble */}
        {message.content && (
          <div
            className={cn(
              "inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
              isUser
                ? "bg-gradient-to-r from-trust-500 to-healing-500 text-white rounded-tr-sm shadow-lg shadow-trust-500/20"
                : "bg-muted border border-border rounded-tl-sm"
            )}
          >
            {message.content}
          </div>
        )}

        {/* Symptom Boxes */}
        {message.symptoms && message.symptoms.length > 0 && (
          <div className="space-y-2 mt-2">
            {message.symptoms.map((symptom, index) => (
              <SymptomBox
                key={symptom.id}
                symptom={symptom}
                onUpdate={onSymptomUpdate}
                onRemove={onSymptomRemove}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}