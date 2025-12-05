import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { Send, User, Bot, Sparkles, Briefcase, Mail, Github, Linkedin, Twitter, Instagram, Dribbble, ExternalLink, Code, Palette, Layout, Globe, ArrowUpRight, MessageSquare, RefreshCcw, Zap, Download, MonitorPlay } from 'lucide-react';

// --- Types ---

interface Project {
  title: string;
  description: string;
  tags: string[];
  demoUrl?: string;
  repoUrl?: string;
  imageUrl?: string;
}

interface PersonalInfo {
  name: string;
  role: string;
  bio: string;
}

interface ContactInfo {
  email?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  dribbble?: string;
}

interface PortfolioData {
  theme: 'minimal-light' | 'modern-dark' | 'professional-blue' | 'creative-purple';
  personalInfo: PersonalInfo;
  projects: Project[];
  contact: ContactInfo;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

// --- Initial Data ---

const initialPortfolio: PortfolioData | null = null;

// --- Helper for Dynamic Chat Themes ---
const getChatTheme = (portfolioTheme: string) => {
  switch (portfolioTheme) {
    case 'modern-dark':
      return {
        userBubble: 'bg-indigo-600 text-white shadow-indigo-500/20',
        botBubble: 'bg-gray-800 border-gray-700 text-gray-200',
        avatarUser: 'bg-indigo-500',
        avatarBot: 'bg-emerald-500',
        inputRing: 'focus-within:ring-indigo-500/50',
        sendButton: 'bg-indigo-600 hover:bg-indigo-500',
        bg: 'bg-gray-900',
        headerBg: 'bg-gray-900/80 border-gray-800',
        text: 'text-gray-100'
      };
    case 'creative-purple':
      return {
        userBubble: 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-purple-500/20',
        botBubble: 'bg-white border-purple-100 text-gray-800',
        avatarUser: 'bg-fuchsia-500',
        avatarBot: 'bg-purple-500',
        inputRing: 'focus-within:ring-purple-500/40',
        sendButton: 'bg-purple-600 hover:bg-purple-500',
        bg: 'bg-purple-50/50',
        headerBg: 'bg-white/80 border-purple-100',
        text: 'text-gray-900'
      };
    case 'professional-blue':
      return {
        userBubble: 'bg-blue-600 text-white shadow-blue-500/20',
        botBubble: 'bg-white border-blue-100 text-slate-800',
        avatarUser: 'bg-blue-500',
        avatarBot: 'bg-sky-500',
        inputRing: 'focus-within:ring-blue-500/40',
        sendButton: 'bg-blue-600 hover:bg-blue-700',
        bg: 'bg-slate-50',
        headerBg: 'bg-white/80 border-slate-200',
        text: 'text-slate-900'
      };
    case 'minimal-light':
    default:
      return {
        userBubble: 'bg-gray-900 text-white shadow-gray-500/20',
        botBubble: 'bg-white border-gray-200 text-gray-800',
        avatarUser: 'bg-gray-800',
        avatarBot: 'bg-gray-600',
        inputRing: 'focus-within:ring-gray-400/40',
        sendButton: 'bg-gray-900 hover:bg-black',
        bg: 'bg-white',
        headerBg: 'bg-white/90 border-gray-100',
        text: 'text-gray-900'
      };
  }
};

// --- Theme Configurations Helper (Shared) ---
const getThemeConfig = (themeName: string) => {
  const themes = {
    'minimal-light': {
      wrapper: 'bg-white',
      text: 'text-gray-900',
      textMuted: 'text-gray-500',
      accent: 'text-gray-900',
      cardBg: 'bg-gray-50',
      cardBorder: 'border-gray-200',
      button: 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg',
      filterActive: 'bg-gray-900 text-white shadow-md',
      filterInactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      gradient: 'from-gray-50 to-white'
    },
    'modern-dark': {
      wrapper: 'bg-gray-950',
      text: 'text-gray-100',
      textMuted: 'text-gray-400',
      accent: 'text-indigo-400',
      cardBg: 'bg-gray-900/80 backdrop-blur-sm',
      cardBorder: 'border-gray-800',
      button: 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-indigo-500/25 hover:shadow-lg',
      filterActive: 'bg-indigo-600 text-white shadow-indigo-900/50 shadow-lg',
      filterInactive: 'bg-gray-800 text-gray-400 hover:bg-gray-700',
      gradient: 'from-gray-900 via-gray-950 to-black'
    },
    'professional-blue': {
      wrapper: 'bg-slate-50',
      text: 'text-slate-900',
      textMuted: 'text-slate-600',
      accent: 'text-blue-600',
      cardBg: 'bg-white shadow-sm',
      cardBorder: 'border-blue-100',
      button: 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 hover:shadow-xl',
      filterActive: 'bg-blue-600 text-white shadow-blue-200 shadow-md',
      filterInactive: 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600',
      gradient: 'from-slate-50 to-blue-50/30'
    },
    'creative-purple': {
      wrapper: 'bg-purple-50',
      text: 'text-gray-900',
      textMuted: 'text-gray-600',
      accent: 'text-purple-600',
      cardBg: 'bg-white/70 backdrop-blur-md shadow-sm',
      cardBorder: 'border-purple-100',
      button: 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-purple-200 hover:shadow-xl',
      filterActive: 'bg-purple-600 text-white shadow-purple-200 shadow-lg',
      filterInactive: 'bg-white/80 text-purple-700 border border-purple-100 hover:bg-white',
      gradient: 'from-fuchsia-50 via-purple-50 to-indigo-50'
    },
  };
  return themes[themeName as keyof typeof themes] || themes['minimal-light'];
};

// --- Export Function ---
const generateHtml = (data: PortfolioData) => {
  const t = getThemeConfig(data.theme);
  
  const titleGradient = data.theme === 'modern-dark' ? 'from-indigo-400 to-cyan-400' : 
                 data.theme === 'creative-purple' ? 'from-purple-600 to-pink-500' :
                 data.theme === 'professional-blue' ? 'from-blue-700 to-blue-500' :
                 'from-gray-900 to-gray-600';

  const statusDot = data.theme === 'modern-dark' ? 'bg-green-400' : 'bg-green-500';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.personalInfo.name} - Portfolio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      body { font-family: 'Inter', sans-serif; }
      .reveal { opacity: 0; transform: translateY(20px); transition: all 0.6s ease-out; }
      .reveal.active { opacity: 1; transform: translateY(0); }
    </style>
</head>
<body class="${t.wrapper} ${t.text} min-h-screen relative selection:bg-indigo-500 selection:text-white">
    <div class="fixed inset-0 bg-gradient-to-br ${t.gradient} opacity-50 pointer-events-none -z-10"></div>

