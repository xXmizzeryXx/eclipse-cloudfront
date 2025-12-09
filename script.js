

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyB7w-f3_tw0FAOJ3BIxgJduCU3gXkyQ_J0",
  authDomain: "eclipse-323423.firebaseapp.com",
  projectId: "eclipse-323423",
  storageBucket: "eclipse-323423.firebasestorage.app",
  messagingSenderId: "164045623784",
  appId: "1:164045623784:web:c079f81ad41d75787c145d"
};

let app, db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  showError('Failed to initialize Firebase');
}

function getDateKeys() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const daily = `${year}-${month}-${day}`;
  const monthly = `${year}-${month}`;
  
  console.log('📅 Date keys:', { daily, monthly });
  return { daily, monthly };
}

function showError(message) {
  const errorEl = document.getElementById('statsError');
  const statValues = document.querySelectorAll('.stat-value');
  
  if (errorEl) {
    errorEl.textContent = `⚠️ ${message}`;
    errorEl.style.display = 'block';
  }
  
  statValues.forEach(el => {
    el.textContent = '—';
    el.classList.remove('loading');
  });
}

function hasVisitedToday() {
  const { daily } = getDateKeys();
  const lastVisit = localStorage.getItem('eclipse_last_visit');
  const visited = lastVisit === daily;
  console.log('🔍 Has visited today?', visited, '| Last visit:', lastVisit, '| Today:', daily);
  return visited;
}

function markVisitedToday() {
  const { daily } = getDateKeys();
  localStorage.setItem('eclipse_last_visit', daily);
  console.log('✅ Marked visited for:', daily);
}

async function trackVisit() {
  if (!db) {
    console.error('❌ Database not initialized');
    showError('Database not initialized');
    return;
  }

  try {
    
    if (hasVisitedToday()) {
      console.log('ℹ️ Already visited today, just fetching stats...');
      await fetchStats();
      return;
    }

    console.log('🆕 New visit detected, tracking...');
    const { daily, monthly } = getDateKeys();

    
    console.log('📊 Updating daily stats...');
    const dailyRef = doc(db, 'stats', `daily_${daily}`);
    const dailyDoc = await getDoc(dailyRef);
    
    if (dailyDoc.exists()) {
      console.log('📈 Daily doc exists, incrementing. Current:', dailyDoc.data().count);
      await updateDoc(dailyRef, { 
        count: increment(1),
        lastUpdated: new Date().toISOString()
      });
    } else {
      console.log('📝 Creating new daily doc');
      await setDoc(dailyRef, { 
        count: 1, 
        date: daily,
        created: new Date().toISOString()
      });
    }

    
    console.log('📊 Updating monthly stats...');
    const monthlyRef = doc(db, 'stats', `monthly_${monthly}`);
    const monthlyDoc = await getDoc(monthlyRef);
    
    if (monthlyDoc.exists()) {
      console.log('📈 Monthly doc exists, incrementing. Current:', monthlyDoc.data().count);
      await updateDoc(monthlyRef, { 
        count: increment(1),
        lastUpdated: new Date().toISOString()
      });
    } else {
      console.log('📝 Creating new monthly doc');
      await setDoc(monthlyRef, { 
        count: 1, 
        month: monthly,
        created: new Date().toISOString()
      });
    }

    
    console.log('📊 Updating all-time stats...');
    const allTimeRef = doc(db, 'stats', 'all_time');
    const allTimeDoc = await getDoc(allTimeRef);
    
    if (allTimeDoc.exists()) {
      console.log('📈 All-time doc exists, incrementing. Current:', allTimeDoc.data().count);
      await updateDoc(allTimeRef, { 
        count: increment(1),
        lastUpdated: new Date().toISOString()
      });
    } else {
      console.log('📝 Creating new all-time doc');
      await setDoc(allTimeRef, { 
        count: 1,
        created: new Date().toISOString()
      });
    }

    
    markVisitedToday();
    console.log('✅ Visit tracked successfully!');
    
    
    await fetchStats();
    
  } catch (err) {
    console.error('❌ Error tracking visit:', err);
    console.error('Error details:', err.code, err.message);
    showError(`Error: ${err.message}`);
  }
}

async function fetchStats() {
  if (!db) return;

  try {
    console.log('📥 Fetching stats...');
    const { daily, monthly } = getDateKeys();
    
    const [dailyDoc, monthlyDoc, allTimeDoc] = await Promise.all([
      getDoc(doc(db, 'stats', `daily_${daily}`)),
      getDoc(doc(db, 'stats', `monthly_${monthly}`)),
      getDoc(doc(db, 'stats', 'all_time'))
    ]);

    
    const dailyStat = dailyDoc.exists() ? dailyDoc.data().count : 0;
    const monthlyStat = monthlyDoc.exists() ? monthlyDoc.data().count : 0;
    const allTimeStat = allTimeDoc.exists() ? allTimeDoc.data().count : 0;

    console.log('📊 Stats fetched:', { daily: dailyStat, monthly: monthlyStat, allTime: allTimeStat });

    
    document.getElementById('dailyStat').textContent = dailyStat.toLocaleString();
    document.getElementById('monthlyStat').textContent = monthlyStat.toLocaleString();
    document.getElementById('allTimeStat').textContent = allTimeStat.toLocaleString();
    
    
    document.querySelectorAll('.stat-value').forEach(el => {
      el.classList.remove('loading');
    });
    
  } catch (err) {
    console.error('❌ Error fetching stats:', err);
    showError(`Error loading stats: ${err.message}`);
  }
}


window.resetVisitTracking = function() {
  localStorage.removeItem('eclipse_last_visit');
  console.log('🔄 Visit tracking reset! Refresh the page to track a new visit.');
  alert('Visit tracking reset! Refresh the page to track a new visit.');
};

window.forceTrackVisit = async function() {
  localStorage.removeItem('eclipse_last_visit');
  await trackVisit();
};

window.showCurrentStats = fetchStats;


console.log('🚀 Initializing visitor stats...');
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', trackVisit);
} else {
  trackVisit();
}