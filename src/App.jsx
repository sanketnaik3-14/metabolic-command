import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Activity, Flame, Clock, Dumbbell, Utensils, 
  Scale, Timer, History, Save, HeartPulse, ChevronRight, 
  CheckCircle2, Pill, BookOpen, Coffee, Moon, Map, Shield
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
// 2. ENDOCRINE PROTOCOL DATA (V3: DUP + C25K)
// ==========================================
const WORKOUT_CYCLE = {
  1: { type: 'LIFT', title: 'Upper Body (Heavy)', focus: 'Strength & CNS Tension', rules: 'Strict 2-minute rests. 1-2 RIR.', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  2: { type: 'LIFT', title: 'Lower Body (Heavy)', focus: 'Mechanical Load', rules: 'Strict 2-minute rests. 1-2 RIR.', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  3: { type: 'CARDIO', title: 'C25K Run', focus: 'Aerobic Base, Fat Oxidation', rules: 'Treadmill C25K. Pre-workout Banana.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Map },
  4: { type: 'REST', title: 'Active Recovery', focus: 'Tendon Repair', rules: '15-min walk max. Light stretching.', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
  5: { type: 'LIFT', title: 'Upper Body (Light)', focus: 'Hypertrophy & Pump', rules: '90s rests. Smart DUP loads.', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  6: { type: 'LIFT', title: 'Lower Body (Light)', focus: 'Capillary Angiogenesis', rules: '90s rests. Smart DUP loads.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  7: { type: 'CARDIO', title: 'C25K Run', focus: 'Aerobic Base, Fat Oxidation', rules: 'Treadmill C25K. Empty glycogen tank.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Map },
  8: { type: 'REST', title: 'Complete Rest', focus: 'CNS & Systemic Recovery', rules: 'Zero impact. High Carb Refeed.', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
};

const EXERCISES = {
  'Upper Body (Heavy)': [
    { name: 'Incline Chest Press', sets: 3, reps: '6-8' },
    { name: 'Decline Machine / Cable Crossover', sets: 3, reps: '10-12' },
    { name: 'Lat Pulldown', sets: 3, reps: '6-8' },
    { name: 'Seated Cable Row', sets: 3, reps: '8-10' },
    { name: 'Shoulder Press', sets: 3, reps: '8-10' },
    { name: 'Lateral Raise', sets: 3, reps: '10-12' },
    { name: 'Face Pull / Reverse Fly', sets: 2, reps: '10-12' },
    { name: 'Tricep Pushdown', sets: 3, reps: '10-12' },
    { name: 'Bicep Curl', sets: 2, reps: '10-12' }
  ],
  'Lower Body (Heavy)': [
    { name: 'Bulgarian Split Squat', sets: 4, reps: '8-10' },
    { name: 'RDL', sets: 3, reps: '8-10' },
    { name: 'Leg Extension', sets: 3, reps: '10-12' },
    { name: 'Hamstring Curl', sets: 2, reps: '10-12' },
    { name: 'Lateral Band Walk', sets: 2, reps: '15' },
    { name: 'Calves', sets: 3, reps: '12-15' },
    { name: 'Machine Abs', sets: 3, reps: '12-15' },
    { name: 'Knee Raises', sets: 3, reps: '15' },
    { name: 'Side Planks (Per Side)', sets: 3, reps: '30s' }
  ],
  'Upper Body (Light)': [
    { name: 'Incline Chest Press (Light)', sets: 3, reps: '12-15' },
    { name: 'Decline Machine / Cable Crossover (Light)', sets: 3, reps: '12-15' },
    { name: 'Lat Pulldown (Light)', sets: 3, reps: '12-15' },
    { name: 'Seated Cable Row (Light)', sets: 3, reps: '15-20' },
    { name: 'Shoulder Press (Light)', sets: 3, reps: '12-15' },
    { name: 'Lateral Raise (Light)', sets: 3, reps: '15-20' },
    { name: 'Face Pull / Reverse Fly (Light)', sets: 2, reps: '15-20' },
    { name: 'Tricep Pushdown (Light)', sets: 3, reps: '15-20' },
    { name: 'Bicep Curl (Light)', sets: 2, reps: '15-20' }
  ],
  'Lower Body (Light)': [
    { name: 'Bulgarian Split Squat (Light)', sets: 4, reps: '15' },
    { name: 'RDL (Light)', sets: 3, reps: '15-20' },
    { name: 'Leg Extension (Light)', sets: 3, reps: '15-20' },
    { name: 'Hamstring Curl (Light)', sets: 2, reps: '15-20' },
    { name: 'Lateral Band Walk (Light)', sets: 2, reps: '20' },
    { name: 'Calves (Light)', sets: 3, reps: '20' },
    { name: 'Machine Abs (Light)', sets: 3, reps: '15-20' },
    { name: 'Knee Raises (Light)', sets: 3, reps: '15-20' },
    { name: 'Side Planks (Per Side) (Light)', sets: 3, reps: '45s' }
  ]
};

// ==========================================
// 3. UI COMPONENTS
// ==========================================
const RestTimer = ({ duration = 120 }) => {
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
    const endTime = Date.now() + duration * 1000;
    localStorage.setItem('mc_restEndTime', endTime.toString());
    setTimeLeft(duration);
  };

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
  const buttonText = timeLeft > 0 ? formatTime(timeLeft) : `START ${duration === 120 ? '2 MIN' : '90s'} REST`;

  return (
    <button 
      onClick={startTimer}
      className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm ${timeLeft > 0 ? 'bg-amber-500 text-gray-900 border border-amber-400 animate-pulse' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'}`}
    >
      <Timer size={14} />
      {buttonText}
    </button>
  );
};

// ==========================================
// 4. MAIN APPLICATION
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('mc_activeTab') || 'dashboard');
  
  const [cycleDay, setCycleDay] = useState(1);
  const [workoutLogs, setWorkoutLogs] = useState({});
  const [matrixLogs, setMatrixLogs] = useState([]);
  
  const [morningRHR, setMorningRHR] = useState(() => localStorage.getItem('mc_morningRHR') || '');
  const [exerciseInputs, setExerciseInputs] = useState(() => {
    const saved = localStorage.getItem('mc_exerciseInputs');
    return saved ? JSON.parse(saved) : {};
  });
  const [newLog, setNewLog] = useState({ date: new Date().toISOString().split('T')[0], weight: '', waist: '' });

  useEffect(() => { localStorage.setItem('mc_activeTab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('mc_morningRHR', morningRHR); }, [morningRHR]);
  useEffect(() => { localStorage.setItem('mc_exerciseInputs', JSON.stringify(exerciseInputs)); }, [exerciseInputs]);

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
    return { color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10', text: 'RED: System Overload. ABORT WORKOUT. Do Zone 2 only.' };
  };

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
                onClick={() => {
                  saveToDb({ cycleDay: parseInt(day) });
                  setActiveTab('workout');
                }}
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
    const isLightDay = todayPlan.title.includes('Light');
    
    // Auto-calculate Max Weight from Heavy Logs
    const getMaxHeavyWeight = (exerciseName) => {
      const baseName = exerciseName.replace(/\s*\((Heavy|Light|.*)\)/ig, '').trim();
      let maxWt = 0;
      Object.entries(workoutLogs).forEach(([logName, history]) => {
        if (logName.includes(baseName) && !logName.includes('Light')) {
          Object.values(history).forEach(daySets => {
            daySets.forEach(set => {
              const wt = parseFloat(set.weight);
              if (wt > maxWt) maxWt = wt;
            });
          });
        }
      });
      return maxWt;
    };

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className={`p-6 rounded-2xl border ${todayPlan.bg} ${todayPlan.border} shadow-xl relative overflow-hidden`}>
          <div className="relative z-10">
            <h2 className={`text-3xl font-bold ${todayPlan.color} mb-2`}>Day {cycleDay}: {todayPlan.title}</h2>
            <p className="text-gray-300 font-medium mb-4">{todayPlan.rules}</p>
            {todayPlan.type === 'LIFT' && <RestTimer duration={isLightDay ? 90 : 120} />}
          </div>
        </div>

        {todayPlan.type === 'LIFT' && (
          <div className="space-y-6">
            {EXERCISES[todayPlan.title]?.map((ex, idx) => {
              const exHistory = workoutLogs[ex.name] || {};
              const todaySets = exHistory[today] || [];
              const pastDates = Object.keys(exHistory).filter(d => d !== today).sort((a,b) => new Date(b) - new Date(a));
              let lastSessionSets = pastDates.length > 0 ? exHistory[pastDates[0]] : [];

              let lightSuggestion = null;
              if (isLightDay) {
                const maxWt = getMaxHeavyWeight(ex.name);
                if (maxWt > 0) {
                  // Smart DUP Logic Implementation
                  let multiplier = 0.6; 
                  let stratText = "60% CNS Recovery";
                  
                  if (ex.name.includes('Lateral') || ex.name.includes('Bicep') || ex.name.includes('Tricep') || ex.name.includes('Face Pull') || ex.name.includes('Leg Extension') || ex.name.includes('Hamstring Curl')) {
                    multiplier = 0.75;
                    stratText = "75% Volume Target";
                  }
                  if (ex.name.includes('Abs') || ex.name.includes('Calves') || ex.name.includes('Plank') || ex.name.includes('Raises')) {
                    multiplier = 1.0;
                    stratText = "Max Weight / High Reps";
                  }

                  const suggested = Math.round((maxWt * multiplier) * 2) / 2;
                  lightSuggestion = `💡 ${stratText}: ~${suggested} kg (Base: ${maxWt}kg)`;
                } else {
                  lightSuggestion = `💡 Target: High Reps & Pump`;
                }
              }

              return (
              <div key={idx} className="bg-gray-800/40 p-5 rounded-2xl border border-gray-700/50 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-gray-700/50 pb-4">
                  <div>
                    <h4 className="font-bold text-xl text-gray-100">{ex.name}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <div className="text-sm text-gray-400 font-medium tracking-wide">
                        Target: {ex.sets} Sets × {ex.reps} Reps
                      </div>
                      {lightSuggestion && (
                        <div className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                          {lightSuggestion}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[...Array(ex.sets)].map((_, setIdx) => {
                    const savedSet = todaySets[setIdx];
                    const currentInput = exerciseInputs[`${ex.name}-${setIdx}`] || { weight: '', reps: '' };
                    const prevSet = lastSessionSets[setIdx]; 
                    
                    return (
                      <div key={setIdx} className={`flex gap-3 p-3 rounded-lg border ${savedSet ? 'bg-emerald-900/10 border-emerald-500/20 items-center' : 'bg-gray-900 border-gray-800 items-end'}`}>
                        <div className={`w-14 text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 ${savedSet ? '' : 'mb-2'}`}>Set {setIdx + 1}</div>
                        
                        {savedSet ? (
                          <>
                            <div className="flex-1 flex gap-4 text-sm font-mono text-gray-200">
                              <span className="bg-gray-800 px-3 py-1.5 rounded">{savedSet.weight} kg/s</span>
                              <span className="bg-gray-800 px-3 py-1.5 rounded">{savedSet.reps} reps</span>
                            </div>
                            <CheckCircle2 className="text-emerald-500 mr-2" size={20} />
                          </>
                        ) : (
                          <>
                            <div className="flex-1 flex flex-col gap-1">
                               <span className="text-[10px] font-bold text-cyan-500/80 text-center tracking-wider h-3">
                                 {prevSet ? `PREV: ${prevSet.weight}` : ''}
                               </span>
                               <input type="number" placeholder="Kg/s" value={currentInput.weight} onChange={e=>handleExerciseInput(ex.name, setIdx, 'weight', e.target.value)} className="w-full bg-gray-800 text-sm px-2 py-1.5 rounded border border-gray-700 text-white outline-none focus:border-cyan-500 text-center" />
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                               <span className="text-[10px] font-bold text-cyan-500/80 text-center tracking-wider h-3">
                                 {prevSet ? `PREV: ${prevSet.reps}` : ''}
                               </span>
                               <input type="text" placeholder="Reps" value={currentInput.reps} onChange={e=>handleExerciseInput(ex.name, setIdx, 'reps', e.target.value)} className="w-full bg-gray-800 text-sm px-2 py-1.5 rounded border border-gray-700 text-white outline-none focus:border-cyan-500 text-center" />
                            </div>
                            <button onClick={() => logSetToDb(ex.name, setIdx, currentInput.weight, currentInput.reps)} className="ml-auto bg-cyan-600/20 text-cyan-400 px-3 py-1.5 rounded hover:bg-cyan-600/40 border border-cyan-500/30 font-bold text-xs sm:text-sm transition-colors mb-0.5">SAVE</button>
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
            <h3 className="text-xl font-bold flex items-center gap-2"><Map className={todayPlan.color}/> C25K Protocol Active</h3>
            <div className="bg-gray-900 p-6 rounded-xl border border-emerald-500/20">
              <div className="text-xs font-bold text-emerald-500 mb-2 tracking-widest">CURRENT OBJECTIVE</div>
              <div className="text-2xl font-bold text-white mb-2">Follow C25K App Cues</div>
              <p className="text-gray-400 text-sm leading-relaxed">Boot up the C25K application. Keep the treadmill at a comfortable incline (1-2%). Focus on breathing and form during the running intervals. Enjoy the active fat oxidation.</p>
            </div>
          </div>
        )}

        {todayPlan.type === 'REST' && (
          <div className="bg-gray-800/40 p-10 rounded-2xl border border-gray-700/50 shadow-xl text-center space-y-4">
            <Shield className={`mx-auto w-16 h-16 ${todayPlan.color} opacity-80`} />
            <h3 className="text-2xl font-bold text-white">Recovery Mode Engaged</h3>
            <p className="text-gray-400 max-w-md mx-auto">Zero mechanical impact today. Let your central nervous system, joints, and tendons fully recover. Eat your carbs.</p>
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
          <span className="bg-gray-900 px-4 py-1.5 text-xs font-bold text-gray-300 border border-gray-700 rounded-full tracking-wider">DEFICIT TARGET: 2,300 KCAL | 163g PRO | 200g+ CARB</span>
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
              <div><strong className="text-white block">Supplements:</strong> Multivitamin, Fish Oil, Vit B12</div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
          <h4 className="font-bold text-white mb-2 pb-2 border-b border-gray-800">Meal 1: Breakfast</h4>
          <div className="text-sm text-gray-300 space-y-2 mt-3">
            <div className="flex justify-between"><span>Whole Eggs</span><span className="font-mono text-cyan-400 font-bold">4</span></div>
            <div className="flex justify-between"><span>Dry Oats</span><span className="font-mono text-cyan-400 font-bold">60g</span></div>
            <div className="flex justify-between"><span>Milk</span><span className="font-mono text-cyan-400 font-bold">100ml</span></div>
            <div className="flex justify-between"><span>Whey</span><span className="font-mono text-cyan-400 font-bold">1/2 Scoop</span></div>
          </div>
        </div>

        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
          <h4 className="font-bold text-white mb-2 pb-2 border-b border-gray-800">Meal 2: Lunch</h4>
          <div className="text-sm text-gray-300 space-y-2 mt-3">
            <div className="flex justify-between"><span>Chicken Breast</span><span className="font-mono text-emerald-400 font-bold">150g</span></div>
            <div className="flex justify-between"><span>Brown Rice (Dry)</span><span className="font-mono text-emerald-400 font-bold">70g</span></div>
            <div className="text-xs text-gray-500 mt-2 italic">Substitute allowed: 70g raw Jowar/Atta (2 Bhakris/Chapatis).</div>
          </div>
        </div>

        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
          <h4 className="font-bold text-white mb-2 pb-2 border-b border-gray-800">Meal 3: The Shake</h4>
          <div className="text-sm text-gray-300 space-y-2 mt-3">
            <div className="flex justify-between"><span>Whey Protein</span><span className="font-mono text-blue-400 font-bold">1 Scoop</span></div>
            <div className="flex justify-between"><span>Brown Rice (Dry)</span><span className="font-mono text-blue-400 font-bold">70g</span></div>
            <div className="text-xs text-gray-500 mt-2 italic">Plus home-cooked Dal/Sabji buffer (~300 cal limit/day).</div>
          </div>
        </div>
        
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
          <h4 className="font-bold text-white mb-2 pb-2 border-b border-gray-800">Meal 4: Dinner</h4>
          <div className="text-sm text-gray-300 space-y-2 mt-3">
            <div className="flex justify-between"><span>Chicken Breast</span><span className="font-mono text-amber-400 font-bold">150g</span></div>
            <div className="flex justify-between"><span>Dry Oats / Rice</span><span className="font-mono text-amber-400 font-bold">60g / 70g</span></div>
            <div className="text-xs text-gray-500 mt-2 italic">Oats at night heavily promote deep, restorative sleep.</div>
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
              <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">DUP + C25K Protocol V3.1.0</span>
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