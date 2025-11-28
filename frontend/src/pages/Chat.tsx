import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypewriterText } from "@/components/TypewriterText";
import { VoiceInput } from "@/components/VoiceInput";
import { FileUpload } from "@/components/FileUpload";
import { NewProjectModal, ProjectConfig } from "@/components/NewProjectModal";

import ApiService from "@/services/apiService";
import { ProjectResponse, ChatMessage } from "@/services/apiService";

import {
  MessageSquare,
  Plus,
  Send,
  FileText,
  Sparkles,
  User,
  Bot,
  Paperclip,
  Settings,
  Loader2,
  ChevronRight,
  MessageCircle,
  X
} from "lucide-react";

// ========================
// INTERFACES
// ========================

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatSession {
  id: string;
  project_id: string;
  title: string;
  created_at: Date;
  message_count: number;
}

// ========================
// MAIN COMPONENT
// ========================

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ========================
  // STATE MANAGEMENT
  // ========================
  
  // Projects & Chats
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectResponse | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  // UI States
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingChats, setLoadingChats] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // ========================
  // EFFECTS
  // ========================
  
  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);
  
  // Handle URL params for project/chat selection
  useEffect(() => {
    const projectId = searchParams.get('project');
    const chatId = searchParams.get('chat');
    
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project && project !== currentProject) {
        selectProject(project);
      }
    }
    
    if (chatId && chatId !== currentChatId) {
      selectChat(chatId);
    }
  }, [searchParams, projects]);
  
  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // ========================
  // PROJECT MANAGEMENT
  // ========================
  
  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const projectsData = await ApiService.getAllProjects();
      setProjects(projectsData);
      
      // Auto-select first project if none selected, OR create one if none exist
      if (projectsData.length > 0 && !currentProject) {
        selectProject(projectsData[0]);
      } else if (projectsData.length === 0) {
        // Auto-create first project for demo
        console.log('No projects found, will show New Project modal');
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Ошибка загрузки проектов');
    } finally {
      setLoadingProjects(false);
    }
  };
  
  const selectProject = async (project: ProjectResponse) => {
    if (project === currentProject) return;
    
    setCurrentProject(project);
    setSearchParams(prev => {
      prev.set('project', project.id);
      prev.delete('chat'); // Clear chat when switching projects
      return prev;
    });
    
    // Load chats for this project
    loadChatSessions(project.id);
  };
  
  const loadChatSessions = async (projectId: string) => {
    try {
      setLoadingChats(true);
      // TODO: Add API endpoint for chat sessions
      // const chats = await ApiService.getChatSessions(projectId);
      
      // Mock chat sessions for now
      const mockChats: ChatSession[] = [
        {
          id: 'default',
          project_id: projectId,
          title: 'Общий чат',
          created_at: new Date(),
          message_count: 0
        }
      ];
      
      setChatSessions(mockChats);
      
      // Auto-select first chat
      if (mockChats.length > 0) {
        selectChat(mockChats[0].id);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      toast.error('Ошибка загрузки чатов');
    } finally {
      setLoadingChats(false);
    }
  };
  
  // ========================
  // CHAT MANAGEMENT
  // ========================
  
  const selectChat = async (chatId: string) => {
    if (chatId === currentChatId) return;
    
    setCurrentChatId(chatId);
    setSearchParams(prev => {
      if (currentProject) prev.set('project', currentProject.id);
      prev.set('chat', chatId);
      return prev;
    });
    
    // Load chat history
    loadChatHistory(chatId);
  };
  
  const loadChatHistory = async (chatId: string) => {
    if (!currentProject) return;
    
    try {
      setIsLoading(true);
      
      // Load from API
      const historyResponse = await ApiService.getChatHistory(currentProject.id);
      
      // Convert to Message format
      const formattedMessages: Message[] = historyResponse.messages.map((msg, index) => ({
        id: `${index}`,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp || new Date().toISOString())
      }));
      
      setMessages(formattedMessages);
      
      // Add welcome message if empty
      if (formattedMessages.length === 0) {
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: `Привет! Я AI Business Analyst. Готов помочь с проектом "${currentProject.name}". О чём поговорим?`,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast.error('Ошибка загрузки истории чата');
    } finally {
      setIsLoading(false);
    }
  };
  
  const createNewChat = async () => {
    if (!currentProject) return;
    
    // TODO: API call to create new chat session
    const newChat: ChatSession = {
      id: `chat_${Date.now()}`,
      project_id: currentProject.id,
      title: `Чат ${chatSessions.length + 1}`,
      created_at: new Date(),
      message_count: 0
    };
    
    setChatSessions(prev => [...prev, newChat]);
    selectChat(newChat.id);
    toast.success('Новый чат создан!');
  };
  
  // ========================
  // MESSAGE HANDLING
  // ========================
  
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isAiTyping || !currentProject || !currentChatId) return;
    
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsAiTyping(true);
    
    // Add typing indicator
    const typingId = `ai_typing_${Date.now()}`;
    const typingMessage: Message = {
      id: typingId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);
    
    try {
      // Prepare chat history INCLUDING current user message
      const chatHistory: ChatMessage[] = [
        ...messages
          .filter(m => m.role !== "system" && !m.isTyping)
          .map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: m.timestamp.toISOString(),
          })),
        // Add current user message to history
        {
          role: "user" as const,
          content: content.trim(),
          timestamp: new Date().toISOString(),
        }
      ];

      // Keep only last 15 messages for context (to avoid token limit)
      const recentHistory = chatHistory.slice(-15);

      // Send to backend
      const response = await ApiService.sendChatMessage({
        project_id: currentProject.id,
        message: content.trim(),
        history: recentHistory,
      });
      
      // Replace typing message with actual response
      setMessages(prev => prev.filter(m => m.id !== typingId));
      
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Start typewriter effect
      simulateTyping(response.message, aiMessage.id);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== typingId));
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: `Извините, произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Ошибка отправки сообщения');
    } finally {
      setIsAiTyping(false);
    }
  }, [currentProject, currentChatId, messages, isAiTyping]);
  
  const simulateTyping = (text: string, messageId: string) => {
    const chars = text.split('');
    let currentIndex = 0;
    let accumulatedText = '';
    
    const typingInterval = setInterval(() => {
      if (currentIndex < chars.length) {
        accumulatedText += chars[currentIndex];
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId 
              ? { ...msg, content: accumulatedText, isTyping: true }
              : msg
          )
        );
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setMessages(prev =>
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, isTyping: false }
              : msg
          )
        );
      }
    }, 40); // 40ms per character
  };
  
  // ========================
  // PROJECT CREATION
  // ========================
  
  const handleProjectCreated = async (config: ProjectConfig) => {
    try {
      console.log('Creating project with config:', config);
      
      const newProject = await ApiService.createProject({
        name: config.name,
        type: config.type || 'web',
        priority: config.priority || 'medium',
        description: config.description || '',
      });
      
      console.log('Project created:', newProject);
      
      setProjects(prev => [...prev, newProject]);
      setShowNewProjectModal(false);
      selectProject(newProject);
      
      toast.success(`Проект "${newProject.name}" создан!`);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error(`Ошибка создания проекта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };
  
  // ========================
  // VOICE & FILE HANDLING
  // ========================
  
  const handleVoiceTranscript = (transcript: string) => {
    setInputValue(transcript);
  };

  const handleFileAnalyzed = (analysis: any) => {
    setShowFileUpload(false);
    // Add file analysis as a message
    const fileMessage = `📎 Файл проанализирован:\n\n${JSON.stringify(analysis, null, 2)}`;
    sendMessage(fileMessage);
  };
  
  // ========================
  // UTILITIES
  // ========================
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };
  
  const canSendMessage = inputValue.trim().length > 0 && !isAiTyping && currentProject && currentChatId;
  
  // ========================
  // RENDER
  // ========================
  
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* ======================== */}
      {/* LEFT SIDEBAR - PROJECTS & CHATS */}
      {/* ======================== */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">AI Business Analyst</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">ForteBank</p>
            </div>
          </div>
          
          {/* New Project Button */}
          <Button 
            onClick={() => setShowNewProjectModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Новый проект
          </Button>
        </div>
        
        {/* Projects List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2">
              {loadingProjects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Нет проектов</p>
                  <p className="text-sm">Создайте первый проект</p>
                </div>
              ) : (
                projects.map(project => (
                  <div key={project.id} className="mb-3">
                    {/* Project Header */}
                    <button
                      onClick={() => selectProject(project)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        currentProject?.id === project.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {project.type} • {project.priority}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                          currentProject?.id === project.id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </button>
                    
                    {/* Chat Sessions for Selected Project */}
                    {currentProject?.id === project.id && (
                      <div className="ml-4 mt-2 space-y-1">
                        {loadingChats ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          </div>
                        ) : (
                          <>
                            {chatSessions.map(chat => (
                              <button
                                key={chat.id}
                                onClick={() => selectChat(chat.id)}
                                className={`w-full p-2 rounded text-left text-sm transition-colors ${
                                  currentChatId === chat.id
                                    ? 'bg-blue-100 dark:bg-blue-800/30 text-blue-900 dark:text-blue-100'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <MessageCircle className="w-3 h-3" />
                                  <span className="truncate">{chat.title}</span>
                                  {chat.message_count > 0 && (
                                    <span className="ml-auto text-xs text-gray-400">
                                      {chat.message_count}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                            
                            {/* New Chat Button */}
                            <button
                              onClick={createNewChat}
                              className="w-full p-2 rounded text-left text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Plus className="w-3 h-3" />
                                <span>Новый чат</span>
                              </div>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
      
      {/* ======================== */}
      {/* MAIN CHAT AREA */}
      {/* ======================== */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {currentProject?.name || 'Выберите проект'}
              </h2>
              {currentChatId && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {chatSessions.find(c => c.id === currentChatId)?.title || 'Чат'}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {currentProject && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/document', { state: { projectId: currentProject.id } })}
                  disabled={messages.length < 5}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Создать документ
                </Button>
              )}
              
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                    <p className="text-gray-500">Загружаем историю чата...</p>
                  </div>
                </div>
              ) : !currentProject ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Добро пожаловать!
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Выберите проект или создайте новый, чтобы начать диалог с AI
                    </p>
                    <Button onClick={() => setShowNewProjectModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Создать проект
                    </Button>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Bot className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Начнем диалог!
                    </h3>
                    <p className="text-gray-500">
                      Расскажите о вашем проекте или задайте вопрос
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {/* Avatar */}
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      {/* Message Content */}
                      <div className={`max-w-[70%] ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      } rounded-2xl px-4 py-3`}>
                       <div className="whitespace-pre-wrap">{message.content}</div>
                        
                        {/* Timestamp */}
                        <div className={`text-xs mt-1 ${
                          message.role === 'user' 
                            ? 'text-blue-100' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      
                      {/* User Avatar */}
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isAiTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Input Area */}
        {currentProject && currentChatId && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-end gap-2">
              {/* File Upload Button 
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(true)}
                className="mb-2"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              */}
              {/* Voice Input */}
              <VoiceInput onTranscript={handleVoiceTranscript} />

              {/* Text Input */}
              <div className="flex-1">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Напишите сообщение..."
                  disabled={isAiTyping}
                  className="min-h-[44px] resize-none"
                />
              </div>
              
              {/* Send Button */}
              <Button
                onClick={() => sendMessage(inputValue)}
                disabled={!canSendMessage}
                className="mb-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* ======================== */}
      {/* MODALS */}
      {/* ======================== */}
      
      {/* New Project Modal */}
      <NewProjectModal
        open={showNewProjectModal}
        onOpenChange={setShowNewProjectModal}
        onCreateProject={handleProjectCreated}
      />
      
      {/* File Upload Modal */}
      {/* {showFileUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            
            <button
              onClick={() => setShowFileUpload(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Загрузить файл
            </h3>
            <FileUpload
              onAnalysisComplete={handleFileAnalyzed}
              onClose={() => setShowFileUpload(false)}
            />
          </div>
        </div>
      )}
       */}
    </div>
  );
};

export default Chat;