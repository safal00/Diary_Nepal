import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

const firebaseConfig = {

    apiKey: "AIzaSyC9wzP2mnLuRscD-VHCFeflV7PyvkAJ-nQ",

    authDomain: "diarynepal01.firebaseapp.com",

    projectId: "diarynepal01",

    storageBucket: "diarynepal01.firebasestorage.app",

    messagingSenderId: "736076742017",

    appId: "1:736076742017:web:441f4539433aaf231f7c80",

    measurementId: "G-8JW8PH6896"

};

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);

const db = getFirestore(app);

const auth = getAuth(app);

const storage = getStorage(app);

export {
    app,
    analytics,
    db,
    auth,
    storage
};