    <div class="max-w-4xl mx-auto px-8 py-20 space-y-24">
        
        <header class="space-y-8 reveal">
           <div class="flex justify-between items-start">
             <div class="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full ${t.cardBg} border ${t.cardBorder} shadow-sm backdrop-blur-sm">
               <span class="w-2 h-2 rounded-full ${statusDot} animate-pulse"></span>
               Available for work
             </div>
           </div>
           
           <div class="space-y-6 max-w-2xl">
             <h1 class="text-6xl md:text-7xl font-extrabold tracking-tight leading-tight">
               Hello, I'm <br/>
               <span class="bg-clip-text text-transparent bg-gradient-to-r ${titleGradient}">
                 ${data.personalInfo.name}
               </span>.
             </h1>
             <p class="text-2xl md:text-3xl ${t.textMuted} font-light tracking-wide">
               ${data.personalInfo.role}
             </p>
             <p class="${t.textMuted} text-lg leading-relaxed max-w-lg">
               ${data.personalInfo.bio}
             </p>
           </div>
           
           <div class="flex flex-wrap gap-4 pt-4">
             ${data.contact.email ? `
               <a href="mailto:${data.contact.email}" class="group flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 ${t.button}">
                 <i data-lucide="mail" class="w-5 h-5 group-hover:animate-bounce"></i> 
                 Get in Touch
               </a>` : ''}
             
