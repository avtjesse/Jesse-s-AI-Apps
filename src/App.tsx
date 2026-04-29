import { useState, FormEvent } from 'react';
import { AppItem, Category, IconName } from './types';
import { CATEGORIES, ICONS, INITIAL_APPS, TRANSLATIONS, APP_TEMPLATES } from './constants';
import { IconComponent } from './components/IconComponent';
import { Plus, X, Globe, Shield, ShieldAlert, Edit2, Trash2, ExternalLink, Copy, Sparkles, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

export default function App() {
  const [apps, setApps] = useState<AppItem[]>(INITIAL_APPS);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [viewingApp, setViewingApp] = useState<AppItem | null>(null);
  
  const [smartFetchUrl, setSmartFetchUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const t = TRANSLATIONS[language];

  const filteredApps = apps.filter(app => {
    const matchesCategory = selectedCategory === '全部' || app.category === selectedCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveApp = (app: AppItem) => {
    if (apps.find(a => a.id === app.id)) {
      setApps(apps.map(a => a.id === app.id ? app : a));
    } else {
      setApps([...apps, { ...app, id: Date.now().toString() }]);
    }
    setIsEditModalOpen(false);
    setEditingApp(null);
  };

  const handleDeleteApp = (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      setApps(apps.filter(a => a.id !== id));
    }
  };

  const handleCloneApp = (app: AppItem) => {
    const clonedApp = {
      ...app,
      id: Date.now().toString(),
      name: `${app.name} (${t.cloneApp})`
    };
    setApps([...apps, clonedApp]);
  };

  const openEditModal = (app?: AppItem) => {
    if (app) {
      setEditingApp(app);
    } else {
      setEditingApp({
        id: '',
        name: '',
        description: '',
        link: '',
        category: '其他',
        icon: 'Heart',
        aspectRatio: '16:9',
      });
    }
    setIsEditModalOpen(true);
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setIsPasswordModalOpen(true);
      setPasswordInput('');
      setPasswordError(false);
    }
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Jesse7115') {
      setIsAdmin(true);
      setIsPasswordModalOpen(false);
      setPasswordInput('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleSmartFetch = async () => {
    if (!smartFetchUrl) return;
    setIsFetching(true);
    setFetchStatus('idle');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract application metadata from this URL: ${smartFetchUrl}. 
        Return a JSON object with the following fields: 
        - name: string (the app name)
        - description: string (a short description)
        - category: string (one of: ${CATEGORIES.filter(c => c !== '全部').join(', ')})
        - icon: string (one of: ${ICONS.join(', ')})
        - aspectRatio: string (one of: 16:9, 4:3, 1:1, auto)
        
        If you cannot find specific info, make a best guess based on the content.`,
        config: {
          tools: [{ urlContext: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              icon: { type: Type.STRING },
              aspectRatio: { type: Type.STRING },
            },
            required: ["name", "description", "category", "icon", "aspectRatio"]
          }
        },
      });

      const result = JSON.parse(response.text);
      if (editingApp) {
        setEditingApp({
          ...editingApp,
          name: result.name || editingApp.name,
          description: result.description || editingApp.description,
          category: (CATEGORIES.includes(result.category as any) ? result.category : '其他') as Category,
          icon: (ICONS.includes(result.icon as any) ? result.icon : 'Heart') as IconName,
          aspectRatio: result.aspectRatio || '16:9',
          link: smartFetchUrl
        });
      }
      setFetchStatus('success');
      setSmartFetchUrl('');
    } catch (error) {
      console.error('Error fetching app info:', error);
      setFetchStatus('error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSmartSearch = async () => {
    setIsFetching(true);
    setFetchStatus('idle');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Find shared Google AI Studio application URLs (hosted on *.run.app) created by 'Jesse' or related to 'avt.jesse@gmail.com'. Return a list of URLs.",
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      // Since googleSearch returns text, we just show it or parse it.
      // For now, let's just alert the user or log it.
      alert(`Search results:\n\n${response.text}`);
    } catch (error) {
      console.error('Error searching apps:', error);
      setFetchStatus('error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setIsPasswordModalOpen(true);
      setPasswordInput('');
      setPasswordError(false);
    }
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Jesse7115') {
      setIsAdmin(true);
      setIsPasswordModalOpen(false);
      setPasswordInput('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleSmartFetch = async () => {
    if (!smartFetchUrl) return;
    setIsFetching(true);
    setFetchStatus('idle');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract application metadata from this URL: ${smartFetchUrl}. 
        Return a JSON object with the following fields: 
        - name: string (the app name)
        - description: string (a short description)
        - category: string (one of: ${CATEGORIES.filter(c => c !== '全部').join(', ')})
        - icon: string (one of: ${ICONS.join(', ')})
        - aspectRatio: string (one of: 16:9, 4:3, 1:1, auto)
        
        If you cannot find specific info, make a best guess based on the content.`,
        config: {
          tools: [{ urlContext: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              icon: { type: Type.STRING },
              aspectRatio: { type: Type.STRING },
            },
            required: ["name", "description", "category", "icon", "aspectRatio"]
          }
        },
      });

      const result = JSON.parse(response.text);
      if (editingApp) {
        setEditingApp({
          ...editingApp,
          name: result.name || editingApp.name,
          description: result.description || editingApp.description,
          category: (CATEGORIES.includes(result.category as any) ? result.category : '其他') as Category,
          icon: (ICONS.includes(result.icon as any) ? result.icon : 'Heart') as IconName,
          aspectRatio: result.aspectRatio || '16:9',
          link: smartFetchUrl
        });
      }
      setFetchStatus('success');
      setSmartFetchUrl('');
    } catch (error) {
      console.error('Error fetching app info:', error);
      setFetchStatus('error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSmartSearch = async () => {
    setIsFetching(true);
    setFetchStatus('idle');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Find shared Google AI Studio application URLs (hosted on *.run.app) created by 'Jesse' or related to 'avt.jesse@gmail.com'. Return a list of URLs.",
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      // Since googleSearch returns text, we just show it or parse it.
      // For now, let's just alert the user or log it.
      alert(`Search results:\n\n${response.text}`);
    } catch (error) {
      console.error('Error searching apps:', error);
      setFetchStatus('error');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#B23A48]/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:h-20 md:py-0 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFFBEB] to-[#B23A48]/20 flex items-center justify-center shadow-sm border border-[#B23A48]/10 shrink-0">
              <IconComponent name="Church" className="w-6 h-6 text-[#B23A48]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#4A3B32]">{t.title}</h1>
              <p className="text-xs md:text-sm text-[#4A3B32]/60 font-sans">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex-1 max-w-md w-full relative order-last md:order-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder} 
              className="w-full pl-11 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#B23A48] focus:border-transparent bg-gray-50/50 hover:bg-gray-50 transition-all text-sm shadow-inner"
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <button 
              onClick={handleAdminToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isAdmin ? 'bg-[#B23A48] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {isAdmin ? <Shield className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              <span className="hidden sm:inline">{t.adminMode}</span>
            </button>
            <button 
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{language === 'zh' ? 'EN' : '中'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Category Navigation */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-[#4A3B32] text-white shadow-md'
                    : 'bg-white text-[#4A3B32]/70 hover:bg-[#FFFBEB] hover:text-[#4A3B32] border border-transparent hover:border-[#B23A48]/20'
                }`}
              >
                {t.categories[category]}
              </button>
            ))}
          </div>
          
          {isAdmin && (
            <button
              onClick={() => openEditModal()}
              className="flex items-center gap-2 px-4 py-2 bg-[#B23A48] text-white rounded-full text-sm font-medium hover:bg-[#9A2E3A] transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              {t.addApp}
            </button>
          )}
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredApps.map(app => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={app.id}
                className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full cursor-pointer overflow-hidden"
                onClick={() => setViewingApp(app)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFFBEB] to-transparent opacity-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FDF8F5] flex items-center justify-center text-[#B23A48] shadow-inner border border-[#B23A48]/5 group-hover:bg-[#B23A48] group-hover:text-white transition-colors">
                    <IconComponent name={app.icon} className="w-6 h-6" />
                  </div>
                  
                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => handleCloneApp(app)}
                        className="p-2 text-gray-400 hover:text-[#B23A48] hover:bg-gray-100 rounded-full transition-colors"
                        title={t.cloneApp}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEditModal(app)}
                        className="p-2 text-gray-400 hover:text-[#4A3B32] hover:bg-gray-100 rounded-full transition-colors"
                        title={t.editApp}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteApp(app.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title={t.deleteApp}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-[#4A3B32] mb-2 font-serif group-hover:text-[#B23A48] transition-colors">{app.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 flex-1">{app.description}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium px-2.5 py-1 bg-gray-50 text-gray-500 rounded-md">
                    {t.categories[app.category]}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#FFFBEB] group-hover:text-[#B23A48] transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredApps.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
              <IconComponent name="Brain" className="w-16 h-16 mb-4 opacity-20" />
              <p>No applications found in this category.</p>
            </div>
          )}
        </div>
      </main>

      {/* Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#4A3B32]/40 backdrop-blur-sm"
              onClick={() => setIsPasswordModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-[#4A3B32] font-serif">
                  {t.adminPasswordPrompt}
                </h2>
                <button 
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value);
                      setPasswordError(false);
                    }}
                    autoFocus
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none transition-all ${
                      passwordError 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-[#B23A48] focus:border-[#B23A48]'
                    }`}
                    placeholder="••••••••"
                  />
                  {passwordError && (
                    <p className="mt-1 text-sm text-red-500">{t.incorrectPassword}</p>
                  )}
                </div>
                
                <div className="pt-2 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    type="submit"
                    disabled={!passwordInput}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#B23A48] rounded-lg hover:bg-[#9A2E3A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.submit}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#4A3B32]/40 backdrop-blur-sm"
              onClick={() => setIsPasswordModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-[#4A3B32] font-serif">
                  {t.adminPasswordPrompt}
                </h2>
                <button 
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value);
                      setPasswordError(false);
                    }}
                    autoFocus
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none transition-all ${
                      passwordError 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-[#B23A48] focus:border-[#B23A48]'
                    }`}
                    placeholder="••••••••"
                  />
                  {passwordError && (
                    <p className="mt-1 text-sm text-red-500">{t.incorrectPassword}</p>
                  )}
                </div>
                
                <div className="pt-2 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    type="submit"
                    disabled={!passwordInput}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#B23A48] rounded-lg hover:bg-[#9A2E3A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.submit}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#4A3B32]/40 backdrop-blur-sm"
              onClick={() => setIsEditModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-[#4A3B32] font-serif">
                  {editingApp.id ? t.editApp : t.addApp}
                </h2>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {!editingApp.id && (
                  <div className="mb-6 space-y-6">
                    {/* Smart Fetch */}
                    <div>
                      <label className="block text-sm font-medium text-[#B23A48] mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {t.smartFetch}
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="url" 
                          value={smartFetchUrl}
                          onChange={e => setSmartFetchUrl(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B23A48] focus:border-[#B23A48] outline-none transition-all text-sm"
                          placeholder="https://ais-dev-..."
                        />
                        <button
                          type="button"
                          onClick={handleSmartFetch}
                          disabled={isFetching || !smartFetchUrl}
                          className="px-4 py-2 bg-[#B23A48] text-white rounded-lg text-sm font-medium hover:bg-[#9A2E3A] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                      {smartFetchUrl.includes('aistudio.google.com') && (
                        <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 flex items-start gap-2">
                          <ShieldAlert className="w-3 h-3 mt-0.5 shrink-0" />
                          {t.urlWarning}
                        </p>
                      )}
                      {fetchStatus === 'error' && <p className="mt-1 text-xs text-red-500">{t.fetchError}</p>}
                      {fetchStatus === 'success' && <p className="mt-1 text-xs text-green-500">{t.fetchSuccess}</p>}
                      
                      <button
                        type="button"
                        onClick={handleSmartSearch}
                        disabled={isFetching}
                        className="mt-2 text-xs text-[#B23A48] hover:underline flex items-center gap-1"
                      >
                        <Search className="w-3 h-3" />
                        {t.smartSearch}
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">OR</span></div>
                    </div>

                    {/* Quick Templates */}
                    <div>
                      <label className="block text-sm font-medium text-[#B23A48] mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        {t.quickAdd}
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {APP_TEMPLATES.map((template, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditingApp({
                              ...editingApp,
                              ...template,
                              link: editingApp.link // Keep current link if any
                            })}
                            className="text-left px-3 py-2 rounded-lg bg-[#FFFBEB]/50 border border-[#B23A48]/10 hover:bg-[#FFFBEB] hover:border-[#B23A48]/30 transition-all flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#B23A48] shadow-sm border border-[#B23A48]/5">
                              <IconComponent name={template.icon as IconName} className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-[#4A3B32]">{template.name}</p>
                              <p className="text-xs text-gray-500 line-clamp-1">{template.description}</p>
                            </div>
                            <Plus className="w-4 h-4 text-[#B23A48] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">OR</span></div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.name}</label>
                  <input 
                    type="text" 
                    value={editingApp.name}
                    onChange={e => setEditingApp({...editingApp, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B23A48] focus:border-[#B23A48] outline-none transition-all"
                    placeholder="App Name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
                  <textarea 
                    value={editingApp.description}
                    onChange={e => setEditingApp({...editingApp, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B23A48] focus:border-[#B23A48] outline-none transition-all resize-none h-24"
                    placeholder="App Description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.link}</label>
                  <input 
                    type="url" 
                    value={editingApp.link}
                    onChange={e => setEditingApp({...editingApp, link: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B23A48] focus:border-[#B23A48] outline-none transition-all"
                    placeholder="https://"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.category}</label>
                    <select 
                      value={editingApp.category}
                      onChange={e => setEditingApp({...editingApp, category: e.target.value as Category})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B23A48] focus:border-[#B23A48] outline-none transition-all bg-white"
                    >
                      {CATEGORIES.filter(c => c !== '全部').map(c => (
                        <option key={c} value={c}>{t.categories[c]}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.aspectRatio}</label>
                    <select 
                      value={editingApp.aspectRatio || '16:9'}
                      onChange={e => setEditingApp({...editingApp, aspectRatio: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B23A48] focus:border-[#B23A48] outline-none transition-all bg-white"
                    >
                      <option value="16:9">16:9 (Landscape)</option>
                      <option value="4:3">4:3 (Standard)</option>
                      <option value="1:1">1:1 (Square)</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.icon}</label>
                  <div className="grid grid-cols-5 gap-2">
                    {ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setEditingApp({...editingApp, icon})}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                          editingApp.icon === icon 
                            ? 'bg-[#FFFBEB] text-[#B23A48] border-2 border-[#B23A48]' 
                            : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'
                        }`}
                        title={t.icons[icon]}
                      >
                        <IconComponent name={icon} className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={() => handleSaveApp(editingApp)}
                  disabled={!editingApp.name || !editingApp.link}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#B23A48] rounded-lg hover:bg-[#9A2E3A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.save}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Viewer Modal */}
      <AnimatePresence>
        {viewingApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#4A3B32]/80 backdrop-blur-md"
              onClick={() => setViewingApp(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full max-h-full"
              style={{ 
                aspectRatio: viewingApp.aspectRatio === 'auto' ? undefined : viewingApp.aspectRatio?.replace(':', '/'),
                maxWidth: viewingApp.aspectRatio === '16:9' ? '1200px' : viewingApp.aspectRatio === '4:3' ? '900px' : '600px',
                height: viewingApp.aspectRatio === 'auto' ? '80vh' : undefined
              }}
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FDF8F5] flex items-center justify-center text-[#B23A48]">
                    <IconComponent name={viewingApp.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#4A3B32] font-serif leading-tight">{viewingApp.name}</h3>
                    <p className="text-xs text-gray-500">{viewingApp.link}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={viewingApp.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-[#B23A48] hover:bg-[#FFFBEB] rounded-full transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <button 
                    onClick={() => setViewingApp(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-gray-50 relative">
                {/* In a real scenario, this would be an iframe. For preview, we show a placeholder if it's example.com */}
                {viewingApp.link.includes('example.com') ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <IconComponent name={viewingApp.icon} className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium text-gray-500 mb-2">App Preview Placeholder</p>
                    <p className="text-sm">In a real environment, this would load an iframe for <br/><a href={viewingApp.link} className="text-[#B23A48] hover:underline">{viewingApp.link}</a></p>
                  </div>
                ) : viewingApp.link.includes('aistudio.google.com') ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 border border-amber-100">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-[#4A3B32] mb-2 font-serif">{t.iframeBlocked}</h4>
                    <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">{t.urlWarning}</p>
                    <a 
                      href={viewingApp.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-[#B23A48] text-white rounded-full text-sm font-medium hover:bg-[#9A2E3A] transition-all shadow-md hover:shadow-lg"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t.openExternal}
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    <iframe 
                      src={viewingApp.link} 
                      className="w-full h-full border-0"
                      title={viewingApp.name}
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
                    />
                    {/* Floating fallback button in case it still fails to load visually */}
                    <div className="absolute bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity">
                      <a 
                        href={viewingApp.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur shadow-sm border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:text-[#B23A48]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {t.openExternal}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
