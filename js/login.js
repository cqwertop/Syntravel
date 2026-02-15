window.AUTH_API_CONFIG = {
  baseUrl: "",
  endpoint: "/auth/login",
  clientId: "insert client id"
};

/*
  FIREBASE LOGIN TEMPLATE
  1) Paste your Firebase config values below.
  2) Keep useFirebaseAuth = true.
  3) This file will use Firebase Auth first. If disabled, it falls back to API login.
*/
const FIREBASE_LOGIN_CONFIG = {
  useFirebaseAuth: true,
  firebaseConfig: {
    apiKey: "AIzaSyAxD_zh9NGF_CdxyW4r3rtW-SOXDEKbv14",
    authDomain: "syntravel-3f133.firebaseapp.com",
    projectId: "syntravel-3f133",
    storageBucket: "syntravel-3f133.firebasestorage.app",
    messagingSenderId: "107932772280",
    appId: "1:107932772280:web:d0a302f917cc1d3d60514d",
    measurementId: "G-6EWZP1WL1N"
  }
};

async function setupFirebaseLogin() {
  if (!FIREBASE_LOGIN_CONFIG.useFirebaseAuth) {
    return;
  }

  const cfg = FIREBASE_LOGIN_CONFIG.firebaseConfig;
  if (!cfg.apiKey || cfg.apiKey.startsWith("paste ")) {
    throw new Error("Firebase config is not filled. Paste your firebaseConfig values in js/login.js.");
  }

  const appModule = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js");
  const authModule = await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js");

  const app = appModule.initializeApp(cfg);
  const auth = authModule.getAuth(app);

  window.firebaseLogin = async ({ email, password, rememberMe }) => {
    await authModule.setPersistence(
      auth,
      rememberMe ? authModule.browserLocalPersistence : authModule.browserSessionPersistence
    );

    const credential = await authModule.signInWithEmailAndPassword(auth, email, password);
    const token = await credential.user.getIdToken();

    return {
      token,
      user: {
        uid: credential.user.uid,
        email: credential.user.email || email
      }
    };
  };

  // Google sign-in helper exposed to the rest of the app.
  window.googleSignIn = async ({ rememberMe } = {}) => {
    await authModule.setPersistence(
      auth,
      rememberMe ? authModule.browserLocalPersistence : authModule.browserSessionPersistence
    );

    const provider = new authModule.GoogleAuthProvider();
    const result = await authModule.signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();

    return {
      token,
      user: {
        uid: result.user.uid,
        email: result.user.email
      }
    };
  };
}

const loginForm = document.getElementById("loginForm");
const loginSubmit = document.getElementById("loginSubmit");
const loginStatus = document.getElementById("loginStatus");
const googleBtn = document.getElementById("googleSignIn");
const redirectUrl = new URLSearchParams(window.location.search).get("redirect") || "index.html";

if (googleBtn) googleBtn.disabled = true;

bootstrap();

async function bootstrap() {
  try {
    await setupFirebaseLogin();
    if (googleBtn) googleBtn.disabled = false;
  } catch (error) {
    loginStatus.textContent = error.message || "Firebase setup failed. API login fallback is still available.";
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = loginForm.elements.email.value.trim();
  const password = loginForm.elements.password.value;
  const rememberMe = loginForm.elements.rememberMe.checked;

  loginSubmit.disabled = true;
  loginStatus.textContent = "Signing you in...";

  try {
    const data = await login({ email, password, rememberMe });
    const token = data.token || data.accessToken || data.jwt || "";
    const user = data.user || { email };

    if (!token) {
      throw new Error("Login succeeded but no token was returned.");
    }

    localStorage.setItem("authToken", token);
    localStorage.setItem("authUser", JSON.stringify(user));
    localStorage.setItem("authLoggedIn", "true");

    if (!rememberMe) {
      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("authUser", JSON.stringify(user));
    }

    loginStatus.textContent = "Login successful. Redirecting...";
    window.location.href = redirectUrl;
  } catch (error) {
    loginStatus.textContent = error.message || "Unable to login right now.";
  } finally {
    loginSubmit.disabled = false;
  }
});

if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    const rememberMe = loginForm.elements.rememberMe.checked;

    loginSubmit.disabled = true;
    googleBtn.disabled = true;
    loginStatus.textContent = "Signing in with Google...";

    try {
      if (typeof window.googleSignIn !== "function") {
        throw new Error("Google sign-in is not available. Check Firebase configuration.");
      }

      const data = await window.googleSignIn({ rememberMe });
      const token = data.token || data.accessToken || data.jwt || "";
      const user = data.user || {};

      if (!token) {
        throw new Error("Login succeeded but no token was returned.");
      }

      localStorage.setItem("authToken", token);
      localStorage.setItem("authUser", JSON.stringify(user));
      localStorage.setItem("authLoggedIn", "true");

      if (!rememberMe) {
        sessionStorage.setItem("authToken", token);
        sessionStorage.setItem("authUser", JSON.stringify(user));
      }

      loginStatus.textContent = "Login successful. Redirecting...";
      window.location.href = redirectUrl;
    } catch (error) {
      loginStatus.textContent = error.message || "Unable to sign in with Google.";
    } finally {
      loginSubmit.disabled = false;
      if (googleBtn) googleBtn.disabled = false;
    }
  });
}

async function login(payload) {
  if (typeof window.firebaseLogin === "function") {
    return window.firebaseLogin(payload);
  }

  return loginWithApi(payload);
}

async function loginWithApi(payload) {
  const config = getAuthConfig();

  if (!config.baseUrl) {
    throw new Error("Auth is not configured yet. Paste Firebase config or set auth URL.");
  }

  const url = `${config.baseUrl}${config.endpoint}`;
  const headers = {
    "Content-Type": "application/json"
  };

  if (config.clientId && config.clientId !== "insert client id") {
    headers["x-client-id"] = config.clientId;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: payload.email,
      password: payload.password
    })
  });

  if (!response.ok) {
    const errorText = await safeText(response);
    throw new Error(errorText || "Login failed. Check credentials and try again.");
  }

  return response.json();
}

function getAuthConfig() {
  const fromWindow = window.AUTH_API_CONFIG || {};
  const fromStorage = {
    baseUrl: localStorage.getItem("authApiBase") || "",
    endpoint: localStorage.getItem("authApiEndpoint") || "/auth/login",
    clientId: localStorage.getItem("authClientId") || "insert client id"
  };

  return {
    baseUrl: fromWindow.baseUrl || fromStorage.baseUrl,
    endpoint: fromWindow.endpoint || fromStorage.endpoint,
    clientId: fromWindow.clientId || fromStorage.clientId
  };
}

async function safeText(response) {
  try {
    return (await response.text()).slice(0, 220);
  } catch {
    return "";
  }
}

