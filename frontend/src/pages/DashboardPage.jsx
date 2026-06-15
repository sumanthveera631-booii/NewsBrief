import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RotateCcw, AlertCircle, Newspaper } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import NewsCard from '../components/NewsCard';

export default function DashboardPage() {
  const { status, user, update } = useAuth();
  const navigate = useNavigate();
  
  const { examPreference, setExamPreference, setUserProfile, setBookmarks } = useAppStore();

  const [articles, setArticles] = useState([]);
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
    }
  }, [status, navigate]);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      setUserProfile(user);
      setBookmarks(user.bookmarks || []);
    }
  }, [status, user, setUserProfile, setBookmarks]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    if (dateFilter === 'previous' && !selectedDate) {
      setArticles([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const { signal } = controller;

    const params = {
      exam: examPreference || 'UPSC',
      search: searchQuery
    };

    const getISTDateStrings = () => {
      const now = new Date();
      // Shift local time to match target IST execution bounds
      const istOffset = 5.5 * 60 * 60 * 1000; 
      const todayIST = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + istOffset);
      
      const yesterdayIST = new Date(todayIST);
      yesterdayIST.setDate(todayIST.getDate() - 1);

      const format = (dateObj) => dateObj.toISOString().split('T')[0];
      
      return {
        today: format(todayIST),
        yesterday: format(yesterdayIST)
      };
    };

    const dates = getISTDateStrings();

    if (dateFilter === 'today') {
      params.date = dates.today;
    } else if (dateFilter === 'yesterday') {
      params.date = dates.yesterday;
    } else if (dateFilter === 'previous') {
      if (selectedDate) {
        params.date = selectedDate;
      }
    }

    const queryParams = new URLSearchParams(params);

    fetch(`/api/articles?${queryParams.toString()}`, { signal, credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch articles');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setArticles(data.articles || []);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && isMounted) {
          setError('Could not load briefings. Check your internet connection.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [status, examPreference, dateFilter, selectedDate, searchQuery]);

  const handleExamChange = async (pref) => {
    setExamPreference(pref);
    try {
      await fetch('/api/user/preference', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examPreference: pref }),
      });
      await update();
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  };

  useEffect(() => {
    if (examPreference) {
      const body = document.body;
      body.classList.remove('theme-upsc', 'theme-banking', 'theme-ssc');
      body.classList.add(`theme-${examPreference.toLowerCase()}`);
    }
  }, [examPreference]);

  if (status === 'loading') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-3">Syncing...</span>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="w-full flex flex-col gap-6 px-4 lg:px-0 mt-4 lg:mt-0">
      <section aria-label="Exam Selection Switcher">
        <div className="flex p-1 bg-surface-secondary rounded-2xl border border-white/5 neo-card">
          {[
            { id: 'UPSC', label: 'UPSC', accentClass: 'theme-upsc' },
            { id: 'BANKING', label: 'Banking', accentClass: 'theme-banking' },
            { id: 'SSC', label: 'SSC CGL', accentClass: 'theme-ssc' }
          ].map((tab) => {
            const isActive = examPreference === tab.id;
            const bgActiveColor = 
              tab.id === 'UPSC' 
                ? 'bg-brand-primary/10 border-brand-primary/25 text-brand-primary' 
                : tab.id === 'BANKING' 
                ? 'bg-brand-success/10 border-brand-success/25 text-brand-success' 
                : 'bg-brand-warning/10 border-brand-warning/25 text-brand-warning';

            return (
              <button
                key={tab.id}
                onClick={() => handleExamChange(tab.id)}
                className={`flex-1 py-3.5 text-xs font-extrabold uppercase rounded-xl transition-all duration-300 relative border cursor-pointer ${
                  isActive 
                    ? `${bgActiveColor} shadow-inner font-extrabold` 
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Date Filters">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'previous', label: 'Previous News' }
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setDateFilter(d.id);
                if (d.id !== 'previous') setSelectedDate('');
              }}
              className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                dateFilter === d.id
                  ? 'bg-white/10 text-white border-white/10 shadow-sm'
                  : 'bg-surface-secondary text-gray-400 border-white/5 hover:bg-surface-elevated'
              }`}
            >
              {d.label}
            </button>
          ))}
          {dateFilter === 'previous' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="ml-3 px-4 py-2 rounded-full bg-surface-secondary border border-white/10 text-sm text-gray-100 focus:outline-none focus:border-brand-primary/40"
            />
          )}
        </div>
      </section>

      <section aria-label="Search briefs">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search news, topics, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-4 rounded-2xl bg-surface-card border border-white/5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-primary/40 focus:ring-1 focus:ring-brand-primary/40 transition-all shadow-inner neo-card"
          />
        </div>
      </section>

      <section aria-label="Current Affairs Feed" className="flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full p-5 rounded-2xl bg-surface-card border border-white/5 animate-pulse flex flex-col gap-4 min-h-[200px]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-surface-elevated" />
                  <div className="h-3 w-16 bg-surface-elevated rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-4 w-12 bg-surface-elevated rounded-md" />
                  <div className="h-4 w-12 bg-surface-elevated rounded-md" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-11/12 bg-surface-elevated rounded" />
                <div className="h-4 w-8/12 bg-surface-elevated rounded" />
              </div>
              <div className="pt-3 border-t border-white/5 flex justify-between items-center mt-auto">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-surface-elevated" />
                  <div className="w-8 h-8 rounded-lg bg-surface-elevated" />
                </div>
                <div className="w-20 h-6 rounded-lg bg-surface-elevated" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="p-8 rounded-2xl bg-surface-card border border-brand-danger/10 text-center neo-card flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-brand-danger" />
            <p className="text-sm font-semibold text-gray-300">{error}</p>
            <button
              onClick={() => setDateFilter(dateFilter)}
              className="mt-2 px-4 py-2 text-xs font-bold rounded-lg border border-brand-danger/20 hover:bg-brand-danger/5 text-brand-danger transition-all cursor-pointer"
            >
              Retry Request
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-10 rounded-2xl bg-surface-card border border-white/5 text-center neo-card flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center text-gray-500 border border-white/5">
              <Newspaper className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-300 font-display">No Briefings Available</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
                {dateFilter === 'previous' && !selectedDate
                  ? 'Choose a previous date above to load archived briefings in IST.'
                  : searchQuery
                    ? `No matches found for "${searchQuery}" under ${examPreference}.`
                    : `We are preparing the latest ${examPreference} briefings. Check back shortly!`}
              </p>
            </div>
            {(searchQuery || (dateFilter === 'previous' && !selectedDate)) && (
              <button
                onClick={() => {
                  if (searchQuery) setSearchQuery('');
                  if (dateFilter === 'previous') setSelectedDate('');
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {articles.map((article) => (
              <motion.div
                key={article._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                layout
              >
                <NewsCard article={article} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </section>
    </div>
  );
}
