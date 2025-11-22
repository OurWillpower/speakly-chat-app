function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-emeralddark text-white p-6">
      <div className="w-full max-w-md bg-emeralddark border border-goldsoft rounded-2xl p-8 shadow-goldglow text-center">
        <h1 className="text-3xl font-bold text-goldsoft mb-4">
          Speakly Chat
        </h1>

        <p className="text-lg mb-6 text-goldsoft">
          The AI-Powered, Encrypted, Multilingual Messenger
        </p>

        <button className="w-full bg-goldsoft text-emeralddark font-bold py-3 rounded-xl shadow-goldglow hover:opacity-90 transition">
          Login to Continue
        </button>

        <p className="mt-6 text-sm opacity-75">
          Phase 1 UI Ready • Login Coming in Phase 2
        </p>
      </div>
    </div>
  );
}

export default App;