             <div class="flex gap-3">
               ${data.contact.github ? `
               <a href="${data.contact.github}" target="_blank" class="p-4 rounded-xl border ${t.cardBorder} ${t.cardBg} hover:opacity-80 transition-all transform hover:-translate-y-1 hover:shadow-md group">
                 <i data-lucide="github" class="w-[22px] h-[22px] transition-transform group-hover:scale-110 ${t.accent}"></i>
               </a>` : ''}
               ${data.contact.linkedin ? `
               <a href="${data.contact.linkedin}" target="_blank" class="p-4 rounded-xl border ${t.cardBorder} ${t.cardBg} hover:opacity-80 transition-all transform hover:-translate-y-1 hover:shadow-md group">
                 <i data-lucide="linkedin" class="w-[22px] h-[22px] transition-transform group-hover:scale-110 ${t.accent}"></i>
               </a>` : ''}
               ${data.contact.twitter ? `
               <a href="${data.contact.twitter}" target="_blank" class="p-4 rounded-xl border ${t.cardBorder} ${t.cardBg} hover:opacity-80 transition-all transform hover:-translate-y-1 hover:shadow-md group">
                 <i data-lucide="twitter" class="w-[22px] h-[22px] transition-transform group-hover:scale-110 ${t.accent}"></i>
               </a>` : ''}
               ${data.contact.instagram ? `
               <a href="${data.contact.instagram}" target="_blank" class="p-4 rounded-xl border ${t.cardBorder} ${t.cardBg} hover:opacity-80 transition-all transform hover:-translate-y-1 hover:shadow-md group">
                 <i data-lucide="instagram" class="w-[22px] h-[22px] transition-transform group-hover:scale-110 ${t.accent}"></i>
               </a>` : ''}
               ${data.contact.dribbble ? `
               <a href="${data.contact.dribbble}" target="_blank" class="p-4 rounded-xl border ${t.cardBorder} ${t.cardBg} hover:opacity-80 transition-all transform hover:-translate-y-1 hover:shadow-md group">
                 <i data-lucide="dribbble" class="w-[22px] h-[22px] transition-transform group-hover:scale-110 ${t.accent}"></i>
               </a>` : ''}
             </div>
           </div>
        </header>

        <section class="space-y-10 reveal">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <i data-lucide="sparkles" class="w-6 h-6 ${t.accent}"></i>
                <h2 class="text-3xl font-bold tracking-tight">Featured Work</h2>
              </div>
              <p class="${t.textMuted}">A collection of projects I've worked on.</p>
            </div>
            
            <div class="flex flex-wrap gap-2" id="filter-container">
               <button data-filter="All" class="filter-btn px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${t.filterActive}">All</button>
               ${Array.from(new Set(data.projects.flatMap(p => p.tags))).sort().map(tag => `
                 <button data-filter="${tag}" class="filter-btn px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${t.filterInactive}">${tag}</button>
               `).join('')}
            </div>
          </div>
          
