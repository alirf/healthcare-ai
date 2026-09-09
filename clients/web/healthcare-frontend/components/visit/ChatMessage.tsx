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
      <div
        className={cn(
          "flex-1 max-w-[85%] flex flex-col",
          isUser ? "items-start" : "items-end" // items-start = راست (RTL) برای کاربر، items-end = چپ برای AI
        )}
      >
        {!isUser && (
          <div className="block w-fit text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 mr-1">
            {isAI ? "هوش مصنوعی" : message.doctorName}
          </div>
        )}

        {/* Message Bubble */}
        {message.content && (
          <div
            className={cn(
              "w-fit max-w-full break-words whitespace-pre-wrap relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
              isUser
                ? "bg-[#0084ff] text-white rounded-br-sm shadow-md"
                : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-bl-sm shadow-sm"
            )}
          >
            {message.content}
            <div
              className={cn(
                "flex items-center gap-1 mt-1 text-[10px]",
                isUser ? "justify-end text-white/70" : "justify-start text-gray-400 dark:text-gray-500"
              )}
            >
              <span>{formatTime(message.timestamp)}</span>
              {isUser && <CheckCheck className="w-3 h-3" />}
            </div>
          </div>
        )}

        {/* Symptom Boxes */}
        {message.symptoms && message.symptoms.length > 0 && (
          <div className="w-full space-y-2 mt-2">
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