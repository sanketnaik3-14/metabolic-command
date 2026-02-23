import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Activity, Flame, Clock, Dumbbell, Utensils, 
  Scale, Timer, History, Save, HeartPulse, ChevronRight, 
  CheckCircle2, Pill, BookOpen, Coffee, Moon
} from 'lucide-react';

// ==========================================
// 1. SECURE FIREBASE INITIALIZATION
// ==========================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "metabolic-command-v2";

// ==========================================
// 2. ENDOCRINE PROTOCOL DATA
// ==========================================
const WORKOUT_CYCLE = {
  1: { type: 'LIFT', title: 'Upper Body (Hypertrophy)', focus: 'Chest, Back, Shoulders, Arms', rules: 'Strict 2-minute rests. 2 RIR.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  2: { type: 'CARDIO', title: 'The Flush (Zone 2)', focus: 'Aerobic Base, Cortisol Flush', rules: '45-55 mins. HR: 138-150 bpm.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  3: { type: 'LIFT', title: 'Lower Body & Core', focus: 'Quads, Hams, Core Matrix', rules: 'Strict 2-minute rests. 3-1-1 Tempo.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  4: { type: 'CARDIO', title: 'Engine Builder (4x4)', focus: 'VO2 Max, Mitochondrial Density', rules: '4x4 Intervals. Push: 167-178. Rest: <138.', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  5: { type: 'LIFT', title: 'Upper Body (Hypertrophy)', focus: 'Chest, Back, Shoulders, Arms', rules: 'Strict 2-minute rests. 2 RIR.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  6: { type: 'CARDIO', title: 'The Flush (Zone 2)', focus: 'Aerobic Base, Cortisol Flush', rules: '45-55 mins. HR: 138-150 bpm.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  7: { type: 'LIFT', title: 'Lower Body & Core', focus: 'Quads, Hams, Core Matrix', rules: 'Strict 2-minute rests. 3-1-1 Tempo.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  8: { type: 'REST', title: 'Active Rest + Refeed', focus: 'Thyroid Rescue, Glycogen Reload', rules: '+150g Complex Carbs today. Zero lifting.', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
};

const EXERCISES = {
  'Upper Body (Hypertrophy)': [
    { name: 'Flat Bench Press', sets: 4, reps: '6-8' },
    { name: 'Lat Pulldowns', sets: 4, reps: '8-10' },
    { name: 'Overhead Shoulder Press', sets: 3, reps: '8-10' },
    { name: 'Seated Cable Rows', sets: 3, reps: '10-12' },
    { name: 'Bicep Curls', sets: 3, reps: '12-15' },
    { name: 'Tricep Pushdowns', sets: 3, reps: '12-15' }
  ],
  'Lower Body & Core': [
    { name: 'Goblet Squats (3-1-1 Tempo)', sets: 4, reps: '8-10' },
    { name: 'Romanian Deadlifts', sets: 4, reps: '10-12' },
    { name: 'Leg Extensions', sets: 3, reps: '12-15' },
    { name: 'Calf Raises', sets: 4, reps: '15-20' },
    { name: 'Cable Crunches', sets: 3, reps: '12-15' },
    { name: 'Hanging Leg Raises', sets: 3, reps: '10-15' },
    { name: 'RKC Plank (Max Tension)', sets: 3, reps: '30-45s' }
  ]
};

// ==========================================
// 3. UI COMPONENTS
// ==========================================
const RestTimer = () => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const checkTimer = () => {
      const end = localStorage.getItem('mc_restEndTime');
      if (end) {
        const remaining = Math.floor((parseInt(end) - Date.now()) / 1000);
        if (remaining > 0) {
          setTimeLeft(remaining);
        } else {
          setTimeLeft(0);
          localStorage.removeItem('mc_restEndTime');
        }
      }
    };
    
    checkTimer(); 
    const intervalId = setInterval(checkTimer, 1000); 
    return () => clearInterval(intervalId);
  }, []);

  const startTimer = () => {
    const endTime = Date.now() + 120 * 1000;
    localStorage.setItem('mc_restEndTime', endTime.toString());
    setTimeLeft(120);
  };

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  return (
    <button 
      onClick={startTimer}
      className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm ${timeLeft > 0 ? 'bg-amber-500 text-gray-900 border border-amber-400 animate-pulse' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'}`}
    >
      <Timer size={14} />
      {timeLeft > 0 ? formatTime(timeLeft) : 'START 2 MIN REST'}
    </button>
  );
};

// ==========================================
// 4. MAIN APPLICATION
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('mc_activeTab') || 'dashboard');
  
  // Database State
  const [cycleDay, setCycleDay] = useState(1);
  const [workoutLogs, setWorkoutLogs] = useState({});
  const [matrixLogs, setMatrixLogs] = useState([]);
  
  // Local Form State
  const [morningRHR, setMorningRHR] = useState(() => localStorage.getItem('mc_morningRHR') || '');
  const [exerciseInputs, setExerciseInputs] = useState(() => {
    const saved = localStorage.getItem('mc_exerciseInputs');
    return saved ? JSON.parse(saved) : {};
  });
  const [newLog, setNewLog] = useState({ date: new Date().toISOString().split('T')[0], weight: '', waist: '' });

  useEffect(() => { localStorage.setItem('mc_activeTab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('mc_morningRHR', morningRHR); }, [morningRHR]);
  useEffect(() => { localStorage.setItem('mc_exerciseInputs', JSON.stringify(exerciseInputs)); }, [exerciseInputs]);

  // ----------------------------------------
  // FIREBASE AUTH & REALTIME SYNC
  // ----------------------------------------
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth Error:", e);
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'state');
    
    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.cycleDay) setCycleDay(data.cycleDay);
        if (data.workoutLogs) setWorkoutLogs(data.workoutLogs);
        if (data.matrixLogs) setMatrixLogs(data.matrixLogs);
      }
    }, (error) => console.error("Firestore Listen Error:", error));

    return () => unsub();
  }, [user]);

  // ----------------------------------------
  // DATA SAVING HELPERS
  // ----------------------------------------
  const saveToDb = async (payload) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'state');
      await setDoc(userDocRef, payload, { merge: true });
    } catch (e) { console.error("Error saving data:", e); }
  };

  const handleExerciseInput = (exName, setIndex, field, value) => {
    const key = `${exName}-${setIndex}`;
    setExerciseInputs(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const logSetToDb = (exName, setIndex, weight, reps) => {
    if (!weight || !reps) return;
    const today = new Date().toISOString().split('T')[0];
    
    const exHistory = workoutLogs[exName] || {};
    const todaySets = [...(exHistory[today] || [])];
    todaySets[setIndex] = { weight, reps };
    
    const newLogs = {
      ...workoutLogs,
      [exName]: {
        ...exHistory,
        [today]: todaySets
      }
    };
    
    saveToDb({ workoutLogs: newLogs });
    setExerciseInputs(prev => ({...prev, [`${exName}-${setIndex}`]: {weight:'', reps:''}}));
  };

  const saveMatrixLog = () => {
    if (!newLog.weight) return;
    const updatedLogs = [...matrixLogs, newLog].sort((a,b) => new Date(a.date) - new Date(b.date));
    saveToDb({ matrixLogs: updatedLogs });
    setNewLog({ ...newLog, weight: '', waist: '' });
  };

  const getRHRStatus = () => {
    if (!morningRHR) return null;
    const rhr = parseInt(morningRHR);
    if (rhr <= 73) return { color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'GREEN: CNS Recovered. Proceed normally.' };
    if (rhr <= 77) return { color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'YELLOW: Mild Fatigue. Drop weights by 10%. Stop 3 reps short of failure.' };
    return { color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10', text: 'RED: System Overload. ABORT WORKOUT. Do 30m outdoor walk only.' };
  };

  // ----------------------------------------
  // VIEWS
  // ----------------------------------------
  const renderDashboard = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4"><HeartPulse className="text-red-400"/> Morning Readiness (RHR)</h3>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 whitespace-nowrap">Baseline: 70 bpm</span>
            <input 
              type="number" 
              placeholder="RHR (bpm)" 
              value={morningRHR}
              onChange={(e) => setMorningRHR(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 w-32 min-w-[120px] text-white outline-none focus:border-cyan-500"
            />
          </div>
          {getRHRStatus() && (
            <div className={`flex-1 p-3 rounded-xl border ${getRHRStatus().bg} ${getRHRStatus().border} ${getRHRStatus().color} text-sm font-bold`}>
              {getRHRStatus().text}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
        <h3 className="text-xl font-bold mb-4">The 8-Day Engine Cycle</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(WORKOUT_CYCLE).map(([day, data]) => {
            const isActive = parseInt(day) === cycleDay;
            return (
              <div 
                key={day}
                onClick={() => saveToDb({ cycleDay: parseInt(day) })}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${isActive ? `${data.bg} ${data.border} shadow-[0_0_15px_rgba(0,0,0,0.3)] scale-[1.02]` : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-gray-500">DAY {day}</span>
                  {isActive && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>}
                </div>
                <div className={`font-bold text-sm leading-tight ${isActive ? 'text-white' : 'text-gray-400'}`}>{data.title}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderProtocol = () => {
    const todayPlan = WORKOUT_CYCLE[cycleDay];
    const today = new Date().toISOString().split('T')[0];
    
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className={`p-6 rounded-2xl border ${todayPlan.bg} ${todayPlan.border} shadow-xl relative overflow-hidden`}>
          <div className="relative z-10">
            <h2 className={`text-3xl font-bold ${todayPlan.color} mb-2`}>Day {cycleDay}: {todayPlan.title}</h2>
            <p className="text-gray-300 font-medium mb-4">{todayPlan.rules}</p>
            {todayPlan.type === 'LIFT' && <RestTimer />}
          </div>
        </div>

        {todayPlan.type === 'LIFT' && (
          <div className="space-y-6">
            {EXERCISES[todayPlan.title]?.map((ex, idx) => {
              const exHistory = workoutLogs[ex.name] || {};
              const todaySets = exHistory[today] || [];
              
              const pastDates = Object.keys(exHistory).filter(d => d !== today).sort((a,b) => new Date(b) - new Date(a));
              let bestPrevSet = null;
              if (pastDates.length > 0) {
                const lastDate = pastDates[0];
                bestPrevSet = exHistory[lastDate].reduce((best, current) => Number(current.weight) > Number(best.weight) ? current : best, exHistory[lastDate][0]);
                bestPrevSet.date = lastDate;
              }

              return (
              <div key={idx} className="bg-gray-800/40 p-5 rounded-2xl border border-gray-700/50 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-gray-700/50 pb-4">
                  <div>
                    <h4 className="font-bold text-xl text-gray-100">{ex.name}</h4>
                    <div className="text-sm text-gray-400 mt-1 font-medium tracking-wide">
                      Target: {ex.sets} Sets × {ex.reps} Reps
                    </div>
                  </div>
                  {bestPrevSet && (
                    <div className="bg-gray-900 px-4 py-2 rounded-lg border border-gray-800 text-right">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1 justify-end"><History size={12}/> Last Session Best</div>
                      <div className="text-sm text-gray-300 font-mono">
                        <span className="text-cyan-400 font-bold text-base">{bestPrevSet.weight} kg</span> × {bestPrevSet.reps} reps
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {[...Array(ex.sets)].map((_, setIdx) => {
                    const savedSet = todaySets[setIdx];
                    const currentInput = exerciseInputs[`${ex.name}-${setIdx}`] || { weight: '', reps: '' };
                    
                    return (
                      <div key={setIdx} className={`flex items-center gap-3 p-2 rounded-lg border ${savedSet ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-gray-900 border-gray-800'}`}>
                        <div className="w-14 text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Set {setIdx + 1}</div>
                        
                        {savedSet ? (
                          <>
                            <div className="flex-1 flex gap-4 text-sm font-mono text-gray-200">
                              <span className="bg-gray-800 px-3 py-1.5 rounded">{savedSet.weight} kg</span>
                              <span className="bg-gray-800 px-3 py-1.5 rounded">{savedSet.reps} reps</span>
                            </div>
                            <CheckCircle2 className="text-emerald-500 mr-2" size={20} />
                          </>
                        ) : (
                          <>
                            <input type="number" placeholder="Kg" value={currentInput.weight} onChange={e=>handleExerciseInput(ex.name, setIdx, 'weight', e.target.value)} className="w-20 sm:w-24 bg-gray-800 text-sm px-3 py-1.5 rounded border border-gray-700 text-white outline-none focus:border-blue-500" />
                            <input type="number" placeholder="Reps" value={currentInput.reps} onChange={e=>handleExerciseInput(ex.name, setIdx, 'reps', e.target.value)} className="w-20 sm:w-24 bg-gray-800 text-sm px-3 py-1.5 rounded border border-gray-700 text-white outline-none focus:border-blue-500" />
                            <button onClick={() => logSetToDb(ex.name, setIdx, currentInput.weight, currentInput.reps)} className="ml-auto bg-blue-600/20 text-blue-400 p-1.5 sm:px-3 sm:py-1.5 rounded hover:bg-blue-600/40 border border-blue-500/30 font-bold text-xs sm:text-sm transition-colors">SAVE</button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )})}
          </div>
        )}

        {todayPlan.type === 'CARDIO' && (
          <div className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 shadow-xl space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2"><HeartPulse className={todayPlan.color}/> Cardiovascular Protocol</h3>
            {cycleDay === 2 || cycleDay === 6 ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-900 p-6 rounded-xl border border-emerald-500/20">
                  <div className="text-xs font-bold text-emerald-500 mb-2 tracking-widest">MAGENE TARGET ZONE</div>
                  <div className="text-5xl font-mono font-bold text-white mb-2">138 - 150 <span className="text-xl text-gray-500 font-sans">bpm</span></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-900 p-6 rounded-xl border border-orange-500/20">
                  <div className="text-xs font-bold text-orange-500 mb-2 tracking-widest">THE PUSH (4 MINUTES)</div>
                  <div className="text-4xl font-mono font-bold text-white">167 - 178 <span className="text-xl text-gray-500 font-sans">bpm</span></div>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl border border-blue-500/20">
                  <div className="text-xs font-bold text-blue-500 mb-2 tracking-widest">ACTIVE RECOVERY (3 MINUTES)</div>
                  <div className="text-4xl font-mono font-bold text-white">&lt; 138 <span className="text-xl text-gray-500 font-sans">bpm</span></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFuel = () => (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-2xl font-bold flex items-center gap-2"><Utensils className="text-amber-400"/> Diet & Supplement Vault</h3>
        {cycleDay === 8 ? (
          <span className="bg-purple-900/40 px-4 py-1.5 text-xs font-bold text-purple-300 border border-purple-500/50 rounded-full tracking-wider animate-pulse">DAY 8: HIGH CARB REFEED ACTIVE</span>
        ) : (
          <span className="bg-gray-900 px-4 py-1.5 text-xs font-bold text-gray-300 border border-gray-700 rounded-full tracking-wider">DEFICIT: ~1,650 KCAL | 160g PRO</span>
        )}
      </div>

      {/* Medication Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-2xl border border-gray-700/50 shadow-md">
          <h4 className="font-bold text-cyan-400 mb-4 flex items-center gap-2"><Coffee size={18}/> Morning Meds & Prep</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-gray-200 bg-gray-900/50 p-2 rounded-lg border border-gray-800">
              <Pill className="text-cyan-500 shrink-0 mt-0.5" size={16}/> 
              <div><strong className="text-white block">Prescriptions:</strong> Lamotrigine, Escitalopram, Homochek</div>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-200 bg-gray-900/50 p-2 rounded-lg border border-gray-800">
              <Pill className="text-cyan-500 shrink-0 mt-0.5" size={16}/> 
              <div><strong className="text-white block">Supplements:</strong> Multivitamin, Fish Oil, Collagen (4g Carbs)</div>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-200 bg-gray-900/50 p-2 rounded-lg border border-gray-800">
              <Activity className="text-amber-500 shrink-0 mt-0.5" size={16}/> 
              <div><strong className="text-white block">Pre-Workout:</strong> 1 Banana + Creatine</div>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-2xl border border-gray-700/50 shadow-md">
          <h4 className="font-bold text-indigo-400 mb-4 flex items-center gap-2"><Moon size={18}/> Night Meds</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-gray-200 bg-gray-900/50 p-2 rounded-lg border border-gray-800">
              <Pill className="text-indigo-500 shrink-0 mt-0.5" size={16}/> 
              <div><strong className="text-white block">Prescriptions:</strong> Rosuvastatin, Fenofibrate</div>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-200 bg-gray-900/50 p-2 rounded-lg border border-gray-800">
              <Pill className="text-indigo-500 shrink-0 mt-0.5" size={16}/> 
              <div><strong className="text-white block">Supplements:</strong> Magnesium, Probiotics</div>
            </li>
          </ul>
        </div>
      </div>

      {/* Meals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
          <h4 className="font-bold text-white mb-2 pb-2 border-b border-gray-800">Meal 1: Breakfast</h4>
          <div className="text-sm text-gray-300 space-y-2 mt-3">
            <div className="flex justify-between"><span>Whole Eggs</span><span className="font-mono text-cyan-400 font-bold">4</span></div>
            <div className="flex justify-between"><span>French Beans</span><span className="font-mono text-cyan-400 font-bold">1 Cup</span></div>
            <div className="text-xs text-gray-500 mt-2 italic">Sautéed. Paired with morning collagen.</div>
          </div>
        </div>

        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
          <h4 className="font-bold text-white mb-2 pb-2 border-b border-gray-800">Meal 2: Lunch</h4>
          <div className="text-sm text-gray-300 space-y-2 mt-3">
            <div className="flex justify-between"><span>Chicken (Sautéed)</span><span className="font-mono text-emerald-400 font-bold">~185g</span></div>
            <div className="flex justify-between">
              <span>Daawat Brown Rice</span>
              <span className="font-mono text-emerald-400 font-bold">{cycleDay === 8 ? '2 Boxes' : '1 Box'}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2 italic">Chicken sautéed with salt/pepper. Paired with home Dal/Sabji.</div>
          </div>
        </div>

        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
          <h4 className="font-bold text-white mb-2 pb-2 border-b border-gray-800">Meal 3: Dinner</h4>
          <div className="text-sm text-gray-300 space-y-2 mt-3">
            <div className="flex justify-between"><span>Oat/Veggie Chicken Meatballs</span><span className="font-mono text-amber-400 font-bold">4 Balls</span></div>
            <div className="flex justify-between"><span>Optional: Extra Veg on side</span><span className="font-mono text-amber-400 font-bold">1 Cup</span></div>
            <div className="flex justify-between mt-4 border-t border-gray-800 pt-2"><span>Post-Workout Shake</span><span className="font-mono text-blue-400 font-bold">25g Whey</span></div>
          </div>
        </div>
      </div>

      {/* Recipe Book */}
      <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50 shadow-xl mt-8">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-6"><BookOpen className="text-blue-400"/> The Recipe Book</h3>
        
        <div className="space-y-6">
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
            <h4 className="font-bold text-lg text-gray-200 mb-3 text-amber-400">High-Protein Oat Meatballs (20-Ball Batch)</h4>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Ingredients</div>
                <ul className="text-sm text-gray-300 space-y-1 font-mono">
                  <li>• 1 kg Minced Chicken</li>
                  <li>• 150g Powdered Oats</li>
                  <li>• 3 Whole Eggs (Binder)</li>
                  <li>• 2 Std Cups Veggies</li>
                  <li>• 2 tbsp Ginger-Garlic</li>
                  <li>• Spices (Pepper, Salt)</li>
                </ul>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Instructions & Macros</div>
                <p className="text-sm text-gray-300 leading-relaxed mb-3">
                  <strong>Veggies:</strong> Use grated carrots, minced capsicum, or onions. If using Lauki (Bottle Gourd), squeeze out the excess water first! <br/><br/>
                  Mix all ingredients thoroughly. Form into exactly <strong className="text-amber-400">20 equal-sized meatballs (~80g each)</strong>. <br/><br/>
                  <strong>Convection Oven Method:</strong> Preheat to 200°C. Cook in <strong>two batches of 10</strong>. Place your lined tray <strong>ON THE WIRE STAND</strong> (not flat on the glass) to allow 360° airflow underneath. Bake for <strong>18-22 minutes total</strong>. Pull tray out at the 12-minute mark to flip them.
                </p>
                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                  <span className="text-xs text-gray-400 uppercase tracking-widest font-bold block mb-1">Your Daily Portion: 4 Meatballs</span>
                  <span className="text-sm text-white font-mono">~420 Kcal | 53g Protein | 24g Carbs | 6g Fat</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
            <h4 className="font-bold text-lg text-gray-200 mb-3 text-emerald-400">Daawat Brown Rice Protocol</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <div className="text-sm font-bold text-white mb-2">Standard Days (Days 1-7)</div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Measure exactly <strong className="text-emerald-400">285 grams (~1.5 cups)</strong> of dry Daawat brown rice. Boil until tender and drain. Divide the cooked batch equally into exactly <strong className="text-emerald-400">3 containers</strong>. Eat 1 container per day for lunch.
                </p>
              </div>
              <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30">
                <div className="text-sm font-bold text-purple-300 mb-2">Refeed Day (Day 8 Only)</div>
                <p className="text-sm text-purple-200/80 leading-relaxed">
                  Measure <strong className="text-purple-400">2 full cups</strong> of dry Daawat brown rice for the batch. Today, you will eat <strong className="text-purple-400">2 containers</strong> of this rice to replenish muscle glycogen and rescue the thyroid.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
            <h4 className="font-bold text-lg text-gray-200 mb-3 text-blue-400">Modular Swaps (Combat Diet Fatigue)</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <div className="text-sm font-bold text-white mb-2 border-b border-gray-700 pb-2">Lunch Swap: Zero-Oil Kheema</div>
                <p className="text-xs text-gray-300 leading-relaxed mb-2">
                  <strong>Replaces:</strong> Sautéed Chicken Breast.<br/>
                  <strong>3-Day Batch Prep:</strong> Cook <strong className="text-blue-300">500g minced chicken</strong> in a pot with 2 diced tomatoes, 1 onion, garlic, and Indian spices. Do not add oil. Divide into 3 equal Tupperware boxes.
                </p>
                <div className="text-xs font-mono text-blue-400">Portion: 1 Box (~165g) + Daily Rice + Home Dal</div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <div className="text-sm font-bold text-white mb-2 border-b border-gray-700 pb-2">Dinner Swap: Convection Tikka</div>
                <p className="text-xs text-gray-300 leading-relaxed mb-2">
                  <strong>Replaces:</strong> Oat Meatballs.<br/>
                  <strong>5-Day Batch Prep:</strong> Marinate <strong className="text-blue-300">1kg cubed chicken</strong> in 100g Hung Curd & Tikka Masala. Bake on wire stand at 200°C for 15-18 mins.<br/><br/>
                  <strong className="text-red-400">MACRO FIX:</strong> Since you lose the oats/veggies from the meatballs, you MUST eat 1 Jowar Bhakri (or 30g oats) and 1 Cup Bottle Gourd on the side.
                </p>
                <div className="text-xs font-mono text-blue-400">Portion: 200g Tikka + 1 Bhakri + 1 Cup Veg</div>
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <div className="text-sm font-bold text-white mb-2 border-b border-gray-700 pb-2">Breakfast Swap: Protein Oat Bowl</div>
                <p className="text-xs text-gray-300 leading-relaxed mb-2">
                  <strong>Replaces:</strong> 4 Whole Eggs.<br/>
                  <strong>Daily Prep:</strong> Boil <strong className="text-blue-300">40g raw oats</strong> in water until thick. Let it cool slightly, then stir in 1 scoop Whey Protein (never boil whey). Top with 15g crushed almonds/walnuts.<br/><br/>
                  <strong className="text-red-400">MACRO FIX:</strong> Eat your 1 Cup French Beans on the side to match the fiber.
                </p>
                <div className="text-xs font-mono text-blue-400">Portion: 1 Bowl + 1 Cup Veggies</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  const renderMatrix = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><Scale className="text-cyan-400"/> Body Recomposition Matrix</h3>
        <p className="text-sm text-gray-400 mb-6">Tracking weight vs. visceral fat (waist). Do not obsess over the scale while on creatine.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-gray-900 p-4 rounded-xl border border-gray-800">
          <input type="date" value={newLog.date} onChange={e=>setNewLog({...newLog, date: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 outline-none focus:border-cyan-500" />
          <input type="number" placeholder="Weight (kg)" value={newLog.weight} onChange={e=>setNewLog({...newLog, weight: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 outline-none focus:border-cyan-500" />
          <input type="number" placeholder="Waist (in)" value={newLog.waist} onChange={e=>setNewLog({...newLog, waist: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 outline-none focus:border-cyan-500" />
          <button onClick={saveMatrixLog} className="bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 font-bold rounded-lg hover:bg-cyan-600/40 transition-colors">SAVE LOG</button>
        </div>

        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-gray-950/80 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Date Logged</th>
                <th className="px-6 py-4 font-semibold">Scale Weight</th>
                <th className="px-6 py-4 font-semibold">Waist Circumference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {matrixLogs.length > 0 ? matrixLogs.map((log, i) => (
                <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 text-gray-300 font-medium">{log.date}</td>
                  <td className="px-6 py-4 text-white font-mono">{log.weight} kg</td>
                  <td className="px-6 py-4 text-emerald-400 font-mono">{log.waist} in</td>
                </tr>
              )) : (
                <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500 italic">No logs yet. Add your first entry above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans pb-24 selection:bg-cyan-500/30">
      <nav className="border-b border-gray-800 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center shadow-lg shadow-cyan-900/20">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-none text-white">Metabolic Command</h1>
              <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">Endocrine Reset V2.1.2</span>
            </div>
          </div>
          {user ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider">DB LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              <span className="text-[10px] font-bold text-amber-400 tracking-wider">CONNECTING...</span>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 mb-8">
        <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-800 pb-px gap-2 sm:gap-6">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity }, 
            { id: 'workout', label: 'Protocol', icon: Dumbbell }, 
            { id: 'fuel', label: 'Fuel Vault', icon: Utensils }, 
            { id: 'matrix', label: 'Body Matrix', icon: Scale }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center gap-2 px-3 sm:px-1 pb-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${isActive ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'workout' && renderProtocol()}
        {activeTab === 'fuel' && renderFuel()}
        {activeTab === 'matrix' && renderMatrix()}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}