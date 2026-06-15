import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Flame, Award, CheckCircle, HelpCircle, Trophy, LogOut, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';

// Safely bind the environment variable injected during the Render build phase
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function ProfilePage() {
  const { status, user, signOut } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookmarks'); 

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login');
    }
  }, [status, navigate]);

  const loadProfile = () => {
    if (status !== 'authenticated') return;
    setLoading(true);

    // Concat the environment variable and explicitly pass credential tokens over CORS cross-origins
    fetch(`${API_BASE_URL}/api/user/profile`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load profile');
        return res.json();
      })
      .then((data) => {
        setProfileData(data);
      })
      .catch((err) => {
        console.error('Profile fetch error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProfile();
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-3">Syncing Profile Details...</span>
      </div>
    );
  }

  const { user: userData, quizAttempts = [], revisionStats = { pending: 0, completed: 0 } } = profileData || {};

  const badgeDefinitions = [
    { title: "First Scholar (100 XP)", desc: "Crossed 100 total XP points", icon: Trophy, unlockedColor: "text-brand-primary border-brand-primary/20 bg-brand-primary/5" },
    { title: "Syllabus Guru (500 XP)", desc: "Crossed 500 total XP points", icon: Award, unlockedColor: "text-brand-secondary border-brand-secondary/20 bg-brand-secondary/5" },
    { title: "Unstoppable (3-Day Streak)", desc: "Logged a 3-day active streak", icon: Flame, unlockedColor: "text-brand-warning border-brand-warning/20 bg-brand-warning/5" },
    { title: "Consistency Emperor (7-Day Streak)", desc: "Logged a 7-day active streak", icon: Sparkles, unlockedColor: "text-pink-400 border-pink-400/20 bg-pink-400/5" }
  ];

  return (
    <div className="w-full max-w-xl mx-auto px-4 lg:px-0 py-6 flex-1 flex flex-col gap-6">
      
      <section aria-label="User Info" className="w-full p-6 rounded-3xl bg-surface-card border border-white/5 neo-card flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left justify-between mt-4 lg:mt-0">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-primary/20 bg-surface-secondary flex items-center justify-center shrink-0">
            {userData?.image ? (
              <img src={userData.image} alt={userData.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-gray-500" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white font-display leading-tight">{userData?.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{userData?.email}</p>
            <div className="flex gap-2 mt-3 flex-wrap justify-center sm:justify-start">
              <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-surface-secondary border border-white/5 text-gray-400">
                {userData?.examPreference} Mode
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-surface-secondary border border-white/5 text-gray-400">
                {userData?.prepLevel} level
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="px-4 py-2.5 rounded-xl border border-brand-danger/25 text-brand-danger hover:bg-brand-danger/5 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Log Out
        </button>
      </section>

      <section aria-label="Stats row" className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-surface-card border border-white/5 neo-card text-center flex flex-col justify-center">
          <Flame className="w-6 h-6 text-brand-warning mx-auto mb-1.5 fill-brand-warning/10" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Streak</span>
          <span className="text-xl font-black text-gray-200 mt-1 font-mono">{userData?.currentStreak || 0} Days</span>
        </div>

        <div className="p-4 rounded-2xl bg-surface-card border border-white/5 neo-card text-center flex flex-col justify-center">
          <CheckCircle className="w-6 h-6 text-brand-success mx-auto mb-1.5" />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Revisions Done</span>
          <span className="text-xl font-black text-gray-200 mt-1 font-mono">{revisionStats?.completed || 0} cards</span>
        </div>
      </section>

      <section aria-label="Badges wall" className="space-y-3">
        <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider block px-1">Achievement Wall</span>
        <div className="grid grid-cols-2 gap-3">
          {badgeDefinitions.map((def, idx) => {
            const isUnlocked = userData?.badges?.includes(def.title);
            const BadgeIcon = def.icon;

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                  isUnlocked
                    ? def.unlockedColor + ' opacity-100 shadow-sm'
                    : 'border-white/5 bg-surface-card/40 opacity-40'
                }`}
              >
                <span className={`p-2 rounded-xl shrink-0 ${isUnlocked ? 'bg-white/5' : 'bg-white/5'}`}>
                  <BadgeIcon className="w-5 h-5" />
                </span>
                <div>
                  <h5 className="text-xs font-bold text-gray-200 leading-tight">{def.title.split(' (')[0]}</h5>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal">{def.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-label="Activity listings">
        <div className="flex p-1 bg-surface-secondary rounded-2xl border border-white/5 neo-card mb-4">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === 'bookmarks' ? 'bg-brand-primary text-white shadow shadow-brand-primary/20' : 'text-gray-500'
            }`}
          >
            Bookmarks ({userData?.bookmarks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === 'quizzes' ? 'bg-brand-primary text-white shadow shadow-brand-primary/20' : 'text-gray-500'
            }`}
          >
            Quiz History ({quizAttempts.length})
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'bookmarks' ? (
            <motion.div
              key="bookmarks"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              {userData?.bookmarks?.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 border border-dashed border-white/5 rounded-2xl bg-surface-card/25">
                  No bookmarked articles. Save articles from the dashboard feed to review here.
                </div>
              ) : (
                userData?.bookmarks?.map((art) => (
                  <div
                    key={art._id}
                    onClick={() => navigate(`/article/${art._id}`)}
                    className="p-4 rounded-xl bg-surface-card border border-white/5 hover:border-white/10 transition-all cursor-pointer neo-card flex justify-between items-center"
                  >
                    <div className="flex-1 pr-4">
                      <span className="text-[8px] uppercase font-bold text-gray-500 tracking-wider block mb-1">
                        {art.source}
                      </span>
                      <h4 className="text-xs font-bold text-gray-200 line-clamp-1 font-display">
                        {art.title}
                      </h4>
                    </div>
                    <span className="text-[9px] text-gray-500 shrink-0 font-semibold uppercase">
                      {new Date(art.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="quizzes"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              {quizAttempts.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 border border-dashed border-white/5 rounded-2xl bg-surface-card/25">
                  No completed quiz attempts. Go to the Quiz section to test your current affairs knowledge!
                </div>
              ) : (
                quizAttempts.map((attempt) => (
                  <div
                    key={attempt._id}
                    className="p-4 rounded-xl bg-surface-card border border-white/5 neo-card flex justify-between items-center text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-surface-secondary border border-white/5 flex items-center justify-center text-brand-primary shrink-0">
                        <HelpCircle className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="font-extrabold text-gray-200 block">
                          Score: {attempt.score} / {attempt.totalQuestions}
                        </span>
                        <span className="text-[9px] text-gray-500 font-semibold block mt-0.5">
                          Duration: {attempt.completionTime}s
                        </span>
                      </div>
                    </div>

                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                      {new Date(attempt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
