import Link from "next/link";

const team = [
  { name: "Photo", color: "bg-photo" },
  { name: "Video", color: "bg-video" },
  { name: "Audio", color: "bg-audio" },
  { name: "Code", color: "bg-code" },
  { name: "Blog", color: "bg-blog" },
  { name: "Website", color: "bg-website" },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-iris flex items-center justify-center mx-auto mb-6 rotate-3">
          <span className="text-2xl">👑</span>
        </div>
        <h1 className="font-display font-700 text-4xl leading-tight mb-3">
          CEO Agent
        </h1>
        <p className="text-slate mb-8">
          Ek bolo, poori team lag jaati hai kaam pe.
        </p>

        <div className="flex justify-center gap-2 mb-10">
          {team.map((t) => (
            <div
              key={t.name}
              className={`w-9 h-9 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-semibold shadow-sm`}
              title={t.name}
            >
              {t.name[0]}
            </div>
          ))}
        </div>

        <Link
          href="/admin"
          className="inline-block px-8 py-3.5 bg-iris text-white rounded-full font-display font-600 text-sm hover:brightness-110 transition-all shadow-sm shadow-iris/30"
        >
          Chalo shuru karein →
        </Link>
      </div>
    </main>
  );
}
