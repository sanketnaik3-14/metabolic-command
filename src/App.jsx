import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Activity, Flame, Clock, Dumbbell, Utensils, 
  Scale, Timer, History, Save, HeartPulse, ChevronRight, AlertCircle
} from 'lucide-react';

// ==========================================
// 1. SECURE FIREBASE INITIALIZATION
// (Using environment variables, no hardcoded keys)
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
  1: { type: 'LIFT', title: 'Upper Body (Hypertrophy)', focus: 'Chest, Back, Shoulders, Arms', rules: 'Strict 2-minute rests. 2 RIR. No Cardio.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  2: { type: 'CARDIO', title: 'The Flush (Zone 2)', focus: 'Aerobic Base, Cortisol Flush', rules: '45-55 mins. HR: 138-150 bpm. No Lifting.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  3: { type: 'LIFT', title: 'Lower Body & Core', focus: 'Quads, Hams, Core Matrix', rules: 'Strict 2-minute rests. 2 RIR. 3-1-1 Tempo.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  4: { type: 'CARDIO', title: 'Engine Builder (4x4)', focus: 'VO2 Max, Mitochondrial Density', rules: '4x4 Intervals. Push: 167-178. Rest: <138.', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  5: { type: 'LIFT', title: 'Upper Body (Hypertrophy)', focus: 'Chest, Back, Shoulders, Arms', rules: 'Strict 2-minute rests. 2 RIR. No Cardio.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  6: { type: 'CARDIO', title: 'The Flush (Zone 2)', focus: 'Aerobic Base, Cortisol Flush', rules: '45-55 mins. HR: 138-150 bpm. No Lifting.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  7: { type: 'LIFT', title: 'Lower Body & Core', focus: 'Quads, Hams, Core Matrix', rules: 'Strict 2-minute rests. 2 RIR. 3-1-1 Tempo.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
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
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  return (
    <button 
      onClick={() => setTimeLeft(120)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-colors ${timeLeft > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
    >
      <Timer size={14} />
      {timeLeft > 0 ? formatTime(timeLeft) : '2 MIN REST'}
    </button>
  );
};

const FastingCountdown = ({ targetIso }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!targetIso) return null;

  const targetDate = new Date(targetIso);
  const diff = targetDate - now;
  const isActive = diff > 0;

  if (!isActive) {
    return (
      <div className="p-6 rounded-xl border flex flex-col items-center justify-center text-center bg-emerald-900/20 border-emerald-500/50">
        <div className="text-xs font-bold text-gray-400 tracking-widest mb-2 uppercase">Eating Window Open</div>
        <div className="text-4xl md:text-5xl font-mono font-bold text-emerald-400">Fast Complete!</div>
      </div>
    );
  }

  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  return (
    <div className="p-6 rounded-xl border flex flex-col items-center justify-center text-center bg-cyan-900/20 border-cyan-500/50">
      <div className="text-xs font-bold text-gray-400 tracking-widest mb-2 uppercase">Fasting Window Active</div>
      <div className="text-4xl md:text-5xl font-mono font-bold text-cyan-400">
        {h}h {m}m {s}s
      </div>
      <div className="text-sm text-gray-400 mt-2">Zero calories allowed. Forces Insulin (10.50) down.</div>
    </div>
  );
};

// ==========================================
// 4. MAIN APPLICATION
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Database State
  const [cycleDay, setCycleDay] = useState(1);
  const [fastingTarget, setFastingTarget] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState({});
  const [matrixLogs, setMatrixLogs] = useState([]);
  
  // Local Form State
  const [customFastTime, setCustomFastTime] = useState('');
  const [morningRHR, setMorningRHR] = useState('');
  const [exerciseInputs, setExerciseInputs] = useState({});
  const [newLog, setNewLog] = useState({ date: new Date().toISOString().split('T')[0], weight: '', waist: '' });

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

    // We store all data in a single document for this user to comply with simple query rules
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'appData', 'state');
    
    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.cycleDay) setCycleDay(data.cycleDay);
        if (data.fastingTarget) setFastingTarget(data.fastingTarget);
        if (data.workoutHistory) setWorkoutHistory(data.workoutHistory);
        if (data.matrixLogs) setMatrixLogs(data.matrixLogs);
      }
    }, (error) => {
      console.error("Firestore Listen Error:", error);
    });

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
    } catch (e) {
      console.error("Error saving data:", e);
    }
  };

  const startCustomFast = () => {
    if (!customFastTime) return;
    const [hours, minutes] = customFastTime.split(':');
    const target = new Date();
    target.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // If time is in the future today, it means they started fasting yesterday
    if (target > new Date()) target.setDate(target.getDate() - 1);
    target.setHours(target.getHours() + 14); // Add 14 hours
    
    saveToDb({ fastingTarget: target.toISOString() });
  };

  const logWorkoutSet = (exerciseName, weight, reps) => {
    if (!weight || !reps) return;
    const newHistory = {
      ...workoutHistory,
      [exerciseName]: { weight, reps, date: new Date().toISOString().split('T')[0] }
    };
    saveToDb({ workoutHistory: newHistory });
    setExerciseInputs(prev => ({ ...prev, [exerciseName]: { weight: '', reps: '' } }));
  };

  const saveMatrixLog = () => {
    if (!newLog.weight) return;
    const updatedLogs = [...matrixLogs, newLog].sort((a,b) => new Date(a.date) - new Date(b.date));
    saveToDb({ matrixLogs: updatedLogs });
    setNewLog({ ...newLog, weight: '', waist: '' });
  };

  const handleExerciseInput = (exName, field, value) => {
    setExerciseInputs(prev => ({ ...prev, [exName]: { ...prev[exName], [field]: value } }));
  };

  // ----------------------------------------
  // RHR LOGIC
  // ----------------------------------------
  const getRHRStatus = () => {
    if (!morningRHR) return null;
    const rhr = parseInt(morningRHR);
    if (rhr <= 73) return { color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'GREEN: CNS Recovered. Proceed normally.' };
    if (rhr <= 77) return { color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'YELLOW: Mild Fatigue. Drop weights by 10%. Stop 3 reps short of failure.' };
    return { color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10', text: 'RED: System Overload. ABORT WORKOUT. Do 30m outdoor walk only.' };
  };
  const rhrStatus = getRHRStatus();

  // ----------------------------------------
  // VIEWS
  // ----------------------------------------
  const renderDashboard = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* RHR Traffic Light */}
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
          {rhrStatus && (
            <div className={`flex-1 p-3 rounded-xl border ${rhrStatus.bg} ${rhrStatus.border} ${rhrStatus.color} text-sm font-bold`}>
              {rhrStatus.text}
            </div>
          )}
        </div>
      </div>

      {/* Fasting Engine */}
      <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2"><Clock className="text-cyan-400"/> 14-Hour Fast</h3>
            <p className="text-sm text-gray-400 mt-1">Select the time you took your last bite of food.</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
            <input 
              type="time" 
              value={customFastTime}
              onChange={(e) => setCustomFastTime(e.target.value)}
              className="bg-gray-800 text-gray-200 text-sm px-3 py-2 rounded outline-none border border-gray-700 focus:border-cyan-500"
            />
            <button 
              onClick={startCustomFast}
              className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-4 py-2 rounded text-sm font-bold hover:bg-cyan-500/30 transition-colors"
            >
              START
            </button>
          </div>
        </div>
        <FastingCountdown targetIso={fastingTarget} />
      </div>

      {/* Cycle Selector */}
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
    
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className={`p-6 rounded-2xl border ${todayPlan.bg} ${todayPlan.border} shadow-xl relative overflow-hidden`}>
          <div className="relative z-10">
            <h2 className={`text-3xl font-bold ${todayPlan.color} mb-2`}>Day {cycleDay}: {todayPlan.title}</h2>
            <p className="text-gray-300 font-medium">{todayPlan.rules}</p>
          </div>
        </div>

        {todayPlan.type === 'LIFT' && (
          <div className="space-y-4">
            {EXERCISES[todayPlan.title]?.map((ex, idx) => {
              const currentInput = exerciseInputs[ex.name] || { weight: '', reps: '' };
              const history = workoutHistory[ex.name];
              
              return (
              <div key={idx} className="bg-gray-800/40 p-5 rounded-xl border border-gray-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-md">
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-100">{ex.name}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-400 mt-2">
                    <span className="bg-gray-900 px-3 py-1 rounded border border-gray-700 font-medium">{ex.sets} Sets</span>
                    <span className="bg-gray-900 px-3 py-1 rounded border border-gray-700 font-medium">{ex.reps} Reps</span>
                    <RestTimer />
                  </div>
                </div>
                
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 lg:w-80">
                  <div className="text-xs text-gray-500 font-bold mb-2 flex items-center gap-1"><History size={14}/> PREVIOUS BEST</div>
                  {history ? (
                    <div className="text-sm text-gray-200 mb-4 font-mono">
                      <span className="text-cyan-400 font-bold">{history.weight} kg</span> × <span className="text-cyan-400 font-bold">{history.reps} reps</span> 
                      <span className="text-[11px] text-gray-500 ml-2 block sm:inline">({history.date})</span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 mb-4 italic">No data logged yet.</div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Kg" value={currentInput.weight} onChange={e=>handleExerciseInput(ex.name, 'weight', e.target.value)} className="w-full bg-gray-800 text-sm px-3 py-2 rounded border border-gray-700 text-white outline-none focus:border-blue-500" />
                    <input type="number" placeholder="Reps" value={currentInput.reps} onChange={e=>handleExerciseInput(ex.name, 'reps', e.target.value)} className="w-full bg-gray-800 text-sm px-3 py-2 rounded border border-gray-700 text-white outline-none focus:border-blue-500" />
                    <button onClick={() => logWorkoutSet(ex.name, currentInput.weight, currentInput.reps)} className="bg-blue-600/20 text-blue-400 p-2.5 rounded hover:bg-blue-600/40 border border-blue-500/30 transition-colors"><Save size={18}/></button>
                  </div>
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
                  <p className="text-sm text-gray-400 mt-4">Strictly 60-70% of Heart Rate Reserve.</p>
                </div>
                <div className="space-y-4 text-sm text-gray-300 flex flex-col justify-center">
                  <div className="flex items-start gap-2"><ChevronRight className="text-emerald-500 mt-0.5" size={16}/><span><strong className="text-white">Duration:</strong> 45 to 55 minutes.</span></div>
                  <div className="flex items-start gap-2"><ChevronRight className="text-emerald-500 mt-0.5" size={16}/><span><strong className="text-white">Modality:</strong> Elliptical or Incline Walk.</span></div>
                  <div className="flex items-start gap-2"><ChevronRight className="text-emerald-500 mt-0.5" size={16}/><span><strong className="text-white">Focus:</strong> Fat oxidation & Cortisol flush.</span></div>
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
                <div className="p-4 bg-gray-900 rounded-xl text-sm text-gray-300 border border-gray-700 text-center font-bold tracking-wide">
                  REPEAT CYCLE EXACTLY 4 TIMES.
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
      <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2"><Utensils className="text-amber-400"/> Daily Fuel Matrix</h3>
          <span className="bg-gray-900 px-4 py-1.5 text-xs font-bold text-gray-300 border border-gray-700 rounded-full tracking-wider">~1,640 KCAL | 160g PRO</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
            <h4 className="font-bold text-cyan-400 mb-2">Meal 1: Break-Fast</h4>
            <div className="text-xs text-gray-400 mb-3 bg-gray-800/50 p-2 rounded border border-gray-700/50">
              <span className="text-white font-medium">Meds:</span> Lamotrigine, Escitalopram, Fish Oil, Homochek, Collagen (4g C).
            </div>
            <div className="text-sm text-gray-200">
              <span className="text-white font-bold block mb-1">Diet:</span> 
              4 Whole Eggs + Sautéed French Beans (Low Oil).
            </div>
          </div>

          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
            <h4 className="font-bold text-emerald-400 mb-2">Meal 2: The Hot Lunch</h4>
            <div className="text-sm text-gray-200 mt-5">
              <span className="text-white font-bold block mb-1">Diet:</span> 
              1 Box Batch Brown Rice (95g eq) <br/>+ 170g Fresh Chicken <br/>+ Home Dal (Solid bits only).
            </div>
          </div>

          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
            <h4 className="font-bold text-blue-400 mb-2">Workout Window</h4>
            <div className="text-sm text-gray-200 space-y-2 mt-5">
              <div><span className="text-blue-300 font-bold">Pre:</span> 1 Banana + Creatine</div>
              <div><span className="text-blue-300 font-bold">Post:</span> 1 Scoop Whey Protein (25g)</div>
            </div>
          </div>

          <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
            <h4 className="font-bold text-amber-400 mb-2">Meal 3: Dinner</h4>
            <div className="text-xs text-gray-400 mb-3 bg-gray-800/50 p-2 rounded border border-gray-700/50">
              <span className="text-white font-medium">Night Meds:</span> Magnesium, Fenofibrate, Rosuvastatin.
            </div>
            <div className="text-sm text-gray-200">
              <span className="text-white font-bold block mb-1">Diet:</span> 
              4 Quaker Oat Chicken Meatballs + Veggies.
            </div>
          </div>
        </div>
      </div>

      {cycleDay === 8 && (
        <div className="bg-purple-900/20 rounded-2xl p-6 border border-purple-500/30 animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.15)]">
          <h3 className="text-2xl font-bold flex items-center gap-2 text-purple-400 mb-3"><Flame /> Day 8 Refeed Logic Active</h3>
          <p className="text-gray-300 font-medium mb-2">Rescue the Thyroid (TSH 6.65). Do not restrict carbs today.</p>
          <ul className="text-sm text-purple-200 space-y-2 ml-4 list-disc">
            <li>Eat <strong>2 Bananas</strong> pre-workout instead of 1.</li>
            <li>Eat <strong>2 boxes</strong> of batch brown rice at Lunch instead of 1.</li>
          </ul>
        </div>
      )}
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
              <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">Endocrine Reset V2</span>
            </div>
          </div>
          {user ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider">SECURE DB LIVE</span>
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

      {/* Basic Styles injected to maintain single file architecture */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}