          <div class="grid md:grid-cols-2 gap-8" id="projects-grid">
            ${data.projects.map(project => `
              <div class="project-card group relative rounded-3xl border ${t.cardBorder} ${t.cardBg} hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full overflow-hidden" data-tags="${project.tags.join(',')}">
                ${project.imageUrl ? `
                <div class="h-48 w-full overflow-hidden relative border-b border-gray-100/10">
                  <img src="${project.imageUrl}" alt="${project.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>` : ''}

                <div class="p-8 flex flex-col flex-grow">
                   <div class="flex justify-between items-start mb-6">
                    <h3 class="text-2xl font-bold group-hover:text-indigo-500 transition-colors">${project.title}</h3>
                    <div class="p-3 rounded-2xl bg-opacity-5 ${data.theme === 'modern-dark' ? 'bg-white' : 'bg-black'} group-hover:scale-110 transition-transform duration-300">
                      <i data-lucide="code" class="w-6 h-6 ${t.accent}"></i>
                    </div>
                   </div>
                   <p class="${t.textMuted} mb-8 text-base leading-relaxed grow">${project.description}</p>
                   
                   <div class="mt-auto space-y-6">
                     <div class="flex flex-wrap gap-2">
                       ${project.tags.map(tag => `
                         <span class="text-xs font-medium px-3 py-1.5 rounded-lg border ${t.cardBorder} bg-opacity-50 opacity-70 group-hover:opacity-100 transition-opacity">#${tag}</span>
                       `).join('')}
                     </div>
                     <div class="flex items-center gap-3 pt-4 border-t border-gray-100/10">
                       ${project.demoUrl ? `
                       <a href="${project.demoUrl}" target="_blank" class="flex items-center gap-2 text-sm font-semibold ${t.text} hover:opacity-70 transition-opacity">
                         <i data-lucide="external-link" class="w-4 h-4"></i> Live Demo
                       </a>` : ''}
                       ${project.repoUrl ? `
                       <a href="${project.repoUrl}" target="_blank" class="flex items-center gap-2 text-sm font-semibold ${t.text} hover:opacity-70 transition-opacity ml-auto">
                         <i data-lucide="github" class="w-4 h-4"></i> Source Code
                       </a>` : ''}
                     </div>
                   </div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <footer class="pt-12 pb-8 border-t ${t.cardBorder} flex flex-col md:flex-row justify-between items-center gap-4 ${t.textMuted} text-sm reveal">
          <p class="font-medium">© ${new Date().getFullYear()} ${data.personalInfo.name}</p>
          <div class="flex gap-8 items-center">
             <span class="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity cursor-default">
               <i data-lucide="palette" class="w-3.5 h-3.5"></i> ${data.theme.replace('-', ' ')}
             </span>
            <span class="flex items-center gap-2 font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-purple-500"></i> Designed by AI
            </span>
          </div>
        </footer>

    </div>

    <script>
      lucide.createIcons();
      document.addEventListener('DOMContentLoaded', () => {
        const reveals = document.querySelectorAll('.reveal');
        setTimeout(() => {
          reveals.forEach((el, i) => {
             setTimeout(() => el.classList.add('active'), i * 150);
          });
        }, 100);
      });

      const filterBtns = document.querySelectorAll('.filter-btn');
      const cards = document.querySelectorAll('.project-card');

      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => {
             if(b === btn) {
               b.className = "filter-btn px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${t.filterActive}";
             } else {
               b.className = "filter-btn px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${t.filterInactive}";
             }
          });
          const filter = btn.getAttribute('data-filter');
          cards.forEach(card => {
            const tags = card.getAttribute('data-tags').split(',');
            if (filter === 'All' || tags.includes(filter)) {
              card.style.display = 'flex';
              setTimeout(() => card.style.opacity = '1', 50);
            } else {
              card.style.display = 'none';
              card.style.opacity = '0';
            }
          });
        });
      });
    </script>
</body>
</html>`;
};

// --- Components ---

// Chat Message Component with enhanced UI
const ChatMessage: React.FC<{ message: Message; chatTheme: any }> = ({ message, chatTheme }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex w-full mb-6 animate-slide-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 hover:scale-110 text-white ${
            isUser ? chatTheme.avatarUser : chatTheme.avatarBot
        }`}>
          {isUser ? <User size={14} /> : <Zap size={14} fill="currentColor" />}
        </div>

        {/* Bubble */}
        <div className={`relative px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all duration-300 hover:shadow-md border ${
          isUser 
            ? `${chatTheme.userBubble} border-transparent rounded-2xl rounded-tr-sm` 
            : `${chatTheme.botBubble} rounded-2xl rounded-tl-sm`
        }`}>
            {message.text}
        </div>
      </div>
    </div>
  );
};

