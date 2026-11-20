/**
 * Fixora Firebase Bridge & Authentication
 * Project: foxora-3f2b3
 */

const firebaseConfig = {
  apiKey: "AIzaSyAJz9UQo-tZi4-N98PCqeapIuLTKMbHZg0",
  authDomain: "foxora-3f2b3.firebaseapp.com",
  projectId: "foxora-3f2b3",
  storageBucket: "foxora-3f2b3.firebasestorage.app",
  messagingSenderId: "799793359040",
  appId: "1:799793359040:web:10f218a27fa0e4c7fee525",
  measurementId: "G-XVCWME6J0R"
};

// Initialize Firebase App
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

try {
  if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore ? firebase.firestore() : null;
    try {
      if (firebase.analytics) firebase.analytics();
    } catch (e) {
      // Analytics measurement is optional
    }
  } else if (typeof firebase !== "undefined" && firebase.apps.length) {
    firebaseApp = firebase.app();
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore ? firebase.firestore() : null;
  }
} catch (err) {
  console.warn("Firebase initialization note:", err);
}

window.FirebaseBridge = {
  isReady() {
    return typeof firebase !== "undefined" && !!firebaseAuth;
  },

  getAuth() {
    return firebaseAuth;
  },

  getDb() {
    return firebaseDb;
  },

  async register(name, email, password, role = "user") {
    if (!this.isReady()) {
      throw new Error("Firebase SDK is not available");
    }

    const cred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;

    // Update display name
    try {
      await user.updateProfile({ displayName: name });
    } catch (e) {
      console.warn("Display name update:", e);
    }

    // Save profile to Firestore
    if (firebaseDb) {
      try {
        await firebaseDb.collection("users").doc(user.uid).set({
          uid: user.uid,
          full_name: name,
          email: email,
          role: role,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore user sync:", err);
      }
    }

    return {
      id: user.uid,
      uid: user.uid,
      email: user.email,
      full_name: name,
      role: role
    };
  },

  async login(email, password) {
    if (!this.isReady()) {
      throw new Error("Firebase SDK is not available");
    }

    const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
    const user = cred.user;

    let role = "user";
    let fullName = user.displayName || email.split("@")[0];

    if (firebaseDb) {
      try {
        const doc = await firebaseDb.collection("users").doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data();
          if (data.role) role = data.role;
          if (data.full_name) fullName = data.full_name;
        }
      } catch (err) {
        console.warn("Firestore profile read:", err);
      }
    }

    return {
      id: user.uid,
      uid: user.uid,
      email: user.email,
      full_name: fullName,
      role: role
    };
  },

  async signInWithGoogle() {
    if (!this.isReady()) {
      throw new Error("Firebase SDK is not available");
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await firebaseAuth.signInWithPopup(provider);
    const user = result.user;

    let role = "user";
    let fullName = user.displayName || user.email.split("@")[0];

    if (firebaseDb) {
      try {
        const docRef = firebaseDb.collection("users").doc(user.uid);
        const doc = await docRef.get();
        if (doc.exists) {
          const data = doc.data();
          if (data.role) role = data.role;
        } else {
          await docRef.set({
            uid: user.uid,
            full_name: fullName,
            email: user.email,
            photoURL: user.photoURL,
            role: "user",
            created_at: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (err) {
        console.warn("Firestore Google user sync:", err);
      }
    }

    return {
      id: user.uid,
      uid: user.uid,
      email: user.email,
      full_name: fullName,
      role: role,
      photoURL: user.photoURL
    };
  },

  async signOut() {
    if (this.isReady()) {
      await firebaseAuth.signOut();
    }
  }
};
