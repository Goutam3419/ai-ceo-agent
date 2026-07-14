import PublicChatWidget from "@/components/PublicChatWidget";

export default function PublicSite() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-5 rotate-3 shadow-xl shadow-indigo-500/30">
          <span className="text-2xl">🌐</span>
        </div>
        <h1 className="font-bold text-2xl mb-2 text-gray-900">
          Website taiyar ho rahi hai
        </h1>
        <p className="text-gray-500 text-sm">
          Admin panel se CEO Agent ko bolo — jaisे &quot;homepage bana do&quot; —
          aur ye page usी se ban jaayega.
        </p>
      </div>
      <PublicChatWidget />
    </main>
  );
}
