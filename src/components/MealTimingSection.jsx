import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  HiClock, HiLightningBolt, HiMoon, HiSun, HiCheckCircle, HiXCircle,
  HiChevronDown, HiChevronUp, HiInformationCircle, HiStar, HiFire,
  HiSparkles, HiRefresh,
} from 'react-icons/hi';

// -----------------------------------------------------------------------------
// TIME UTILITIES
// -----------------------------------------------------------------------------

// Handles both "HH:MM" (24h) and "H:MM AM/PM" (12h)
function parseMins(str) {
  if (!str) return 0;
  const ampm = /([AaPp][Mm])/.exec(str);
  if (ampm) {
    // 12-hour format e.g. "5:30 PM"
    const [timePart] = str.split(' ');
    const [h, m] = timePart.split(':').map(Number);
    const period = ampm[1].toUpperCase();
    let hours = h;
    if (period === 'PM' && h !== 12) hours += 12;
    if (period === 'AM' && h === 12) hours = 0;
    return hours * 60 + m;
  }
  // 24-hour format e.g. "17:00"
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

function format24h(totalMins) {
  const norm = ((totalMins % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function format12h(totalMins) {
  const norm = ((Math.round(totalMins) % 1440) + 1440) % 1440;
  const h24 = Math.floor(norm / 60);
  const m = norm % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = (h24 % 12) || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function addMins(timeStr, minutes) {
  return format24h(parseMins(timeStr) + minutes);
}

function clampSessionDuration(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 60;
  const rounded = Math.round(parsed);
  return Math.min(240, Math.max(30, rounded));
}

function getScenarioContext(numSessions, t1, t2, sessionDuration1Mins = 60) {
  const base = {
    m1: parseMins(t1),
    m2: parseMins(t2),
    forwardStartGapMinutes: null,
    recoveryGapMinutes: null,
    isLateToEarly: false,
    validScenarios: {
      single: numSessions === 1,
      'double-back-to-back': false,
      'double-spaced': false,
      'late-to-early': false,
    },
    defaultScenario: 'single',
  };

  if (numSessions === 1) return base;

  const isEvening = base.m1 >= (17 * 60);
  const isMorning = base.m2 <= (10 * 60);
  const wrapsToNextDay = base.m2 <= base.m1;
  const forwardStartGapMinutes = (base.m2 - base.m1 + 1440) % 1440;
  const recoveryGapMinutes = Math.max(0, forwardStartGapMinutes - clampSessionDuration(sessionDuration1Mins));
  const isLateToEarly = isEvening && isMorning && wrapsToNextDay;
  const isDoubleSpaced = !isLateToEarly && recoveryGapMinutes >= 240;
  const isBackToBack = !isLateToEarly && recoveryGapMinutes < 240;

  return {
    ...base,
    forwardStartGapMinutes,
    recoveryGapMinutes,
    isLateToEarly,
    validScenarios: {
      single: false,
      'double-back-to-back': isBackToBack,
      'double-spaced': isDoubleSpaced,
      'late-to-early': isLateToEarly,
    },
    defaultScenario: isLateToEarly
      ? 'late-to-early'
      : (isDoubleSpaced ? 'double-spaced' : 'double-back-to-back'),
  };
}

function toAbsoluteMinutes(timeStr, dayStartMins, options = {}) {
  const { forceNextDay = false } = options;
  let mins = parseMins(timeStr);
  if (mins < dayStartMins) mins += 1440;
  if (forceNextDay) mins += 1440;
  return mins;
}

function buildMealRolePlan({
  meals,
  wakeTime,
  trainingTime1,
  trainingTime2,
  numSessions,
  scenario,
  sessionDuration1Mins = 60,
  sessionDuration2Mins = 60,
}) {
  if (!meals?.length) return [];

  const dayStart = parseMins(wakeTime);
  const t1Abs = toAbsoluteMinutes(trainingTime1, dayStart);
  const t1EndAbs = t1Abs + clampSessionDuration(sessionDuration1Mins);
  const t2Abs = numSessions === 2
    ? toAbsoluteMinutes(trainingTime2, dayStart, { forceNextDay: scenario === 'late-to-early' })
    : null;
  const t2EndAbs = t2Abs !== null ? (t2Abs + clampSessionDuration(sessionDuration2Mins)) : null;

  const mealTimeline = meals.map((meal, mealIndex) => ({
    mealIndex,
    absMins: toAbsoluteMinutes(meal.rawTime || meal.time, dayStart),
  }));

  const sessionWindows = [
    { start: t1Abs, end: t1EndAbs },
    ...(t2Abs !== null && t2EndAbs !== null ? [{ start: t2Abs, end: t2EndAbs }] : []),
  ];

  const mealTimelineWithDisplay = mealTimeline.map((entry) => {
    let displayAbsMins = entry.absMins;
    sessionWindows.forEach(({ start, end }) => {
      if (displayAbsMins >= start && displayAbsMins <= end) {
        displayAbsMins = end + 1;
      }
    });
    return { ...entry, displayAbsMins };
  });

  const sorted = [...mealTimelineWithDisplay].sort((a, b) => (
    (a.displayAbsMins - b.displayAbsMins) || (a.absMins - b.absMins) || (a.mealIndex - b.mealIndex)
  ));
  const orderByMealIndex = new Map(sorted.map((entry, order) => [entry.mealIndex, order]));

  const lastBefore = (sessionAbs) => {
    let idx = null;
    sorted.forEach((entry) => {
      if (entry.displayAbsMins < sessionAbs) idx = entry.mealIndex;
    });
    return idx;
  };
  const firstAtOrAfter = (sessionAbs) => {
    const found = sorted.find(entry => entry.displayAbsMins >= sessionAbs);
    return found ? found.mealIndex : null;
  };

  const pre1Idx = lastBefore(t1Abs);
  const post1Idx = firstAtOrAfter(t1EndAbs);
  const pre2Idx = t2Abs !== null ? lastBefore(t2Abs) : null;
  const post2Idx = t2EndAbs !== null ? firstAtOrAfter(t2EndAbs) : null;
  const finalMealIdx = sorted[sorted.length - 1]?.mealIndex ?? null;

  const formatWindowRange = (startAbs, endAbs) => `${format12h(startAbs)}-${format12h(endAbs)}`;

  return mealTimelineWithDisplay.map(({ mealIndex, absMins, displayAbsMins }) => {
    const chronologicalOrder = orderByMealIndex.get(mealIndex) ?? mealIndex;
    let role = chronologicalOrder === 0
      ? 'morning'
      : (chronologicalOrder === (meals.length - 1) ? 'evening' : 'midDay');
    let timeWindowLabel = null;
    let windowRangeLabel = null;

    const beforeS1 = displayAbsMins < t1Abs;
    const betweenSessions = t2Abs !== null && displayAbsMins >= t1EndAbs && displayAbsMins < t2Abs;
    const afterS2 = t2EndAbs !== null && displayAbsMins >= t2EndAbs;
    const leadToS2 = t2Abs !== null ? (t2Abs - displayAbsMins) : null;

    const setPre = (sessionStartAbs) => {
      role = 'preWorkout';
      timeWindowLabel = 'Pre-session window';
      windowRangeLabel = formatWindowRange(sessionStartAbs - 150, sessionStartAbs);
    };
    const setRapid = () => {
      role = 'rapidRecovery';
      timeWindowLabel = 'Between sessions refuel window';
      if (t2Abs !== null) {
        const rapidWindow = t2Abs - t1EndAbs;
        windowRangeLabel = rapidWindow > 0
          ? `${formatWindowRange(t1EndAbs, t2Abs)} (S1 end -> S2 start)`
          : 'Immediate transition (S1 end -> S2 start)';
      }
    };
    const setPost = (sessionEndAbs) => {
      role = 'postWorkout';
      timeWindowLabel = 'Post-workout window (0-2 h)';
      windowRangeLabel = formatWindowRange(sessionEndAbs, sessionEndAbs + 120);
    };

    if (numSessions === 1) {
      if (mealIndex === pre1Idx && beforeS1) setPre(t1Abs);
      if (mealIndex === post1Idx && displayAbsMins >= t1EndAbs) setPost(t1EndAbs);
    } else if (scenario === 'double-back-to-back') {
      if (mealIndex === pre1Idx && beforeS1) setPre(t1Abs);
      if (betweenSessions) setRapid();
      if (mealIndex === post2Idx && afterS2 && t2EndAbs !== null) setPost(t2EndAbs);
    } else if (scenario === 'double-spaced') {
      if (mealIndex === pre1Idx && beforeS1) setPre(t1Abs);
      if (mealIndex === post1Idx && displayAbsMins >= t1EndAbs && (t2Abs === null || displayAbsMins < t2Abs)) {
        setPost(t1EndAbs);
      }

      if (betweenSessions) {
        const isSecondSessionPreWindow = (
          mealIndex === pre2Idx &&
          Number.isFinite(leadToS2) &&
          leadToS2 >= 30 &&
          leadToS2 <= 150
        );
        if (isSecondSessionPreWindow) {
          setPre(t2Abs);
        } else if (mealIndex !== post1Idx) {
          role = 'betweenSessions';
          timeWindowLabel = null;
          windowRangeLabel = null;
        }
      }

      if (mealIndex === post2Idx && afterS2 && t2EndAbs !== null) setPost(t2EndAbs);
    } else if (scenario === 'late-to-early') {
      if (mealIndex === pre1Idx && beforeS1) setPre(t1Abs);
      if (mealIndex === post1Idx && displayAbsMins >= t1EndAbs && mealIndex !== finalMealIdx) setPost(t1EndAbs);
    }

    if (scenario === 'late-to-early' && mealIndex === finalMealIdx) {
      role = 'preSleep';
      timeWindowLabel = 'Pre-sleep recovery window';
      windowRangeLabel = null;
    }

    return {
      mealIndex,
      absMins,
      displayAbsMins,
      role,
      timeWindowLabel,
      windowRangeLabel,
      actualTimeLabel: meals[mealIndex].time,
    };
  });
}

// -----------------------------------------------------------------------------
// ROLE COLOURS
// -----------------------------------------------------------------------------
const ROLE_STYLES = {
  morning:         { border: 'border-blue-500/30',    bg: 'bg-blue-500/5',    dot: 'bg-blue-400 border-blue-400',    text: 'text-blue-400',    badge: 'bg-blue-500/20 text-blue-300'    },
  midDay:          { border: 'border-slate-500/25',   bg: 'bg-slate-800/30',  dot: 'bg-slate-500 border-slate-400',  text: 'text-slate-300',   badge: 'bg-slate-500/20 text-slate-300'  },
  evening:         { border: 'border-indigo-500/30',  bg: 'bg-indigo-500/5',  dot: 'bg-indigo-400 border-indigo-400',text: 'text-indigo-400',  badge: 'bg-indigo-500/20 text-indigo-300'},
  preWorkout:      { border: 'border-amber-500/40',   bg: 'bg-amber-500/6',   dot: 'bg-amber-400 border-amber-400',  text: 'text-amber-400',   badge: 'bg-amber-500/20 text-amber-300'  },
  postWorkout:     { border: 'border-green-500/35',   bg: 'bg-green-500/5',   dot: 'bg-green-400 border-green-400',  text: 'text-green-400',   badge: 'bg-green-500/20 text-green-300'  },
  rapidRecovery:   { border: 'border-orange-500/40',  bg: 'bg-orange-500/6',  dot: 'bg-orange-400 border-orange-400',text: 'text-orange-400',  badge: 'bg-orange-500/20 text-orange-300'},
  betweenSessions: { border: 'border-teal-500/35',    bg: 'bg-teal-500/5',    dot: 'bg-teal-400 border-teal-400',    text: 'text-teal-400',    badge: 'bg-teal-500/20 text-teal-300'    },
  preSleep:        { border: 'border-purple-500/35',  bg: 'bg-purple-500/5',  dot: 'bg-purple-400 border-purple-400',text: 'text-purple-400',  badge: 'bg-purple-500/20 text-purple-300'},
};

// -----------------------------------------------------------------------------
// ANNOTATION CONTENT (ISSN-backed)
// -----------------------------------------------------------------------------
const ANNOTATIONS = {
  morning: {
    focusLabel: 'Metabolic Activation',
    focusDetail: 'Liver Glycogen Restock + Day-Opening MPS Signal',
    icon: '🌅',
    justification:
      'After an overnight fast, hepatic glycogen depletes by ~50% (Coyle et al., 1985). A morning protein dose (0.25-0.4 g/kg) re-establishes muscle protein synthesis signalling. ISSN position (Kerksick et al., 2017) recommends distributing protein across 4 meals every 3-4 h as the primary driver of 24-hour net protein balance.',
    priorities: ['20-40 g quality protein', 'Moderate complex carbohydrates', 'Some dietary fibre', 'Generous hydration'],
    doItems: [
      'Include 20-40 g high-quality protein - eggs, Greek yoghurt, protein shake',
      'Add moderate carbohydrates to restore overnight hepatic glycogen',
      'Stay well hydrated - you wake mildly dehydrated after 7-8 h sleep',
      'Allow 2-3 h digestion before intense training if applicable',
    ],
    dontItems: [
      'Routinely skipping this feeding if it makes daily protein or carbohydrate targets harder to hit',
      'Eat a large high-fat meal if training within 2 hours',
      'Load up on fibre if training within 90 minutes',
    ],
    exampleFoods: ['Rolled oats + whey protein + berries', 'Scrambled eggs + wholegrain toast + orange juice', 'Greek yoghurt + banana + granola', 'Protein smoothie + oat-based bar'],
    digestNote: 'Solid meals: 2-3 h. Liquid shakes: 30-45 min. Opt for lighter foods if training is approaching.',
    source: 'Kerksick et al. (2017) ISSN Position Stand; Coyle et al. (1985) J Appl Physiol',
  },

  preWorkout: {
    focusLabel: 'Performance Priming',
    focusDetail: 'Blood Glucose Maintenance + Glycogen Support',
    icon: '⚡',
    justification:
      'Consuming carbohydrate in the 1-4 h pre-exercise window can support liver and muscle glycogen availability and improve performance in many endurance and mixed training settings. Keeping fat and fibre lower can reduce GI discomfort risk. If using solid food, 60-90 min pre-session is often practical; liquid options can work closer to training.',
    priorities: ['Low-to-medium GI carbohydrates', '20-30 g lean protein', 'Minimal fat & fibre', 'Light hydration'],
    doItems: [
      'Eat 60-90 min before training for solid meals',
      'Prioritise low-to-medium GI carbs - oats, sweet potato, wholegrain bread',
      'Include 20-30 g lean protein to reduce muscle protein breakdown during training',
      'Sip 400-600 ml water in the 2 h before exercise',
      'A banana 30 min before is a reliable, fast-digesting carb source if needed',
    ],
    dontItems: [
      'High-fat foods - slow gastric emptying, blunting blood glucose delivery',
      'High-fibre foods - risk of GI cramping and urgency mid-session',
      'Alcohol - impairs glycogen synthesis and reaction time even in small amounts',
      'Going fully fasted into moderate-high intensity sessions unless this is a deliberate and periodised strategy',
    ],
    exampleFoods: ['Oats + milk + banana', 'Wholegrain bread + sliced turkey', 'Rice cakes + honey + protein shake (small)', 'Sweet potato + chicken breast (smaller portion)'],
    digestNote: 'Solid meals: 60-90 min. Liquid meals or shakes: 30-45 min. If prone to GI issues, eat earlier and keep portion small.',
    source: 'Kerksick et al. (2017) ISSN; Hawley & Burke (1997) Sports Med; Moseley et al. (2003) IJSNEM',
  },

  postWorkout: {
    focusLabel: 'Recovery Window',
    focusDetail: 'Muscle Protein Synthesis + Glycogen Resynthesis',
    icon: '💪',
    justification:
      'ISSN supports 20-40 g high-quality protein (0.25-0.4 g/kg) in the early recovery window (roughly 0-2 h post-exercise), especially if pre-exercise feeding was limited. Carbohydrate co-ingestion supports glycogen resynthesis, with higher hourly carbohydrate rates becoming more important when the next session is soon.',
    priorities: ['20-40 g fast protein (whey preferred)', 'Moderate-high GI carbohydrates', 'Minimal fat initially', 'Electrolytes + fluids'],
    doItems: [
      'Target 20-40 g high-quality protein within 2 h - whey is fastest-absorbing acutely',
      'Add 0.5-1 g/kg body weight carbohydrates to accelerate glycogen synthesis',
      'Eat within 30-60 min for optimal recovery - do not skip this window',
      'Replenish fluids: 1.25-1.5 L per kg of body weight lost during exercise',
      'Moderate-to-high GI carbs are appropriate here - white rice, banana, honey',
    ],
    dontItems: [
      'If your pre-training meal was distant, avoid delaying intake for several hours after training',
      'Large amounts of fat - slows amino acid and glucose delivery to muscle',
      'Alcohol - suppresses MPS by up to 24% and impairs overnight glycogen synthesis (Parr et al., 2014)',
      'Excessive fibre - not needed and slows gastric emptying at this point',
    ],
    exampleFoods: ['Whey shake + banana', 'Chicken breast + white rice + steamed veg', 'Tuna + white bread', 'Protein yoghurt + fruit + honey', 'Cottage cheese + rice cakes'],
    digestNote: 'Prioritise fast-digesting options within the first 60 min. A full meal can follow within 2 h if appetite is low immediately post-session.',
    source: 'Kerksick et al. (2017) ISSN; Ivy et al. (1988) Int J Sports Med; Parr et al. (2014) PLOS ONE',
  },

  rapidRecovery: {
    focusLabel: 'RAPID Recovery',
    focusDetail: 'Emergency Glycogen Restock - < 4 h Inter-Session Window',
    icon: '🚨',
    justification:
      'When < 4 h separates sessions, ISSN recommends prioritising rapid carbohydrate refeeding (about 1.0-1.2 g/kg/h), generally favouring faster-digesting options. Adding protein (about 0.2-0.4 g/kg/h) can help when carbohydrate intake is below target. Early feeding matters most when turnaround time is short.',
    priorities: ['High-GI carbohydrates IMMEDIATELY (>=70 GI)', '20-30 g fast protein', 'Liquid or semi-liquid format', 'Aggressive hydration + electrolytes'],
    doItems: [
      'Start refuelling immediately after session 1 - do not wait for hunger',
      'If 30-60 min is available: target 1.0-1.2 g/kg high-GI carbs straight away from dense sources',
      'If <30 min or blocks are effectively back-to-back: prioritise intra-workout CHO drink delivery',
      'Use mostly liquid/very dense carbs to minimise gut load before session 2',
      'Include 20-30 g fast protein only if GI comfort and timing allow',
      'Replenish 500-750 ml fluid per hour of prior training, plus sodium',
    ],
    dontItems: [
      'Long delays before refuelling when sessions are close together',
      'High-fat meal - severely slows gastric emptying and glucose delivery',
      'High-fibre foods - GI distress risk heading into the next session',
      'Large solid meal - prioritise liquid CHO density over volume',
      'Alcohol - inhibits glycogen synthesis at any amount',
    ],
    exampleFoodColumns: [
      {
        title: 'If 30-60 min is available',
        items: [
          'Jaffa cakes, jelly sweets, rice cakes + jam',
          'Sports drink + carb gel',
          'Fruit juice + dextrose/carb powder',
          'Optional: 20-30 g whey if tolerated',
        ],
      },
      {
        title: 'If <30 min or essentially continuous',
        items: [
          'Intra-workout CHO drink as priority',
          'Target ~30-60 g carbs/h (up to ~90 g/h if gut-trained)',
          'Electrolyte + carb mix from warm-up through session 2',
          'Keep solids minimal unless tolerated',
        ],
      },
    ],
    digestNote: 'Liquid/semi-liquid nutrition clears the stomach in 30-60 min. Allow 45-60 min before session 2 after a small solid meal.',
    source: 'Kerksick et al. (2017) ISSN; Ivy et al. (1988) Int J Sports Med; Jentjens & Jeukendrup (2003) Sports Med',
  },

  betweenSessions: {
    focusLabel: 'Full Recovery Meal',
    focusDetail: 'Glycogen Restock + Performance Re-Fuel (4 h+ Window)',
    icon: '🔁',
    justification:
      'With 4+ h between sessions, near-complete glycogen resynthesis is achievable if carbohydrate intake is sufficient. Bussau et al. (2002) showed a single day of high CHO intake (~10 g/kg) can nearly double resting muscle glycogen. This window supports a full balanced meal with protein for MPS, generous carbohydrates for glycogen, and moderate fat for satiety.',
    priorities: ['Complete balanced meal', '30-50 g quality protein', 'Generous carbohydrates (1 g/kg+)', 'Moderate fat acceptable'],
    doItems: [
      'Eat a complete, balanced meal - protein, carbs, vegetables, some fat',
      'Target at least 1 g/kg body weight of carbohydrates across this recovery period',
      '30-50 g quality protein to advance MPS between both sessions',
      'Include vegetables for potassium, magnesium and B-vitamins - all active in muscle function',
      'Reduce meal size in the 90 min approaching session 2',
    ],
    dontItems: [
      'High-fat meal within 90 min of session 2 - slows gastric emptying',
      'Ignoring carbohydrate needs - CHO stores are partially depleted from session 1',
      'Eating only protein - carbohydrates drive repeat performance, not protein alone',
      'Excessive calories - more is not more here; quality and timing matter most',
    ],
    exampleFoods: ['Salmon + basmati rice + green salad', 'Chicken breast + sweet potato + roasted veg', 'Beef mince pasta + tomato sauce', 'Prawn stir-fry + jasmine rice'],
    digestNote: 'Allow 90 min+ before session 2. Main recovery meal 2-3 h out; optional light snack 60-90 min before session 2 if needed.',
    source: 'Kerksick et al. (2017) ISSN; Bussau et al. (2002) Eur J Appl Physiol; Jentjens & Jeukendrup (2003) Sports Med',
  },

  preSleep: {
    focusLabel: 'Pre-Sleep Protocol',
    focusDetail: 'Overnight MPS & Sustained Active Recovery',
    icon: '🌙',
    justification:
      'Snijders et al. (2015) demonstrated that 27.5 g pre-sleep casein protein significantly increased muscle strength and mass over a 12-week resistance training intervention. Trommelen & Van Loon (2016) confirmed pre-sleep protein stimulates overnight MPS without impairing fat oxidation. Kinsey et al. (2016) showed casein does not blunt overnight lipolysis. ISSN formally recommends ~30-40 g casein before sleep.',
    priorities: ['30-40 g slow-digesting protein (casein)', 'Moderate carbohydrates', 'Minimal fat', 'No stimulants'],
    doItems: [
      'Target 30-40 g slow-digesting protein - casein powder, cottage cheese, Greek yoghurt',
      'Add carbohydrate if needed to complete daily targets or support early next-day training',
      'Time this 30-60 min before sleep for optimal digestion dynamics',
      'Stay well hydrated through the evening - dehydration impairs overnight recovery',
    ],
    dontItems: [
      'Large high-fat meal immediately before bed - impairs sleep quality and digestion',
      'Alcohol within 3 h of sleep - reduces REM sleep and blocks overnight MPS',
      'Stimulants (caffeine) within 6 h of sleep - half-life is 5-6 h',
      'Skipping this feeding when daily protein is still low and early training is planned next day',
    ],
    exampleFoods: ['Casein protein shake + berries', 'Cottage cheese + banana', 'Greek yoghurt (full fat) + oats + honey', 'Skyr + mixed seeds + honey', 'Low-fat milk + casein powder'],
    digestNote: 'Casein forms a slow-release gel in the stomach and can provide amino acids across several overnight hours.',
    source: 'Snijders et al. (2015) J Nutr; Trommelen & Van Loon (2016) Nutrients; Kinsey et al. (2016) Nutrients; Kerksick et al. (2017) ISSN',
  },

  midDay: {
    focusLabel: 'Protein Distribution Window',
    focusDetail: 'Sustained Energy + Optimal Anabolic Spacing',
    icon: '🍽️',
    justification:
      'ISSN recommends distributing protein across 4 meals (0.25-0.4 g/kg per meal) every 3-4 h. The "muscle full" hypothesis (Atherton et al., 2010) proposes that MPS plateaus ~90 min post-feeding and returns to baseline within ~3 h - meaning strategically spaced protein doses outperform bolus strategies for 24-hour net protein balance. Schoenfeld et al. (2013) meta-analysis further supports distributed protein over concentrated single feedings.',
    priorities: ['20-40 g quality protein', 'Mixed carbohydrates (complex + moderate GI)', 'Moderate fat', 'Dietary fibre + vegetables'],
    doItems: [
      'Include a complete protein source at every meal - every feeding opportunity matters',
      'Mix complex and moderate GI carbohydrates for sustained afternoon energy',
      'Space this meal 3-4 h from prior and subsequent protein feedings',
      'Add a generous serving of vegetables - fibre, micronutrients and satiety',
    ],
    dontItems: [
      'Neglect carbohydrates - CHO fuels afternoon training performance',
      'Eat a protein-free meal - each feeding should advance the 24-hour MPS signal',
      'Large high-fat meals within 2 h of upcoming training',
    ],
    exampleFoods: ['Grilled chicken + brown rice + side salad', 'Tuna pasta + olive oil + roasted veg', 'Lean beef wrap + avocado + mixed leaves', 'Turkey + sweet potato + broccoli'],
    digestNote: 'Mixed meals (protein + fat + fibre) take 3-4 h to fully digest. Time this meal 2+ h before training.',
    source: 'Kerksick et al. (2017) ISSN; Atherton et al. (2010) Am J Physiol; Schoenfeld et al. (2013) J ISSN',
  },

  evening: {
    focusLabel: 'Recovery Setup',
    focusDetail: 'Complete Daily Targets + Prepare Overnight Systems',
    icon: '🌆',
    justification:
      'The final meal completes daily macro targets and initiates overnight recovery. Total daily protein (1.4-2.0 g/kg) remains the primary driver of body composition outcomes (Kerksick et al., 2017). Adequate evening carbohydrate intake supports next-day glycogen - Bussau et al. (2002) showed near-doubling of muscle glycogen with a single day of high CHO intake after exercise.',
    priorities: ['30-40 g protein to complete daily targets', 'Moderate carbohydrates', 'Vegetables + micronutrients', 'Light-to-moderate fat'],
    doItems: [
      'Complete your daily protein target - large overnight deficits impair recovery',
      'Include carbohydrates - supports glycogen stores for next-day training',
      'Add a variety of coloured vegetables for micronutrients',
      'Wind down - prefer a calmer, lighter meal to support sleep onset',
    ],
    dontItems: [
      'Massive caloric surplus "just before bed" - excess calories still contribute to fat storage',
      'Skip protein - overnight MPS requires substrate availability',
      'Stimulating foods close to sleep - high caffeine, alcohol, or very spicy foods',
    ],
    exampleFoods: ['Salmon + roasted vegetables + basmati rice', 'Turkey mince bolognese + wholegrain pasta', 'Chicken thigh + sweet potato + green beans', 'Eggs + mixed veg + sourdough toast'],
    digestNote: 'Allow 2-3 h between dinner and sleep for comfortable digestion. Plan a separate pre-sleep protein snack for maximum overnight MPS.',
    source: 'Kerksick et al. (2017) ISSN; Bussau et al. (2002) Eur J Appl Physiol',
  },
};

// -----------------------------------------------------------------------------
// SCENARIO META
// -----------------------------------------------------------------------------
const SCENARIO_META = {
  single: {
    label: 'Single Training Session',
    emoji: '⚡',
    tagline: 'Standard single-session day. Nail your pre/post-workout windows and distribute protein evenly.',
    colour: 'amber',
    principles: [
      'Pre-workout: Low fibre, moderate CHO + 20-30 g protein, 60-90 min before',
      'Post-workout: 20-40 g fast protein + CHO within 60 min',
      'Protein: Distribute evenly (~0.3 g/kg per meal) every 3-4 h',
      'Pre-sleep: 30-40 g casein to maximise overnight MPS',
    ],
  },
  'double-back-to-back': {
    label: 'Double Training - Back to Back',
    emoji: '🔥',
    tagline: 'Two sessions within 4 h. Rapid glycogen restoration is your #1 priority between sessions. Speed > complexity.',
    colour: 'orange',
    warning: 'Keep recovery tight between sessions: early carbohydrate and protein intake is usually the main limiter of second-session quality.',
    principles: [
      'If 30-60 min is available: 1.0-1.2 g/kg HIGH-GI carbs immediately after session 1',
      'If <30 min or effectively back-to-back: prioritise intra-workout CHO drink delivery',
      'Use dense/liquid carbs first, then protein if tolerated',
      'Keep fibre and fat minimal between sessions',
      'Total daily CHO significantly elevated - plan ahead',
    ],
    exampleColumns: [
      {
        title: '30-60 min available',
        items: ['Jaffa cakes/sweets', 'Sports drink + gels', 'Juice + carb powder', 'Optional whey'],
      },
      {
        title: '<30 min or continuous',
        items: ['Intra-workout CHO drink', 'Electrolyte + carb mix', 'Small frequent sips', 'Minimal solids'],
      },
    ],
  },
  'double-spaced': {
    label: 'Double Training - 4+ Hours Apart',
    emoji: '🔁',
    tagline: 'Two sessions with adequate recovery. Full glycogen restoration is possible with proper inter-session nutrition.',
    colour: 'teal',
    principles: [
      'Post session 1: Normal recovery protocol - protein + CHO within 60 min',
      'Inter-session meal: Complete balanced meal 2-3 h post session 1',
      'Pre session 2: Standard pre-workout nutrition 60-90 min before',
      'Post session 2: Full recovery meal - protein + CHO + fat acceptable',
      'Total daily CHO elevated - prioritise carbs at all peri-workout meals',
    ],
  },
  'late-to-early': {
    label: 'Training Late - Early Next Day',
    emoji: '🌙',
    tagline: 'Evening session + early morning training. Overnight recovery is compressed, so pre-sleep planning becomes high priority.',
    colour: 'purple',
    warning: 'Overnight recovery is compressed. Plan evening and pre-sleep intake intentionally, and adjust pre-morning fuelling to your tolerance and session demands.',
    principles: [
      'Post evening session: Full recovery meal within 60 min',
      'Pre-sleep: 30-40 g CASEIN + moderate carbs - 6-7 h overnight amino acid drip',
      'Morning: Fast-digesting carbs (banana, white toast) 30-60 min before training',
      'Avoid under-fuelling the morning session after a heavy prior evening load',
      'Consider total daily calorie increase to support dual-session recovery',
    ],
  },
};

// -----------------------------------------------------------------------------
// ROLE GRADIENT COLOURS (for the horizontal bar)
// -----------------------------------------------------------------------------
const ROLE_GRADIENT = {
  morning:         'rgba(59,130,246,0.45)',   // blue
  midDay:          'rgba(100,116,139,0.35)',  // slate
  evening:         'rgba(99,102,241,0.35)',   // indigo
  preWorkout:      'rgba(245,158,11,0.50)',   // amber
  postWorkout:     'rgba(34,197,94,0.45)',    // green
  rapidRecovery:   'rgba(249,115,22,0.50)',   // orange
  betweenSessions: 'rgba(20,184,166,0.40)',   // teal
  preSleep:        'rgba(168,85,247,0.45)',   // purple
  training:        'rgba(239,68,68,0.55)',    // red
};

// -----------------------------------------------------------------------------
// VISUAL DAY BAR COMPONENT
// -----------------------------------------------------------------------------
function DayBar({
  wakeTime,
  sleepTime,
  trainingTime1,
  trainingTime2,
  numSessions,
  meals,
  scenario,
  mealRolePlan = [],
  sessionDuration1Mins = 60,
  sessionDuration2Mins = 60,
}) {
  const dayStart = parseMins(wakeTime);
  const dayEnd = dayStart + (16 * 60);
  const duration = dayEnd - dayStart;

  function pctFromAbs(absMins) {
    return Math.max(0, Math.min(100, ((absMins - dayStart) / duration) * 100));
  }

  const t1Mins = toAbsoluteMinutes(trainingTime1, dayStart);
  const t2Mins = numSessions === 2
    ? toAbsoluteMinutes(trainingTime2, dayStart, { forceNextDay: scenario === 'late-to-early' })
    : null;
  const trainingMarkers = [
    { mins: t1Mins, time: trainingTime1, idx: 0, duration: clampSessionDuration(sessionDuration1Mins) },
    ...(t2Mins !== null ? [{ mins: t2Mins, time: trainingTime2, idx: 1, duration: clampSessionDuration(sessionDuration2Mins) }] : []),
  ].filter(marker => marker.mins >= dayStart && marker.mins <= dayEnd);

  // Build zone segments that cover the full bar.
  // Each meal "owns" a zone from its midpoint-to-prev to its midpoint-to-next.
  // Training sessions get inserted as hard zones.
  // Assign roles to each meal
  const roleByMealIndex = new Map(mealRolePlan.map(entry => [entry.mealIndex, entry]));
  const resolvedMealRoles = meals.map((_, i) => roleByMealIndex.get(i)?.role || 'midDay');
  const mealMins = meals.map((meal, i) => (
    roleByMealIndex.get(i)?.displayAbsMins
    ?? roleByMealIndex.get(i)?.absMins
    ?? toAbsoluteMinutes(meal.rawTime || meal.time, dayStart)
  ));

  // Build gradient stops from meal roles + training sessions.
  // Each meal contributes its role colour at its position.
  const stops = [];
  const forcePurple = scenario === 'late-to-early';

  // Start: first meal's colour at 0%
  stops.push({
    pos: 0,
    colour: forcePurple ? ROLE_GRADIENT.preSleep : (ROLE_GRADIENT[resolvedMealRoles[0]] || ROLE_GRADIENT.morning),
  });

  // Add each meal as a smooth stop
  meals.forEach((meal, i) => {
    const role = resolvedMealRoles[i];
    const colour = forcePurple ? ROLE_GRADIENT.preSleep : (ROLE_GRADIENT[role] || ROLE_GRADIENT.midDay);
    const pos = pctFromAbs(mealMins[i]);
    stops.push({ pos, colour });
  });

  // Always end in pre-sleep purple at 100%
  stops.push({ pos: 100, colour: ROLE_GRADIENT.preSleep });

  // Deduplicate and sort
  stops.sort((a, b) => a.pos - b.pos);
  const compactStops = stops.reduce((acc, stop) => {
    const prev = acc[acc.length - 1];
    if (!prev) {
      acc.push(stop);
      return acc;
    }
    // Merge nearly identical positions to avoid thin seam artifacts in the bar.
    if (Math.abs(stop.pos - prev.pos) < 0.2) {
      acc[acc.length - 1] = { ...prev, colour: stop.colour };
      return acc;
    }
    // Skip near-duplicate same-colour stops.
    if (stop.colour === prev.colour && Math.abs(stop.pos - prev.pos) < 1) {
      return acc;
    }
    acc.push(stop);
    return acc;
  }, []);
  const trainingBands = trainingMarkers.map(marker => {
    const start = pctFromAbs(marker.mins);
    const end = pctFromAbs(marker.mins + marker.duration);
    const left = Math.max(0, start - 2.2);
    const right = Math.min(100, end + 2.2);
    return {
      idx: marker.idx,
      time: marker.time,
      start,
      end,
      midpoint: (start + end) / 2,
      left,
      width: Math.max(0, right - left),
    };
  });
  const bgGradient = compactStops.length > 1
    ? `linear-gradient(to right, ${compactStops.map(s => `${s.colour} ${s.pos}%`).join(', ')})`
    : undefined;

  // Collect all marker positions for stagger logic
  const allMarkers = [
    ...meals.map((meal, i) => ({ pct: pctFromAbs(mealMins[i]), label: meal.time, type: 'meal', idx: i })),
    ...trainingBands.map(band => ({
      pct: band.midpoint,
      label: band.time,
      type: 'train',
      idx: band.idx,
    })),
  ].sort((a, b) => a.pct - b.pct);

  // Stagger: if two adjacent markers are < 8% apart, push the second label down
  const staggerMap = new Map();
  allMarkers.forEach((m, i) => {
    const key = `${m.type}-${m.idx}`;
    if (i > 0 && m.pct - allMarkers[i - 1].pct < 8) {
      staggerMap.set(key, true);
    }
  });

  return (
    <div className="relative w-full mb-6">
      {/* Wake / Sleep labels */}
      <div className="flex justify-between text-xs text-white font-medium mb-1">
        <span>☀️ {wakeTime}</span>
        <span>🌙 {sleepTime}</span>
      </div>
      {/* Base bar with gradient background */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{ background: bgGradient || 'rgba(55,65,81,0.5)', height: '1.75rem' }}
      >
        {/* Meal dots */}
        {meals.map((meal, i) => {
          const role = resolvedMealRoles[i];
          const s = ROLE_STYLES[role] || ROLE_STYLES.midDay;
          const mp = pctFromAbs(mealMins[i]);
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 z-10"
              style={{ left: `calc(${mp}% - 6px)` }}
            >
              <div className={`w-3 h-3 rounded-full border-2 ${s.dot}`} />
            </div>
          );
        })}
        {/* Training colour bands */}
        {trainingBands.map(band => (
          <div
            key={`train-band-${band.idx}`}
            className="absolute inset-y-0 z-[6] pointer-events-none"
            style={{
              left: `${band.left}%`,
              width: `${band.width}%`,
              background: 'linear-gradient(to right, rgba(239,68,68,0), rgba(239,68,68,0.35) 28%, rgba(239,68,68,0.62) 50%, rgba(239,68,68,0.35) 72%, rgba(239,68,68,0))',
              backgroundRepeat: 'no-repeat',
            }}
          />
        ))}
        {/* Training markers on bar */}
        {trainingBands.map(band => (
          <div
            key={`train-marker-${band.idx}`}
            className="absolute top-1/2 z-20"
            style={{ left: `${band.midpoint}%`, transform: 'translate(-50%, -50%)' }}
          >
            <span className="text-sm leading-none">🔥</span>
          </div>
        ))}
      </div>
      {/* Time labels below the bar */}
      <div className="relative" style={{ height: '1.75rem' }}>
        {meals.map((meal, i) => {
          const mp = pctFromAbs(mealMins[i]);
          const staggered = staggerMap.has(`meal-${i}`);
          return (
            <span
              key={`t-${i}`}
              className="absolute text-[10px] text-white font-medium whitespace-nowrap"
              style={{ left: `${mp}%`, transform: 'translateX(-50%)', top: staggered ? '12px' : '2px' }}
            >
              {meal.time}
            </span>
          );
        })}
        {trainingBands.map(band => (
          <span
            key={`train-label-${band.idx}`}
            className="absolute text-[10px] text-white font-bold whitespace-nowrap"
            style={{
              left: `${band.midpoint}%`,
              transform: 'translateX(-50%)',
              top: staggerMap.has(`train-${band.idx}`) ? '12px' : '2px',
            }}
          >
            {band.time}
          </span>
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 text-xs text-white">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded bg-amber-500/50" /> Pre-workout</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded bg-red-500/55" /> Training</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded bg-green-500/45" /> Post-workout</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded bg-blue-500/45" /> Morning</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded bg-slate-500/35" /> Mid-day</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded bg-purple-500/45" /> Pre-sleep</span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// ANNOTATED MEAL CARD
// -----------------------------------------------------------------------------
function MealCard({
  meal,
  role,
  annotation,
  isExpanded,
  onToggle,
  mealIndex,
  timeWindowLabel = null,
  windowRangeLabel = null,
  actualTimeLabel = null,
}) {
  const s = ROLE_STYLES[role] || ROLE_STYLES.midDay;
  const a = annotation;

  return (
    <Motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: mealIndex * 0.08 }}
      className="relative sm:pl-10"
    >
      {/* Timeline dot */}
      <div className={`absolute left-2 top-5 w-4 h-4 rounded-full border-2 hidden sm:flex items-center justify-center ${s.dot}`} />

      <div
        className={`rounded-xl border transition-all cursor-pointer ${s.border} ${s.bg}`}
        onClick={onToggle}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between p-4 gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-gray-400 text-sm shrink-0">
                <HiClock className="text-xs" />
                <span className="font-medium">{actualTimeLabel || meal.time}</span>
              </span>
              <span className="text-white font-semibold text-sm truncate">{meal.label}</span>
              {(meal.isPreTrain || meal.isPostTrain) && (
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  meal.isPreTrain ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'
                }`}>
                  <HiLightningBolt className="inline text-xs mr-0.5" />
                  {meal.gi}
                </span>
              )}
              {timeWindowLabel && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${s.border} ${s.text}`}>
                  {windowRangeLabel ? `${timeWindowLabel} - ${windowRangeLabel}` : timeWindowLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
                {a.focusLabel}
              </span>
              <span className={`text-xs ${s.text} truncate`}>{a.focusDetail}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-gray-400 font-medium">{meal.totals.calories} kcal</span>
            {isExpanded
              ? <HiChevronUp className="text-gray-500 shrink-0" />
              : <HiChevronDown className="text-gray-500 shrink-0" />}
          </div>
        </div>

        {/* Priority chips (always visible) */}
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {a.priorities.map((p, i) => (
            <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${s.border} ${s.text}`}>
              {p}
            </span>
          ))}
        </div>

        {/* Expanded detail */}
        <AnimatePresence>
          {isExpanded && (
            <Motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-dark-border/60 mx-4" />
              <div className="px-4 py-4 space-y-4">

                {/* Justification */}
                <div className="flex gap-2">
                  <HiInformationCircle className={`shrink-0 mt-0.5 ${s.text}`} />
                  <div>
                    <p className="text-xs font-semibold text-gray-300 mb-1">Scientific Rationale</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{a.justification}</p>
                  </div>
                </div>

                {/* Dos & Don'ts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-green-400 mb-1.5 flex items-center gap-1">
                      <HiCheckCircle /> Do This
                    </p>
                    <ul className="space-y-1">
                      {a.doItems.map((d, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                          <HiCheckCircle className="text-green-400 shrink-0 mt-0.5" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-1.5 flex items-center gap-1">
                      <HiXCircle /> Avoid
                    </p>
                    <ul className="space-y-1">
                      {a.dontItems.map((d, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                          <HiXCircle className="text-red-400 shrink-0 mt-0.5" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Example foods */}
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-1.5 flex items-center gap-1">
                    <HiStar /> Example Foods
                  </p>
                  {a.exampleFoodColumns ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {a.exampleFoodColumns.map((column, idx) => (
                        <div key={idx} className="rounded-lg border border-dark-border bg-dark/40 p-2.5">
                          <p className="text-[11px] font-semibold text-amber-300 mb-1.5">{column.title}</p>
                          <div className="space-y-1">
                            {column.items.map((item, itemIdx) => (
                              <p key={itemIdx} className="text-[11px] text-gray-300 leading-relaxed">- {item}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {a.exampleFoods.map((f, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-lg bg-dark-border text-gray-300">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Digestion timing */}
                <div className="flex gap-2 bg-dark-border/40 rounded-lg p-3">
                  <HiClock className="text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-300 mb-0.5">Digestion Timing</p>
                    <p className="text-xs text-gray-400">{a.digestNote}</p>
                  </div>
                </div>

                {/* Macros for this meal */}
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="text-blue-400">P: <strong>{meal.totals.protein}g</strong></span>
                  <span className="text-gold">C: <strong>{meal.totals.carbs}g</strong></span>
                  <span className="text-red-400">F: <strong>{meal.totals.fat}g</strong></span>
                  {meal.totals.fibre > 0 && <span className="text-green-400">Fi: <strong>{meal.totals.fibre}g</strong></span>}
                </div>

                {/* Source citation */}
                <p className="text-xs text-gray-600 italic border-t border-dark-border/40 pt-2">
                  Source: {a.source}
                </p>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </Motion.div>
  );
}

// -----------------------------------------------------------------------------
// TRAINING EVENT CARD
// -----------------------------------------------------------------------------
function TrainingEvent({ time, label }) {
  return (
    <Motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="relative sm:pl-10"
    >
      <div className="absolute left-0.5 top-3 w-5 h-5 rounded-full bg-red-500/30 border-2 border-red-500 hidden sm:flex items-center justify-center">
        <span className="text-[9px]">🔥</span>
      </div>
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-red-400 text-sm font-bold flex items-center gap-1">
            <HiFire /> {time}
          </span>
          <span className="text-white font-semibold text-sm">{label}</span>
        </div>
      </div>
    </Motion.div>
  );
}

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------
export default function MealTimingSection({ results }) {
  const [numSessions, setNumSessions] = useState(1);
  const [trainingTime2, setTrainingTime2] = useState('12:00');
  const [sessionDuration1Mins, setSessionDuration1Mins] = useState(60);
  const [sessionDuration2Mins, setSessionDuration2Mins] = useState(60);
  const [scenarioOverride, setScenarioOverride] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const hasMealPlan = Boolean(results?.mealPlan?.meals?.length);
  const mealPlan = results?.mealPlan;
  const mealPlanInputs = results?.mealPlanInputs || {};
  const goal = results?.goal || 'maintenance';
  const trainingTime1 = mealPlanInputs.trainingTime || '17:00';
  const wakeTime = mealPlanInputs.wakeTime || '07:00';
  const meals = mealPlan?.meals || [];
  const sleepTime = addMins(wakeTime, 16 * 60); // 16h after wake (8h sleep)
  const dayStartMins = parseMins(wakeTime);
  const dayEndMins = dayStartMins + (16 * 60);
  const scenarioContext = getScenarioContext(numSessions, trainingTime1, trainingTime2, sessionDuration1Mins);
  const autoScenario = scenarioContext.defaultScenario;
  const allowedScenarios = new Set(
    Object.entries(scenarioContext.validScenarios)
      .filter(([, isValid]) => isValid)
      .map(([scenarioKey]) => scenarioKey)
  );
  const scenario = (scenarioOverride && allowedScenarios.has(scenarioOverride))
    ? scenarioOverride
    : autoScenario;

  if (!hasMealPlan) return null;

  const t1Mins = toAbsoluteMinutes(trainingTime1, dayStartMins);
  const t2Mins = numSessions === 2
    ? toAbsoluteMinutes(trainingTime2, dayStartMins, { forceNextDay: scenario === 'late-to-early' })
    : null;
  const mealRolePlan = buildMealRolePlan({
    meals,
    wakeTime,
    trainingTime1,
    trainingTime2,
    numSessions,
    scenario,
    sessionDuration1Mins,
    sessionDuration2Mins,
  });
  const mealRoleByIndex = new Map(mealRolePlan.map(entry => [entry.mealIndex, entry]));
  const mealsBeforeSessionOne = mealRolePlan.filter(entry => entry.absMins < t1Mins).length;
  const showMealFlexibilityNote = mealsBeforeSessionOne >= 2;

  const handleNumSessionsChange = (n) => {
    setNumSessions(n);
    setScenarioOverride(null);
  };

  const handleTime2Change = (v) => {
    setTrainingTime2(v);
    setScenarioOverride(null);
  };

  const handleDuration1Change = (v) => {
    setSessionDuration1Mins(clampSessionDuration(v));
    setScenarioOverride(null);
  };

  const handleDuration2Change = (v) => {
    setSessionDuration2Mins(clampSessionDuration(v));
    setScenarioOverride(null);
  };

  const handleScenarioChange = (v) => setScenarioOverride(v);

  const meta = SCENARIO_META[scenario] || SCENARIO_META.single;
  const goalNarrative = {
    'fat-loss': 'Fat loss goal: keep peri-workout meals intact and pull most energy reductions from non-peri meals.',
    maintenance: 'Maintenance goal: keep peri-workout meals consistent and use non-peri meals to keep daily intake balanced.',
    'muscle-growth': 'Muscle growth goal: keep peri-workout meals high quality and add extra energy around non-peri meals.',
  }[goal] || 'Peri-workout meals stay consistent; non-peri meals are where daily intake is adjusted.';

  const trainingEvents = [
    {
      type: 'training',
      time: trainingTime1,
      label: numSessions === 2 ? 'Training - Session 1' : 'Training Session',
      sessionNum: 1,
      absMins: t1Mins,
    },
    ...(t2Mins !== null
      ? [{
        type: 'training',
        time: trainingTime2,
        label: 'Training - Session 2',
        sessionNum: 2,
        absMins: t2Mins,
      }]
      : []),
  ];

  const mealEvents = meals.map((meal, mealIndex) => {
    const rolePlan = mealRoleByIndex.get(mealIndex);
    return {
      type: 'meal',
      meal,
      mealIndex,
      absMins: rolePlan?.displayAbsMins ?? rolePlan?.absMins ?? toAbsoluteMinutes(meal.rawTime || meal.time, dayStartMins),
      role: rolePlan?.role ?? 'midDay',
      timeWindowLabel: rolePlan?.timeWindowLabel || null,
      windowRangeLabel: rolePlan?.windowRangeLabel || null,
      actualTimeLabel: rolePlan?.actualTimeLabel || meal.time,
    };
  });

  const inDayTimelineEvents = [...mealEvents, ...trainingEvents.filter(event => event.absMins <= dayEndMins)]
    .sort((a, b) => (
      (a.absMins - b.absMins) || (a.type === 'training' ? -1 : 1)
    ));

  const nextDayTrainingEvents = trainingEvents.filter(event => event.absMins > dayEndMins);

  const toggleExpand = (i) => setExpandedIndex(expandedIndex === i ? null : i);

  const colourMap = {
    amber: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    orange: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
    teal: 'text-teal-400 border-teal-500/40 bg-teal-500/10',
    purple: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
  };

  return (
    <Motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mt-8 bg-dark-card border border-dark-border rounded-xl overflow-hidden"
    >
      {/* Section Header */}
      <div className="bg-gradient-to-r from-dark-card via-dark to-dark-card px-6 py-5 border-b border-dark-border">
        <div className="flex items-center gap-3 mb-1">
          <HiSparkles className="text-gold text-lg" />
          <p className="text-gold text-xs font-semibold tracking-widest uppercase">Science-Backed</p>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Meal Timing Blueprint</h3>
        <p className="text-sm text-gray-400">
          Annotated daily nutrition strategy built on ISSN evidence. Each meal justified by its role in your training day.
        </p>
      </div>

      <div className="p-6 space-y-6">

        {/* -- Inputs ------------------------------------------ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Number of sessions */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium">Training sessions / day</label>
            <div className="flex gap-2">
              {[1, 2].map(n => (
                <button
                  key={n}
                  onClick={() => handleNumSessionsChange(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                    numSessions === n
                      ? 'bg-gold/20 border-gold/50 text-gold'
                      : 'bg-dark border-dark-border text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {n === 1 ? '1 session' : '2 sessions'}
                </button>
              ))}
            </div>
          </div>

          {/* Session 1 time (from main plan) */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium">Session 1 time</label>
            <div className="flex items-center gap-2 bg-dark border border-dark-border rounded-lg px-3 py-2">
              <HiClock className="text-gray-500 text-sm shrink-0" />
              <span className="text-white text-sm font-medium">{trainingTime1}</span>
              <span className="text-gray-600 text-xs ml-auto">(from your plan)</span>
            </div>
          </div>

          {/* Session 2 time */}
          <div className={numSessions === 1 ? 'opacity-40 pointer-events-none' : ''}>
            <label className="block text-xs text-gray-400 mb-2 font-medium">Session 2 time</label>
            <div className="flex items-center gap-2 bg-dark border border-dark-border rounded-lg px-3 py-2">
              <HiClock className="text-gray-500 text-sm shrink-0" />
              <input
                type="time"
                value={trainingTime2}
                onChange={e => handleTime2Change(e.target.value)}
                className="bg-transparent text-white text-sm font-medium w-full outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium">Session 1 duration (min)</label>
            <div className="flex items-center gap-2 bg-dark border border-dark-border rounded-lg px-3 py-2">
              <HiClock className="text-gray-500 text-sm shrink-0" />
              <input
                type="number"
                min={30}
                max={240}
                step={5}
                value={sessionDuration1Mins}
                onChange={e => handleDuration1Change(e.target.value)}
                className="bg-transparent text-white text-sm font-medium w-full outline-none"
              />
              <span className="text-gray-600 text-xs shrink-0">min</span>
            </div>
          </div>

          <div className={numSessions === 1 ? 'opacity-40 pointer-events-none' : ''}>
            <label className="block text-xs text-gray-400 mb-2 font-medium">Session 2 duration (min)</label>
            <div className="flex items-center gap-2 bg-dark border border-dark-border rounded-lg px-3 py-2">
              <HiClock className="text-gray-500 text-sm shrink-0" />
              <input
                type="number"
                min={30}
                max={240}
                step={5}
                value={sessionDuration2Mins}
                onChange={e => handleDuration2Change(e.target.value)}
                className="bg-transparent text-white text-sm font-medium w-full outline-none"
              />
              <span className="text-gray-600 text-xs shrink-0">min</span>
            </div>
          </div>
        </div>

        {/* Scenario selector */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 font-medium">Training Scenario</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(SCENARIO_META).map(([key, s]) => (
                <button
                  key={key}
                  onClick={() => handleScenarioChange(key)}
                  disabled={!scenarioContext.validScenarios[key]}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    scenario === key
                      ? 'border-gold/50 bg-gold/10 text-white'
                      : 'border-dark-border bg-dark text-gray-400 hover:border-gray-500'
                  } ${
                    !scenarioContext.validScenarios[key]
                      ? 'opacity-30 cursor-not-allowed'
                      : ''
                  }`}
                >
                <span className="text-base">{s.emoji}</span>
                <span className="text-xs font-medium leading-tight">{s.label}</span>
                {scenario === key && (
                  <HiCheckCircle className="text-gold ml-auto shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* -- Scenario Summary Card --------------------------- */}
        <Motion.div
          key={scenario}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`rounded-xl border p-4 ${colourMap[meta.colour] || colourMap.amber}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{meta.emoji}</span>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm mb-0.5">{meta.label}</h4>
              <p className="text-xs text-gray-300 mb-3">{meta.tagline}</p>
              {meta.warning && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 mb-3">
                  <span className="text-red-400 text-xs shrink-0 mt-0.5">⚠️</span>
                  <p className="text-xs text-red-300">{meta.warning}</p>
                </div>
              )}
              <div className="space-y-1">
                {meta.principles.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <HiCheckCircle className="text-green-400 shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
              {meta.exampleColumns && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {meta.exampleColumns.map((column, idx) => (
                    <div key={idx} className="rounded-lg border border-dark-border bg-dark/40 p-2.5">
                      <p className="text-[11px] font-semibold text-amber-300 mb-1.5">{column.title}</p>
                      <div className="space-y-1">
                        {column.items.map((item, itemIdx) => (
                          <p key={itemIdx} className="text-[11px] text-gray-300 leading-relaxed">- {item}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Motion.div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 p-3.5 space-y-2">
          <p className="text-xs font-semibold text-blue-300">Practical Timing Notes</p>
          {showMealFlexibilityNote && (
            <p className="text-xs text-gray-300 leading-relaxed">
              You have multiple meals before training. Feel free to move non-peri meals around for convenience and appetite as long as peri-workout meals stay anchored.
            </p>
          )}
          <p className="text-xs text-gray-300 leading-relaxed">
            For simplicity, this calculator distributes intake evenly across meals first, then prioritises peri-workout placement.
          </p>
          <p className="text-xs text-gray-300 leading-relaxed">
            {goalNarrative}
          </p>
        </div>

        {/* -- Day Bar ------------------------------------------ */}
        <DayBar
          wakeTime={wakeTime}
          sleepTime={sleepTime}
          trainingTime1={trainingTime1}
          trainingTime2={numSessions === 2 ? trainingTime2 : null}
          numSessions={numSessions}
          meals={meals}
          scenario={scenario}
          mealRolePlan={mealRolePlan}
          sessionDuration1Mins={sessionDuration1Mins}
          sessionDuration2Mins={sessionDuration2Mins}
        />

        {/* -- Expand All / Collapse All ----------------------- */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-semibold text-sm">Annotated Day Timeline</h4>
            <p className="text-xs text-gray-500">Click any meal to reveal full nutrition strategy</p>
          </div>
          <button
            onClick={() => setExpandedIndex(expandedIndex !== null ? null : 0)}
            className="text-xs text-gray-400 hover:text-white border border-dark-border rounded-lg px-3 py-1.5 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <HiRefresh className="text-xs" /> {expandedIndex !== null ? 'Collapse' : 'Expand first'}
          </button>
        </div>

        {/* -- Timeline ---------------------------------------- */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-dark-border hidden sm:block" />

          {/* Wake event */}
          <div className="relative sm:pl-10 mb-4">
            <div className="absolute left-1 top-2.5 w-6 h-6 rounded-full bg-yellow-500/20 border-2 border-yellow-500/60 hidden sm:flex items-center justify-center">
              <HiSun className="text-yellow-400 text-xs" />
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
              <span className="text-yellow-400 font-bold text-sm">☀️ {wakeTime}</span>
              <span className="text-gray-300 text-sm">Wake Up</span>
              <span className="text-xs text-gray-500 ml-auto">Rehydrate first - 300-500 ml water</span>
            </div>
          </div>

          <div className="space-y-3">
            {inDayTimelineEvents.map((event, ei) => {
              if (event.type === 'training') {
                return (
                  <TrainingEvent
                    key={`train-${ei}`}
                    time={event.time}
                    label={event.label}
                  />
                );
              }

              const { meal, mealIndex } = event;
              const role = event.role;
              const annotation = ANNOTATIONS[role] || ANNOTATIONS.midDay;

              return (
                <MealCard
                  key={`meal-${mealIndex}`}
                  meal={meal}
                  role={role}
                  annotation={annotation}
                  isExpanded={expandedIndex === mealIndex}
                  onToggle={() => toggleExpand(mealIndex)}
                  mealIndex={mealIndex}
                  timeWindowLabel={event.timeWindowLabel}
                  windowRangeLabel={event.windowRangeLabel}
                  actualTimeLabel={event.actualTimeLabel}
                />
              );
            })}
          </div>

          {/* Sleep event */}
          <div className="relative sm:pl-10 mt-4">
            <div className="absolute left-1 top-2.5 w-6 h-6 rounded-full bg-purple-500/20 border-2 border-purple-500/60 hidden sm:flex items-center justify-center">
              <HiMoon className="text-purple-400 text-xs" />
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-purple-500/20 bg-purple-500/5">
              <span className="text-purple-400 font-bold text-sm">🌙 {sleepTime}</span>
              <span className="text-gray-300 text-sm">Sleep</span>
              <span className="text-xs text-gray-500 ml-auto">
                {scenario === 'late-to-early' ? '⚠️ Early session tomorrow - pre-sleep nutrition critical' : 'Overnight recovery begins'}
              </span>
            </div>
          </div>

          {nextDayTrainingEvents.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 ml-1">Next Day</p>
              {nextDayTrainingEvents.map((event, ei) => (
                <TrainingEvent
                  key={`next-day-train-${ei}`}
                  time={`${event.time} (+1 day)`}
                  label={event.label}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-600 border-t border-dark-border/40 pt-4">
          Guidance based on Kerksick et al. (2017) ISSN Position Stand: Nutrient Timing, J Int Soc Sports Nutr 14:33. All timing recommendations reflect research on healthy, trained adults. Individual tolerance varies - adjust based on personal GI response and schedule constraints.
        </p>
      </div>
    </Motion.section>
  );
}