const PortfolioRenderer = ({ data }: { data: PortfolioData | null }) => {
  const [filter, setFilter] = useState('All');

  // Reset filter when data changes (e.g. new AI generation)
  useEffect(() => {
    setFilter('All');
  }, [data]);

  const handleDownload = () => {
    if (!data) return;
    const htmlContent = generateHtml(data);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.personalInfo.name.replace(/\s+/g, '-').toLowerCase()}-portfolio.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenPreview = () => {
    if (!data) return;
    const htmlContent = generateHtml(data);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 animate-bounce">
          <Layout size={40} className="text-indigo-400" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-700 mb-3 animate-slide-up">Your Portfolio Preview</h3>
        <p className="max-w-xs text-base text-gray-500 animate-slide-up stagger-1">Chat with the AI to generate your personal portfolio website. It will appear here instantly.</p>
      </div>
    );
  }

  const { theme, personalInfo, projects, contact } = data;

  // Filter Logic
  const allTags = Array.from(new Set(projects.flatMap(p => p.tags))).sort();
  const filteredProjects = filter === 'All' 
    ? projects 
    : projects.filter(p => p.tags.includes(filter));

  const t = getThemeConfig(theme);

  return (
    <div className={`h-full w-full overflow-y-auto ${t.wrapper} ${t.text} transition-all duration-700 ease-in-out relative`}>
      {/* Dynamic Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-50 pointer-events-none fixed h-full w-full`} />
      
      {/* Floating Toolbar */}
      <div className="absolute top-6 right-6 z-50 flex gap-2 animate-fade-in">
        <button 
          onClick={handleOpenPreview}
          className={`p-3 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all ${theme === 'modern-dark' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'} border ${t.cardBorder}`}
          title="Open in new tab"
        >
          <MonitorPlay size={20} />
        </button>
        <button 
          onClick={handleDownload}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg font-semibold hover:scale-105 active:scale-95 transition-all ${t.button}`}
          title="Download HTML"
        >
          <Download size={20} />
          <span>Export</span>
        </button>
      </div>

      {/* Styles for Animations */}
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; opacity: 0; }
        .stagger-1 { animation-delay: 100ms; }
        .stagger-2 { animation-delay: 200ms; }
        .stagger-3 { animation-delay: 300ms; }
        .stagger-4 { animation-delay: 400ms; }
        .stagger-5 { animation-delay: 500ms; }
      `}</style>

      <div className="max-w-4xl mx-auto px-8 py-20 space-y-24 relative z-10">
        
        {/* Hero Section */}
        <header className="space-y-8 animate-slide-up">
          <div className="flex justify-between items-start">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-full ${t.cardBg} border ${t.cardBorder} shadow-sm backdrop-blur-sm`}>
              <span className={`w-2 h-2 rounded-full ${theme === 'modern-dark' ? 'bg-green-400' : 'bg-green-500'} animate-pulse`}></span>
              Available for work
            </div>
            {/* Decorative Element */}
            <div className={`hidden md:block opacity-20 ${t.accent}`}>
               <Globe size={120} strokeWidth={0.5} className="animate-[spin_60s_linear_infinite]" />
            </div>
          </div>
          
          <div className="space-y-6 max-w-2xl -mt-20">
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Hello, I'm <br/>
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${theme === 'modern-dark' ? 'from-indigo-400 to-cyan-400' : 'from-gray-900 to-gray-600'} ${theme === 'creative-purple' ? 'from-purple-600 to-pink-500' : ''} ${theme === 'professional-blue' ? 'from-blue-700 to-blue-500' : ''}`}>
                {personalInfo.name}
              </span>.
            </h1>
            <p className={`text-2xl md:text-3xl ${t.textMuted} font-light tracking-wide`}>
              {personalInfo.role}
            </p>
            <p className={`${t.textMuted} text-lg leading-relaxed max-w-lg`}>
              {personalInfo.bio}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 pt-4 stagger-1 animate-slide-up">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className={`group flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 ${t.button}`}>
                <Mail size={20} className="group-hover:animate-bounce" /> 
                Get in Touch
              </a>
            )}
            <div className="flex gap-3">
              {[
                { link: contact.github, icon: Github },
                { link: contact.linkedin, icon: Linkedin },
                { link: contact.twitter, icon: Twitter },
                { link: contact.instagram, icon: Instagram },
                { link: contact.dribbble, icon: Dribbble }
              ].map((item, idx) => item.link && (
                <a key={idx} href={item.link} target="_blank" rel="noreferrer" className={`p-4 rounded-xl border ${t.cardBorder} ${t.cardBg} hover:opacity-80 transition-all transform hover:-translate-y-1 hover:shadow-md group`}>
                  <item.icon size={22} className={`transition-transform group-hover:scale-110 ${t.accent}`} />
                </a>
              ))}
            </div>
          </div>
        </header>

        {/* Projects Section */}
        <section className="space-y-10 animate-slide-up stagger-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles size={24} className={`${t.accent} animate-pulse`} />
                <h2 className="text-3xl font-bold tracking-tight">Featured Work</h2>
              </div>
              <p className={t.textMuted}>A collection of projects I've worked on.</p>
            </div>
            
            {/* Tag Filters */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('All')}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    filter === 'All' ? t.filterActive : t.filterInactive
                  }`}
                >
                  All
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilter(tag)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      filter === tag ? t.filterActive : t.filterInactive
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {filteredProjects.map((project, idx) => (
              <div 
                key={`${project.title}-${idx}`} 
                className={`group relative rounded-3xl border ${t.cardBorder} ${t.cardBg} hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col h-full animate-slide-up overflow-hidden`}
                style={{ animationDelay: `${(idx + 1) * 100}ms` }}
              >
                {/* Project Image */}
                {project.imageUrl && (
                  <div className="h-48 w-full overflow-hidden relative border-b border-gray-100/10">
                    <img 
                      src={project.imageUrl} 
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                )}

                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-current group-hover:to-gray-400 transition-colors">
                        {project.title}
                      </h3>
                    </div>
                    {/* Icon only shows if no image, or smaller if image exists? Let's keep consistent */}
                    <div className={`p-3 rounded-2xl bg-opacity-5 ${theme === 'modern-dark' ? 'bg-white' : 'bg-black'} group-hover:scale-110 transition-transform duration-300`}>
                      <Code size={24} className={t.accent} />
                    </div>
                  </div>
                  
                  <p className={`${t.textMuted} mb-8 text-base leading-relaxed grow`}>
                    {project.description}
                  </p>
                  
                  <div className="mt-auto space-y-6">
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, tagIdx) => (
                        <span key={tagIdx} className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${t.cardBorder} bg-opacity-50 opacity-70 group-hover:opacity-100 transition-opacity`}>
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100/10">
                      {project.demoUrl && (
                        <a 
                          href={project.demoUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className={`flex items-center gap-2 text-sm font-semibold ${t.text} hover:opacity-70 transition-opacity`}
                        >
                          <ExternalLink size={16} /> Live Demo
                        </a>
                      )}
                      {project.repoUrl && (
                        <a 
                          href={project.repoUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className={`flex items-center gap-2 text-sm font-semibold ${t.text} hover:opacity-70 transition-opacity ml-auto`}
                        >
                          <Github size={16} /> Source Code
                        </a>
                      )}
                      {(!project.demoUrl && !project.repoUrl) && (
                        <span className={`text-xs ${t.textMuted}`}>No links available</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Hover Effect Ring */}
                <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500 ring-2 ring-indigo-500/20`} />
              </div>
            ))}
            {filteredProjects.length === 0 && (
                <div className={`col-span-2 py-20 text-center ${t.textMuted} animate-fade-in`}>
                    <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                      <Sparkles size={32} className="text-gray-400" />
                    </div>
                    <p className="text-lg">No projects found for <span className="font-semibold">"{filter}"</span>.</p>
                </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className={`pt-12 pb-8 border-t ${t.cardBorder} flex flex-col md:flex-row justify-between items-center gap-4 ${t.textMuted} text-sm animate-fade-in stagger-3`}>
          <p className="font-medium">© {new Date().getFullYear()} {personalInfo.name}</p>
          <div className="flex gap-8 items-center">
             <span className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity cursor-default">
               <Palette size={14} /> {theme.replace('-', ' ')}
             </span>
            <span className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent font-bold">
              <Sparkles size={14} className="text-purple-500" /> Designed by AI
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

const App = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi! I'm your AI Portfolio Architect. Tell me about yourself, your skills, and your projects, and I'll build a stunning website for you instantly." }
  ]);
  const [inputText, setInputText] = useState('');
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(initialPortfolio);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    // API Key check
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setError("API Key not found. Please set process.env.API_KEY.");
      return;
    }

    const userText = inputText.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputText('');
    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Context Preparation
      const history = messages.slice(-8).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const currentContext = `Current Portfolio State: ${portfolioData ? JSON.stringify(portfolioData) : "null"}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            ...history,
            { role: 'user', parts: [{ text: `${userText}\n\n[SYSTEM: ${currentContext}]` }] }
        ],
        config: {
            systemInstruction: "You are an AI Portfolio Architect. Gather user info (Name, Bio, Role, Projects, Contact) and generate a portfolio website JSON. \n" +
            "Response Format: JSON object with 'chatResponse' (string) and 'portfolio' (PortfolioData object or null). \n" +
            "If updating portfolio, return the COMPLETE object. Default theme: 'minimal-light'.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    chatResponse: { type: Type.STRING },
                    portfolio: {
                        type: Type.OBJECT,
                        nullable: true,
                        properties: {
                            theme: { type: Type.STRING, enum: ['minimal-light', 'modern-dark', 'professional-blue', 'creative-purple'] },
                            personalInfo: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    role: { type: Type.STRING },
                                    bio: { type: Type.STRING }
                                },
                                required: ['name', 'role', 'bio']
                            },
                            projects: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        demoUrl: { type: Type.STRING, nullable: true },
                                        repoUrl: { type: Type.STRING, nullable: true },
                                        imageUrl: { type: Type.STRING, nullable: true }
                                    },
                                    required: ['title', 'description', 'tags']
                                }
                            },
                            contact: {
                                type: Type.OBJECT,
                                properties: {
                                    email: { type: Type.STRING, nullable: true },
                                    github: { type: Type.STRING, nullable: true },
                                    linkedin: { type: Type.STRING, nullable: true },
                                    twitter: { type: Type.STRING, nullable: true },
                                    instagram: { type: Type.STRING, nullable: true },
                                    dribbble: { type: Type.STRING, nullable: true }
                                }
                            }
                        },
                        required: ['theme', 'personalInfo', 'projects', 'contact']
                    }
                },
                required: ['chatResponse']
            }
        }
      });

      const json = JSON.parse(response.text || "{}");
      if (json.chatResponse) {
          setMessages(prev => [...prev, { role: 'model', text: json.chatResponse }]);
      }
      if (json.portfolio) {
          setPortfolioData(json.portfolio);
      }

    } catch (e: any) {
        console.error(e);
        setError("Failed to generate response. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const chatTheme = getChatTheme(portfolioData?.theme || 'minimal-light');

  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans overflow-hidden">
      <div className={`w-full lg:w-[420px] flex flex-col border-r border-gray-200 h-full shadow-2xl z-20 transition-colors duration-500 ${chatTheme.bg}`}>
         <div className={`p-5 border-b flex items-center justify-between backdrop-blur-md z-10 ${chatTheme.headerBg}`}>
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                  <Bot size={24} className="text-white" />
               </div>
               <div>
                  <h1 className={`font-bold text-lg ${chatTheme.text}`}>Portfolio AI</h1>
                  <div className="flex items-center gap-1.5 opacity-60">
                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                     <span className={`text-xs font-medium ${chatTheme.text}`}>Online</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth">
            {messages.map((msg, i) => (
               <ChatMessage key={i} message={msg} chatTheme={chatTheme} />
            ))}
            {loading && (
               <div className="flex w-full mb-6 justify-start animate-pulse">
                  <div className="flex flex-row items-end gap-3">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${chatTheme.avatarBot}`}>
                        <Zap size={14} className="text-white" fill="currentColor" />
                     </div>
                     <div className={`px-5 py-4 ${chatTheme.botBubble} rounded-2xl rounded-tl-sm flex gap-1 items-center`}>
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]"></span>
                     </div>
                  </div>
               </div>
            )}
            {error && (
               <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 flex gap-2 items-center">
                  <Zap size={16} /> {error}
               </div>
            )}
            <div ref={messagesEndRef} />
         </div>

         <div className={`p-5 border-t ${chatTheme.bg} border-opacity-50`}>
            <div className={`flex items-center gap-2 p-1.5 pr-2 rounded-[24px] bg-white border shadow-sm transition-all duration-300 ring-2 ring-transparent ${chatTheme.inputRing}`}>
               <input 
                 type="text" 
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                 placeholder="Describe your portfolio..." 
                 className="flex-1 px-4 py-3 bg-transparent outline-none text-gray-800 placeholder-gray-400 min-w-0"
                 disabled={loading}
               />
               <button 
                 onClick={handleSendMessage}
                 disabled={loading || !inputText.trim()}
                 className={`p-3 rounded-full text-white shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 ${chatTheme.sendButton}`}
               >
                  {loading ? <RefreshCcw size={20} className="animate-spin" /> : <ArrowUpRight size={20} />}
               </button>
            </div>
         </div>
      </div>

      <div className="flex-1 h-full overflow-hidden bg-gray-50 relative hidden lg:block">
         <PortfolioRenderer data={portfolioData} />
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('app')!);
root.render(<App />);