import React from "react";
import { Eye, Heart, Music4, TrendingUp } from "lucide-react";
import { COLORS, TYPE, cardStyle } from "../theme/tokens";
import PageShell from "./PageShell";

export default function ArtistDashboard({ onBack, tracks, user }) {
  const myTracks = (tracks || []).filter((t) => t.artistUid === user?.uid);

  const totalViews = myTracks.reduce((sum, t) => sum + (t.viewsCount || 0), 0);
  const totalLikes = myTracks.reduce((sum, t) => sum + (t.likesCount || 0), 0);
  const trackCount = myTracks.length;
  const avgLikeRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : "0.0";

  const topTracks = [...myTracks]
    .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
    .slice(0, 5);

  const STATS = [
    { icon: Eye, label: "Total views", value: totalViews.toLocaleString() },
    { icon: Heart, label: "Total likes", value: totalLikes.toLocaleString() },
    { icon: Music4, label: "Tracks published", value: trackCount },
    { icon: TrendingUp, label: "Like rate", value: `${avgLikeRate}%` },
  ];

  return (
    <PageShell
      onBack={onBack}
      eyebrow="Artist dashboard"
      title="Your catalog at a glance"
      subtitle="Real numbers from your published tracks — views count each time someone opens the player, likes update live."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ ...cardStyle, padding: 16 }}>
            <s.icon size={16} color={COLORS.primary} style={{ marginBottom: 10 }} />
            <div style={{ fontFamily: TYPE.display, fontSize: 22, color: COLORS.textPrimary }}>{s.value}</div>
            <div style={{ fontFamily: TYPE.body, fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: TYPE.display, fontSize: 18, color: COLORS.textPrimary, marginBottom: 12 }}>
        Top tracks
      </div>

      {trackCount === 0 ? (
        <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
          <Music4 size={22} color={COLORS.textFaint} style={{ marginBottom: 10 }} />
          <p style={{ color: COLORS.textMuted, fontFamily: TYPE.body, fontSize: 13, margin: 0 }}>
            Publish a track to start seeing real analytics here.
          </p>
        </div>
      ) : (
        <div style={cardStyle}>
          {topTracks.map((t, i) => (
            <div
              key={t.id}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px",
                borderBottom: i < topTracks.length - 1 ? `1px solid ${COLORS.border}` : "none",
              }}
            >
              <span style={{ fontFamily: TYPE.body, fontSize: 14, color: COLORS.textPrimary }}>{t.title}</span>
              <span style={{ fontFamily: TYPE.body, fontSize: 13, color: COLORS.textMuted, display: "flex", gap: 12 }}>
                <span>{(t.viewsCount || 0).toLocaleString()} views</span>
                <span>{(t.likesCount || 0).toLocaleString()} likes</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
