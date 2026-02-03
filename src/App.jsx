import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Area } from 'recharts';
import { Plus, Trash2, ChevronDown, ChevronUp, Check, Scale, Ruler, Utensils, Dumbbell, Activity, Calendar, Info, Filter, Save, History, Repeat } from 'lucide-react';

// --- Material Design 3 Color Tokens ---
const colors = {
  primary: '#4F6F52', // Deep Green
  onPrimary: '#FFFFFF',
  primaryContainer: '#D2E3D2',
  onPrimaryContainer: '#0F2011',
  secondary: '#5D4037', // Earthy Brown
  secondaryContainer: '#D7CCC8',
  background: '#FDFCF6', // Off-white
  surface: '#FDFCF6',
  surfaceVariant: '#E0E2DD',
  onSurface: '#1A1C19',
  onSurfaceVariant: '#43474E',
  outline: '#73777F',
  error: '#BA1A1A',
};

// --- DATA: Recipes (The "Menu A" Protocol) ---
const RECIPES = [
  {
    id: 'r1',
    title: 'Volume-Boosted Chicken Meatballs',
    tags: ['Lunch', 'Batch Prep', 'High Protein'],
    calories: '280 kcal (per 5)',
    protein: '45g',
    ingredients: [
      '1 kg Minced Chicken Breast',
      '120g Powdered Oats',
      '3 Cups Grated Bottle Gourd (Squeezed dry)',
      '2 tbsp Ginger/Garlic Paste',
      'Spices: Turmeric, Chili, Garam Masala'
    ],
    instructions: [
      'Mix all ingredients thoroughly in a large bowl.',
      'Form into 20 large balls (This is a 4-day supply).',
      'Air Fry or Bake at 200°C for 15-20 mins until golden.',
      'Eat 5 meatballs per day for lunch.'
    ]
  },
  {
    id: 'r2',
    title: 'Lipid-Control Brown Rice Pulao',
    tags: ['Dinner', 'Batch Prep', 'Fiber Rich'],
    calories: '350 kcal',
    protein: '30g',
    ingredients: [
      '1 Cup Raw Brown Rice (Soaked 30 mins)',
      '750g Cubed Chicken Breast',
      '3 Cups Chopped Veggies (Beans, Carrots, Peas)',
      '1 tbsp Oil/Ghee',
      'Whole Spices (Bay leaf, Cumin)'
    ],
    instructions: [
      'Sauté spices and chicken in pressure cooker with oil.',
      'Add the 3 cups of veggies and sauté for 2 mins.',
      'Add soaked rice and 2.5 cups water.',
      'Pressure cook for 3-4 whistles.',
      'IMMEDIATE: Divide into 3 containers to prevent overeating.'
    ]
  },
  {
    id: 'r3',
    title: 'Morning Power Scramble',
    tags: ['Breakfast', 'Quick'],
    calories: '320 kcal',
    protein: '24g',
    ingredients: [
      '4 Whole Eggs',
      '1 Cup Chopped Spinach or Beans',
      'Salt & Pepper',
      'Oil Spray'
    ],
    instructions: [
      'Sauté veggies in a non-stick pan until soft.',
      'Whisk eggs and pour over veggies.',
      'Scramble until cooked but soft.'
    ]
  },
];

