import { Link } from "@tanstack/react-router";
import { Star, MapPin, Briefcase } from "lucide-react";
import { formatNaira } from "@/lib/format";

export interface ArtisanCardData {
  id: string;
  full_name: string;
  avatar_url: string | null;
  category_slug: string;
  bio: string | null;
  hourly_rate: number;
  years_experience: number;
  rating: number;
  completed_jobs: number;
  available: boolean;
  location: string | null;
  skills: string[] | null;
  verified: boolean;
}

export function ArtisanCard({ a }: { a: ArtisanCardData }) {
  return (
    <Link
      to="/browse/$id"
      params={{ id: a.id }}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 hover:border-[#0F172A] hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-3">
        <img
          src={a.avatar_url ?? `https://i.pravatar.cc/200?u=${a.id}`}
          alt={a.full_name}
          className="h-14 w-14 shrink-0 rounded-xl object-cover bg-slate-100"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-bold text-[#0F172A]">{a.full_name}</h3>
            {a.verified && (
              <span className="shrink-0 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                ✓
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 capitalize">{a.category_slug}</p>
          <div className="mt-1 flex items-center gap-1 text-xs">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{Number(a.rating).toFixed(1)}</span>
            <span className="text-slate-400">· {a.completed_jobs} jobs</span>
          </div>
        </div>
      </div>

      {a.bio && <p className="mt-3 text-sm text-slate-600 line-clamp-2">{a.bio}</p>}

      {a.skills && a.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {a.skills.slice(0, 3).map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{a.location ?? "Redemption City"}</span>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-[#0F172A]">{formatNaira(a.hourly_rate)}</div>
          <div className="text-[10px] text-slate-400">/ hour</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={
            "text-xs font-semibold px-2 py-1 rounded-full " +
            (a.available ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")
          }
        >
          {a.available ? "Available" : "Busy"}
        </span>
        <Briefcase className="h-3 w-3 text-slate-400" />
        <span className="text-xs text-slate-500">{a.years_experience}y exp</span>
      </div>
    </Link>
  );
}