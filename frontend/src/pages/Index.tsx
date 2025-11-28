import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, MessageSquare, Palette, CheckCircle, FileText, Clock, Target, TrendingUp, Briefcase, Download, Eye, ChevronRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const features = [
    { icon: MessageSquare, title: "AI Диалог", description: "Интеллектуальный сбор требований через естественный диалог", color: "text-primary", bgColor: "bg-primary/10" },
    { icon: Palette, title: "Visual Designer", description: "Автоматическая генерация диаграмм процессов и архитектуры", color: "text-purple-500", bgColor: "bg-purple-500/10", badge: "NEW" },
    { icon: CheckCircle, title: "Smart Validator", description: "Проверка качества требований с оценкой полноты и рекомендациями", color: "text-success", bgColor: "bg-success/10", badge: "NEW" },
    { icon: FileText, title: "Автодокументация", description: "Генерация полного пакета документов: Use Cases, диаграммы, KPI", color: "text-primary", bgColor: "bg-primary/10" }
  ];

  const steps = [
    { number: "1", icon: MessageSquare, title: "Ведете диалог с AI", description: "AI задает уточняющие вопросы и собирает все требования", color: "bg-primary" },
    { number: "2", icon: Sparkles, title: "AI анализирует и структурирует", description: "Автоматическая проверка полноты, генерация диаграмм и валидация", color: "bg-purple-500" },
    { number: "3", icon: Download, title: "Получаете готовый документ", description: "Полный пакет требований с диаграммами и экспортом в Confluence", color: "bg-success" }
  ];

  const stats = [
    { icon: Clock, value: "80%", label: "экономия времени аналитиков" },
    { icon: FileText, value: "500+", label: "созданных документов требований" },
    { icon: Target, value: "95%", label: "точность извлечения требований" },
    { icon: TrendingUp, value: "4 мес", label: "срок окупаемости решения" }
  ];

  return (
    <div className={`${isDark ? 'bg-gray-900 text-white' : 'bg-background text-black'} min-h-screen`}>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 md:h-[72px] bg-background/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-border transition-smooth">
        <div className="container mx-auto h-full flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-3 hover-scale cursor-pointer">
            <Briefcase className="h-6 w-6 md:h-8 md:w-8 text-primary transition-smooth" />
            <span className="text-lg md:text-xl font-bold text-primary">SoloStack</span>
          </div>

          <div className="flex items-center gap-2 md:gap-4">

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-smooth hover:scale-110"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`pt-24 md:pt-32 lg:pt-[120px] pb-12 md:pb-16 lg:pb-20 ${isDark ? 'gradient-hero-dark' : 'gradient-hero'}`}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center">
            <div className="space-y-6 md:space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-3 md:mb-4">
                  SoloStack
                  <br />
                  <span className="text-primary">for ForteBank</span>
                </h1>
                <p className={`text-base md:text-lg lg:text-xl ${isDark ? 'text-gray-300' : 'text-muted-foreground'}`}>
                  Автоматизируйте сбор требований с помощью ИИ. От диалога до документа за 30 минут.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 transition-smooth shadow-lg hover:shadow-xl hover:scale-105"
                  onClick={() => navigate("/dashboard")}
                >
                  Начать работу
                  <ChevronRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
                {
//                 <Button
//                   size="lg"
//                   variant="outline"
//                   className="w-full sm:w-auto hover:border-primary transition-smooth hover-scale"
//                 >
//                   Смотреть демо
//                   <Eye className="ml-2 h-4 w-4 md:h-5 md:w-5" />
//                 </Button>
}
              </div>
              <div className="grid grid-cols-3 gap-4 md:gap-6 lg:gap-8 pt-6 md:pt-8">
                <div className="animate-fade-in">
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-1">30 мин</div>
                  <div className={`text-xs md:text-sm ${isDark ? 'text-gray-300' : 'text-muted-foreground'}`}>вместо 3 дней</div>
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-1">95%</div>
                  <div className={`text-xs md:text-sm ${isDark ? 'text-gray-300' : 'text-muted-foreground'}`}>точность</div>
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-1">500+</div>
                  <div className={`text-xs md:text-sm ${isDark ? 'text-gray-300' : 'text-muted-foreground'}`}>проектов</div>
                </div>
              </div>
            </div>

            {/* Chat preview */}
            <div className="relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 blur-3xl opacity-30 animate-pulse-slow"></div>
              <div className={`relative rounded-2xl p-4 md:p-6 shadow-elegant hover:shadow-xl transition-smooth ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-card border-border text-black'}`}>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className={`flex-1 rounded-lg p-3 ${isDark ? 'bg-gray-700 text-white' : 'bg-muted/50 text-black'}`}>
                      <p className="text-sm">Опишите проект модернизации CRM для банка</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className={`rounded-lg p-3 max-w-[80%] ${isDark ? 'bg-primary text-white' : 'bg-primary text-white'}`}>
                      <p className="text-sm">Хорошо, давайте начнем с целей проекта. Какие основные бизнес-задачи вы хотите решить?</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-11">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-muted-foreground'}`}>AI печатает...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={`py-20 ${isDark ? 'bg-gray-800' : 'bg-muted/30'}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Уникальные возможности</h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-muted-foreground'}`}>Полный цикл работы с требованиями в одном решении</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className={`rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-smooth group cursor-pointer ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-card border-border'}`}>
                <div className={`w-12 h-12 rounded-full ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  {feature.badge && (
                    <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">{feature.badge}</Badge>
                  )}
                </div>
                <p className="text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className={`py-20 ${isDark ? 'bg-gray-900' : 'bg-background'}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Как это работает</h2>
            <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-muted-foreground'}`}>Три простых шага до готового документа</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 mx-auto shadow-lg`}>
                  {step.number}
                </div>
                <step.icon className={`h-8 w-8 mx-auto mb-4 ${isDark ? 'text-gray-300' : 'text-muted-foreground'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{step.title}</h3>
                <p className={`${isDark ? 'text-gray-300' : 'text-muted-foreground'}`}>{step.description}</p>
                {index < steps.length - 1 && <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-muted-foreground/30"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Результаты, которые говорят сами за себя</h2>
            <p className="text-xl opacity-90">Проверенная эффективность на реальных проектах ForteBank</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-4 opacity-90" />
                <div className="text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className={`py-20 px-4 relative ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-4xl md:text-5xl font-heading font-bold text-center mb-16 animate-fade-in ${isDark ? 'text-white' : 'text-black'}`}>Team</h2>
          <div className="glass glass-hover rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 animate-fade-in-up">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#00D9FF]/40 glow-indigo">
                <img src="profile.png" alt="User avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className={`text-3xl font-heading font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Nargiza Kuzybakhova</h3>
              <p className={`text-xl mb-4 font-semibold ${isDark ? 'text-[#00D9FF]' : 'text-blue-500'}`}>Full-stack Developer & AI Enthusiast</p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Я студентка второго курса AITU по направлению Software Engineering.
                Увлекаюсь созданием технологий, которые делают жизнь людей лучше.
                На хакатонах я объединила навыки в области ИИ и full-stack разработки.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`py-24 ${isDark ? 'gradient-hero-dark' : 'gradient-hero'}`}>
        <div className="container mx-auto px-6 text-center">
          <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Готовы автоматизировать работу аналитиков?</h2>
          <p className={`text-xl mb-8 ${isDark ? 'text-gray-300' : 'text-muted-foreground'}`}>Начните использовать SoloStack сегодня и сократите время подготовки документов в 6 раз.</p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 transition-smooth shadow-lg hover:shadow-xl hover:scale-105">
            Начать сейчас
          </Button>
        </div>
      </section>
       <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="font-semibold">AI-Business Analyst</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 SoloStack. Created by Kuzybakhova Nargiza
            </p>
          </div>
        </div>
      </footer>
    </div>

  );

};

export default Index;