// --- DATA: Workout Routine (Rolling Split) ---
const WORKOUTS = {
  push: {
    title: 'Push Day (Chest/Shoulders/Tri)',
    exercises: [
      { id: 'ex1', name: 'Dumbbell Chest Press', sets: 3, reps: '10-12', type: 'standard' },
      { id: 'ex2', name: 'Overhead Press', sets: 3, reps: '10-12', type: 'standard' },
      { id: 'ex3', name: 'Tricep Pushdowns', sets: 3, reps: '12-15', type: 'standard' },
      { id: 'ex4', name: 'Plank', sets: 3, reps: '45s', type: 'standard' },
      { id: 'cardio1', name: 'Incline Walk (Zone 2)', sets: 1, reps: '20-30 mins', type: 'cardio' }
    ]
  },
  pull: {
    title: 'Pull Day (Back/Biceps)',
    exercises: [
      { id: 'ex5', name: 'Lat Pulldowns', sets: 3, reps: '10-12', type: 'standard' },
      { id: 'ex6', name: 'Dumbbell Rows', sets: 3, reps: '10-12', type: 'standard' },
      { 
        id: 'superset1', 
        name: 'Superset: Face Pulls + Bicep Curls', 
        type: 'superset',
        exercises: [
           { id: 'ex7', name: 'Face Pulls', sets: 3, reps: '15' },
           { id: 'ex8', name: 'Bicep Curls', sets: 3, reps: '12' }
        ]
      },
      { id: 'cardio2', name: 'Incline Walk (Zone 2)', sets: 1, reps: '20-30 mins', type: 'cardio' }
    ]
  },
  legs: {
    title: 'Leg Day (Lower Body)',
    exercises: [
      { id: 'ex9', name: 'Leg Press', sets: 3, reps: '12-15', type: 'standard' },
      { id: 'ex10', name: 'Seated Leg Raises (Extensions)', sets: 3, reps: '12-15', type: 'standard' },
      { 
        id: 'superset2', 
        name: 'Superset: Hamstrings + Calves', 
        type: 'superset',
        exercises: [
           { id: 'ex11', name: 'Hamstring Curls', sets: 3, reps: '12-15' },
           { id: 'ex12', name: 'Calf Raises', sets: 3, reps: '15-20' }
        ]
      },
      { id: 'cardio3', name: 'Incline Walk (Zone 2)', sets: 1, reps: '20-30 mins', type: 'cardio' }
    ]
  },
  rest: {
    title: 'Active Recovery',
    exercises: [
      { id: 'cardio4', name: 'Zone 1-2 Cardio (Walk/Cycle)', sets: 1, reps: '45 mins', type: 'cardio' },
      { id: 'stretch', name: 'Full Body Stretch', sets: 1, reps: '15 mins', type: 'cardio' }
    ]
  }
};

// --- COMPONENTS ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-3xl p-6 shadow-sm border border-stone-200 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "" }) => {
  const baseStyle = "px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center justify-center gap-2";
  // Using inline styles for dynamic colors
  const styleMap = {
    primary: { backgroundColor: colors.primary, color: 'white' },
    secondary: { backgroundColor: colors.surfaceVariant, color: colors.onSurface },
    outline: { border: `1px solid ${colors.outline}`, color: colors.onSurface },
    ghost: { color: colors.onSurfaceVariant }
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyle} ${className}`}
      style={styleMap[variant]}
    >
      {children}
    </button>
  );
};

const TabNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Today', icon: Activity },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'diet', label: 'Diet & Prep', icon: Utensils },
    { id: 'tracker', label: 'Tracker', icon: Scale },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 pb-safe pt-2 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-between items-center max-w-md mx-auto h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-60'}`}
            >
              <div 
                className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-[#D2E3D2]' : 'bg-transparent'}`}
              >
                <tab.icon 
                  size={24} 
                  color={isActive ? '#0F2011' : '#43474E'} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-[#0F2011]' : 'text-[#43474E]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Progress State: Date, Weight, Waist, Chest
  const [progressLogs, setProgressLogs] = useState([
    { date: '2023-01-01', weight: 110, waist: 46, chest: 0 },
    { date: '2023-06-01', weight: 92, waist: 42, chest: 0 },
    { date: '2024-01-01', weight: 101, waist: 44, chest: 0 }, // Current baseline
  ]);

  // Input State for new log
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    waist: '',
    chest: ''
  });

  const [workoutLogs, setWorkoutLogs] = useState({});
  const [currentDay, setCurrentDay] = useState(1); // 1-4 Rolling Cycle

  // Load Data
  useEffect(() => {
    const savedWorkouts = localStorage.getItem('workoutLogs');
    if (savedWorkouts) setWorkoutLogs(JSON.parse(savedWorkouts));
    
    const savedDay = localStorage.getItem('currentDay');
    if (savedDay) setCurrentDay(parseInt(savedDay));

    const savedProgress = localStorage.getItem('progressLogs');
    if (savedProgress) setProgressLogs(JSON.parse(savedProgress));
  }, []);

  // Save Workout Set
  const saveSetLog = (exerciseId, setIndex, field, value) => {
    const currentLog = workoutLogs[exerciseId] || { sets: [] };
    const updatedSets = [...(currentLog.sets || [])];
    
    // Ensure array is long enough
    while (updatedSets.length <= setIndex) {
      updatedSets.push({ weight: '', reps: '', rpe: '' });
    }

    updatedSets[setIndex] = { 
        ...updatedSets[setIndex], 
        [field]: value 
    };

    const newLogEntry = {
      ...currentLog,
      sets: updatedSets,
      lastUpdated: new Date().toLocaleDateString()
    };

    const newLogs = { ...workoutLogs, [exerciseId]: newLogEntry };
    setWorkoutLogs(newLogs);
    localStorage.setItem('workoutLogs', JSON.stringify(newLogs));
  };

  // Save Progress (Weight/Inches)
  const saveProgressLog = () => {
    if (!newLog.weight && !newLog.waist) return;
    
    const entry = {
      date: newLog.date,
      weight: parseFloat(newLog.weight) || null,
      waist: parseFloat(newLog.waist) || null,
      chest: parseFloat(newLog.chest) || null
    };

    const updatedLogs = [...progressLogs, entry].sort((a,b) => new Date(a.date) - new Date(b.date));
    
    setProgressLogs(updatedLogs);
    localStorage.setItem('progressLogs', JSON.stringify(updatedLogs));
    
    // Reset form but keep date
    setNewLog(prev => ({ ...prev, weight: '', waist: '', chest: '' }));
  };

  const deleteProgressLog = (index) => {
    const updatedLogs = progressLogs.filter((_, i) => i !== index);
    setProgressLogs(updatedLogs);
    localStorage.setItem('progressLogs', JSON.stringify(updatedLogs));
  }

  const cycleDay = () => {
    const nextDay = currentDay === 4 ? 1 : currentDay + 1;
    setCurrentDay(nextDay);
    localStorage.setItem('currentDay', nextDay);
  };

  const getWorkoutForToday = () => {
    if (currentDay === 1) return WORKOUTS.push;
    if (currentDay === 2) return WORKOUTS.pull;
    if (currentDay === 3) return WORKOUTS.legs;
    return WORKOUTS.rest;
  };

  // --- RENDERERS ---

  const renderDashboard = () => (
    <div className="space-y-6 pb-24 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1C19] tracking-tight">Good Morning, Sanket</h1>
          <p className="text-[#43474E]">Metabolic Reset: Day {currentDay} of 4</p>
        </div>
        <div className="bg-[#D2E3D2] p-3 rounded-full flex flex-col items-center min-w-[80px]">
           <span className="text-lg font-bold text-[#0F2011]">{progressLogs[progressLogs.length-1]?.weight || 101} kg</span>
           <span className="text-xs text-[#4F6F52] font-medium">{progressLogs[progressLogs.length-1]?.waist || 44}" Waist</span>
        </div>
      </header>

      {/* Daily Checklist */}
      <Card className="bg-[#F0F2EE]">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#4F6F52]" /> Daily Essentials
        </h2>
        <div className="space-y-3">
          {[
            { id: 'thyroid', label: 'Thyroid Meds (07:00 AM)', desc: 'Empty stomach, 60m wait' },
            { id: 'water', label: '3 Liters Water', desc: 'Sip throughout the day' },
            { id: 'walk', label: 'Incline Walk', desc: '20-30 mins Zone 2' },
            { id: 'meds', label: 'Night Meds (Rosave F)', desc: 'With Dinner' }
          ].map(item => (
            <label key={item.id} className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-stone-50 transition-colors">
              <input type="checkbox" className="mt-1 w-5 h-5 rounded border-stone-300 text-[#4F6F52] focus:ring-[#4F6F52]" />
              <div>
                <div className="font-semibold text-[#1A1C19]">{item.label}</div>
                <div className="text-sm text-[#43474E]">{item.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Today's Meal Plan Snapshot */}
      <Card>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-[#4F6F52]" /> Today's Fuel
        </h2>
        <div className="space-y-4 relative">
          <div className="flex gap-4 items-center">
             <div className="w-16 text-sm font-bold text-[#43474E]">Lunch</div>
             <div className="flex-1 p-3 bg-stone-50 rounded-xl border border-stone-100">
                <div className="font-bold">5 Meatballs</div>
                <div className="text-xs text-[#73777F]">With Cucumber slices</div>
             </div>
          </div>
          <div className="flex gap-4 items-center">
             <div className="w-16 text-sm font-bold text-[#43474E]">Dinner</div>
             <div className="flex-1 p-3 bg-stone-50 rounded-xl border border-stone-100">
                <div className="font-bold">Brown Rice Pulao</div>
                <div className="text-xs text-[#73777F]">Strict 1:1 Veggie Ratio</div>
             </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSetRow = (exerciseId, setNum) => {
      const log = workoutLogs[exerciseId]?.sets?.[setNum] || {};
      
      return (
        <div className="flex gap-2 items-center mb-2" key={setNum}>
            <span className="w-8 text-xs font-bold text-[#43474E] text-center">#{setNum + 1}</span>
            <input 
                type="number" 
                placeholder="kg"
                value={log.weight || ''}
                onChange={(e) => saveSetLog(exerciseId, setNum, 'weight', e.target.value)}
                className="w-20 p-2 bg-stone-50 rounded-lg text-sm border-none focus:ring-1 focus:ring-[#4F6F52]" 
            />
             <input 
                type="number" 
                placeholder="Reps"
                value={log.reps || ''}
                onChange={(e) => saveSetLog(exerciseId, setNum, 'reps', e.target.value)}
                className="w-16 p-2 bg-stone-50 rounded-lg text-sm border-none focus:ring-1 focus:ring-[#4F6F52]" 
            />
            <div className="flex-1 flex gap-1">
                {['E', 'M', 'H'].map((lvl) => (
                    <button
                        key={lvl}
                        onClick={() => saveSetLog(exerciseId, setNum, 'rpe', lvl)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                            log.rpe === lvl 
                            ? (lvl === 'E' ? 'bg-green-100 text-green-800 ring-1 ring-green-500' : lvl === 'M' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-500' : 'bg-red-100 text-red-800 ring-1 ring-red-500')
                            : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
                        }`}
                    >
                        {lvl}
                    </button>
                ))}
            </div>
        </div>
      );
  }

  const renderExerciseCard = (ex) => {
    const lastSession = workoutLogs[ex.id];
    
    return (
      <Card key={ex.id} className="relative overflow-hidden group transition-all hover:shadow-md mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#1A1C19]">{ex.name}</h3>
            <div className="text-sm font-medium text-[#4F6F52] bg-[#D2E3D2] inline-block px-2 py-0.5 rounded-md mt-1">
              Target: {ex.sets} sets × {ex.reps}
            </div>
          </div>
          {lastSession && (
            <div className="text-right text-xs text-[#43474E] bg-stone-100 p-2 rounded-lg">
               <div className="font-semibold uppercase tracking-wider text-[10px]">Last time</div>
               <div>{lastSession.lastUpdated}</div>
            </div>
          )}
        </div>

        {/* Set Logger */}
        <div className="mt-4 pt-4 border-t border-stone-100">
           <div className="flex gap-2 mb-2 px-1">
              <span className="w-8"></span>
              <span className="w-20 text-xs font-bold text-[#43474E]">Weight</span>
              <span className="w-16 text-xs font-bold text-[#43474E]">Reps</span>
              <span className="flex-1 text-xs font-bold text-[#43474E] text-center">Difficulty (E/M/H)</span>
           </div>
           {[...Array(ex.sets)].map((_, i) => renderSetRow(ex.id, i))}
        </div>
      </Card>
    );
  };

  const renderWorkout = () => {
    const todayWorkout = getWorkoutForToday();
    
    return (
      <div className="space-y-6 pb-24 animate-fade-in">
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#1A1C19]">Today's Training</h2>
            <p className="text-[#43474E]">{todayWorkout.title}</p>
          </div>
          <Button onClick={cycleDay} variant="secondary" className="text-sm px-4">
             Next Day <ChevronDown size={16} />
          </Button>
        </header>

        <div className="space-y-4">
          {todayWorkout.exercises.map((item) => {
            if (item.type === 'superset') {
                return (
                    <div key={item.id} className="border-2 border-[#D2E3D2] rounded-3xl p-4 bg-[#F0F2EE] relative">
                        <div className="absolute -top-3 left-4 bg-[#4F6F52] text-white text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                            <Repeat size={12} /> SUPERSET
                        </div>
                        {item.exercises.map(ex => renderExerciseCard(ex))}
                    </div>
                )
            } else {
                return renderExerciseCard(item);
            }
          })}
        </div>
      </div>
    );
  };

  const renderDiet = () => (
    <div className="space-y-6 pb-24 animate-fade-in">
      <header>
        <h2 className="text-3xl font-bold text-[#1A1C19]">Metabolic Recipes</h2>
        <p className="text-[#43474E]">Menu A: The Reset Protocol</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
         {['All', 'Breakfast', 'Lunch', 'Dinner'].map(tag => (
           <button key={tag} className="px-4 py-2 rounded-full bg-white border border-stone-200 text-sm font-medium whitespace-nowrap hover:bg-stone-50 focus:bg-[#0F2011] focus:text-white transition-colors">
             {tag}
           </button>
         ))}
      </div>

      <div className="grid gap-4">
        {RECIPES.map(recipe => (
          <Card key={recipe.id} className="hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-[#1A1C19]">{recipe.title}</h3>
              <div className="text-xs font-bold text-[#4F6F52] bg-[#D2E3D2] px-2 py-1 rounded">{recipe.calories}</div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2 mb-4">
              {recipe.tags.map(tag => (
                <span key={tag} className="text-xs bg-stone-100 text-[#43474E] px-2 py-1 rounded-md">{tag}</span>
              ))}
            </div>

            <div className="space-y-4">
              <div className="bg-[#F0F2EE] p-3 rounded-xl">
                 <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Filter size={14}/> Ingredients</h4>
                 <ul className="text-sm space-y-1 text-[#43474E]">
                    {recipe.ingredients.map((ing, i) => <li key={i}>• {ing}</li>)}
                 </ul>
              </div>
              
              <div>
                 <h4 className="font-semibold text-sm mb-2">Instructions</h4>
                 <ol className="text-sm space-y-2 text-[#43474E] list-decimal pl-4">
                    {recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
                 </ol>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderTracker = () => (
    <div className="space-y-6 pb-24 animate-fade-in">
      <header>
        <h2 className="text-3xl font-bold text-[#1A1C19]">Progress Tracker</h2>
        <p className="text-[#43474E]">Log Weekly to Track Metabolic Repair</p>
      </header>

      {/* CHART */}
      <Card>
        <h3 className="text-lg font-bold mb-4">Weight vs. Waist</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={progressLogs}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E2DD" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#43474E', fontSize: 12}} dy={10} />
              <YAxis yAxisId="left" orientation="left" stroke={colors.primary} domain={['dataMin - 2', 'dataMax + 2']} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke={colors.secondary} domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="weight" 
                name="Weight (kg)"
                stroke={colors.primary} 
                strokeWidth={3} 
                dot={{fill: colors.primary, strokeWidth: 2, r: 4, stroke: 'white'}} 
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="waist" 
                name="Waist (in)"
                fill="#D7CCC8" 
                stroke={colors.secondary} 
                strokeDasharray="5 5"
                fillOpacity={0.3}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* INPUT FORM */}
      <Card>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
           <Plus className="w-5 h-5 text-[#4F6F52]" /> Log New Entry
        </h3>
        <div className="grid grid-cols-2 gap-4">
           <div className="col-span-2">
              <label className="text-xs font-bold text-[#43474E] ml-1">Date</label>
              <input 
                type="date" 
                value={newLog.date}
                onChange={(e) => setNewLog({...newLog, date: e.target.value})}
                className="w-full mt-1 p-3 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-[#4F6F52]" 
              />
           </div>
           <div>
              <label className="text-xs font-bold text-[#43474E] ml-1">Weight (kg)</label>
              <input 
                type="number" 
                placeholder="101.0" 
                value={newLog.weight}
                onChange={(e) => setNewLog({...newLog, weight: e.target.value})}
                className="w-full mt-1 p-3 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-[#4F6F52]" 
              />
           </div>
           <div>
              <label className="text-xs font-bold text-[#43474E] ml-1">Waist (in)</label>
              <input 
                type="number" 
                placeholder="44.0" 
                value={newLog.waist}
                onChange={(e) => setNewLog({...newLog, waist: e.target.value})}
                className="w-full mt-1 p-3 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-[#4F6F52]" 
              />
           </div>
           <div className="col-span-2">
              <label className="text-xs font-bold text-[#43474E] ml-1">Chest (in) - Optional</label>
              <input 
                type="number" 
                placeholder="--" 
                value={newLog.chest}
                onChange={(e) => setNewLog({...newLog, chest: e.target.value})}
                className="w-full mt-1 p-3 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-[#4F6F52]" 
              />
           </div>
           <div className="col-span-2 mt-2">
              <Button onClick={saveProgressLog} className="w-full">
                 <Save size={18} /> Save Log
              </Button>
           </div>
        </div>
      </Card>

      {/* HISTORY TABLE */}
       <Card>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
           <History className="w-5 h-5 text-[#43474E]" /> History
        </h3>
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
              <thead className="text-xs text-[#43474E] uppercase bg-[#F0F2EE]">
                 <tr>
                    <th className="px-4 py-3 rounded-l-lg">Date</th>
                    <th className="px-4 py-3">Weight</th>
                    <th className="px-4 py-3">Waist</th>
                    <th className="px-4 py-3 rounded-r-lg">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                 {progressLogs.slice().reverse().map((log, index) => (
                    <tr key={index} className="hover:bg-stone-50">
                       <td className="px-4 py-3 font-medium">{log.date}</td>
                       <td className="px-4 py-3">{log.weight} kg</td>
                       <td className="px-4 py-3">{log.waist || '-'} "</td>
                       <td className="px-4 py-3">
                          <button onClick={() => deleteProgressLog(progressLogs.length - 1 - index)} className="text-red-400 hover:text-red-600">
                             <Trash2 size={16} />
                          </button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCF6] text-[#1A1C19] font-sans selection:bg-[#D2E3D2]">
      <main className="max-w-md mx-auto p-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'workout' && renderWorkout()}
        {activeTab === 'diet' && renderDiet()}
        {activeTab === 'tracker' && renderTracker()}
      </main>
      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}