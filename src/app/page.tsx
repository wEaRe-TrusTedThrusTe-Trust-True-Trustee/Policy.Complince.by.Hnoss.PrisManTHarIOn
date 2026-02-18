'use client';

import React from 'react';
import { useSystemStatus } from '@/context/SystemStatusContext';
import { useSafeMode } from '@/hooks/useSafeMode';
import { DancingText } from '@/components/DancingText';
import { GlowCard } from '@/components/GlowCard';
import { SystemHeartbeat } from '@/components/SystemHeartbeat';
import LogDashboard from '@/components/LogDashboard';
import MetricDisplay from '@/components/MetricDisplay';
import { Shield, Activity, Database, Users, FileText, AlertTriangle, Sparkles, Zap, Scale, Mail, Globe, Star } from 'lucide-react';

export default function HomePage() {
  const { metrics, systemHealth, logs } = useSystemStatus();
  const { isSafeMode, reason: safeModeReason } = useSafeMode();

  const getFrameColor = () => {
    if (isSafeMode) return 'ice-blue';
    if (systemHealth === 'critical') return 'red';
    if (systemHealth === 'degraded') return 'orange';
    return 'metallic';
  };

  const frameColor = getFrameColor();

  return (
    <div className="min-h-screen relative">
      <SystemHeartbeat intensity={metrics.cpu / 100} />

      <div 
        className={`fixed inset-0 pointer-events-none z-10 frame-${frameColor}`}
        style={{
          border: '20px solid transparent',
          borderImage: frameColor === 'metallic' 
            ? 'var(--metallic-gradient) 1' 
            : frameColor === 'ice-blue'
            ? 'linear-gradient(135deg, #00BFFF, #87CEEB, #B0E0E6, #00BFFF) 1'
            : frameColor === 'red'
            ? 'linear-gradient(135deg, #FF0000, #8B0000, #FF4500, #FF0000) 1'
            : 'linear-gradient(135deg, #FFA500, #FF8C00, #FFD700, #FFA500) 1',
          boxShadow: isSafeMode 
            ? '0 0 60px rgba(0, 191, 255, 0.8), inset 0 0 60px rgba(0, 191, 255, 0.4)'
            : systemHealth === 'critical'
            ? '0 0 60px rgba(255, 0, 0, 0.8), inset 0 0 60px rgba(255, 0, 0, 0.4)'
            : '0 0 40px rgba(255, 215, 0, 0.6), inset 0 0 40px rgba(192, 192, 192, 0.3)',
          animation: isSafeMode 
            ? 'ice-pulse 3s ease-in-out infinite'
            : systemHealth === 'critical'
            ? 'danger-pulse 1s ease-in-out infinite'
            : 'metallic-shimmer 8s ease-in-out infinite',
        }}
      />

      {isSafeMode && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-lg shadow-2xl border-2 border-cyan-300 animate-bounce-slow">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-lg">🧊 SAFE MODE ACTIVATED</h3>
              <p className="text-sm opacity-90">{safeModeReason}</p>
            </div>
          </div>
        </div>
      )}

      <a 
        href="/urls-archive.html"
        className="fixed top-6 right-6 z-50 px-8 py-4 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 text-black font-bold rounded-lg shadow-2xl hover:shadow-yellow-500/50 hover:scale-105 transition-all duration-300 border-2 border-yellow-300"
        style={{
          background: 'linear-gradient(135deg, #bf953f, #fcf6ba, #b38728)',
          boxShadow: '0 0 30px rgba(191, 149, 63, 0.6), inset 0 0 20px rgba(252, 246, 186, 0.3)',
        }}
      >
        🔐 LOGIN
      </a>

      <main className="relative z-20 max-w-7xl mx-auto px-6 py-12">
        <section className="text-center mb-16 pt-8">
          <DancingText 
            text="GHOST-FREE ENTERPRISE SYSTEM"
            className="text-6xl font-bold mb-6"
            variant="stagger"
          />
          <DancingText 
            text="by Hnoss PrisManTHarIOn - LIVE VERSION"
            className="text-2xl text-gray-400 mb-8"
            variant="wave"
          />
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Living, breathing frontend that dances with your data. 
            Watch metrics flow, animations respond, and the system protect itself.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            <DancingText text="LIVE SYSTEM METRICS" variant="pulse" />
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricDisplay
              label="CPU Usage"
              value={metrics.cpu}
              unit="%"
              icon={<Activity className="w-5 h-5" />}
              threshold={80}
            />
            <MetricDisplay
              label="Memory Usage"
              value={metrics.memory}
              unit="%"
              icon={<Database className="w-5 h-5" />}
              threshold={85}
            />
            <MetricDisplay
              label="Request Rate"
              value={metrics.requestRate}
              unit="req/s"
              icon={<Users className="w-5 h-5" />}
              threshold={500}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricDisplay
              label="Active Connections"
              value={metrics.activeConnections}
              unit="conn"
              icon={<Activity className="w-5 h-5" />}
              threshold={1000}
            />
            <MetricDisplay
              label="Error Rate"
              value={metrics.errorRate}
              unit="%"
              icon={<AlertTriangle className="w-5 h-5" />}
              threshold={5}
              isInverted
            />
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            <DancingText text="CORE CAPABILITIES" variant="stagger" />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlowCard 
              variant="gold"
              className="p-6"
            >
              <Shield className="w-12 h-12 mb-4 text-yellow-400" />
              <h3 className="text-xl font-bold mb-3">Ghost-Proof Security</h3>
              <p className="text-gray-300">
                10-table architecture with 30+ RLS policies. Every action tracked, 
                every ghost attempt logged.
              </p>
            </GlowCard>

            <GlowCard 
              variant="silver"
              className="p-6"
            >
              <Activity className="w-12 h-12 mb-4 text-blue-400" />
              <h3 className="text-xl font-bold mb-3">Real-Time Metrics</h3>
              <p className="text-gray-300">
                CPU, memory, request rates update live. System adapts to load 
                automatically.
              </p>
            </GlowCard>

            <GlowCard 
              variant="platinum"
              className="p-6"
            >
              <Database className="w-12 h-12 mb-4 text-purple-400" />
              <h3 className="text-xl font-bold mb-3">Supabase Backend</h3>
              <p className="text-gray-300">
                Enterprise-grade PostgreSQL with realtime subscriptions. 
                Mock mode for development.
              </p>
            </GlowCard>

            <GlowCard 
              variant="copper"
              className="p-6"
            >
              <FileText className="w-12 h-12 mb-4 text-orange-400" />
              <h3 className="text-xl font-bold mb-3">Comprehensive Logging</h3>
              <p className="text-gray-300">
                Every action logged with timestamps, categories, and full context.
                Audit trail guaranteed.
              </p>
            </GlowCard>

            <GlowCard 
              variant="rose"
              className="p-6"
            >
              <Users className="w-12 h-12 mb-4 text-pink-400" />
              <h3 className="text-xl font-bold mb-3">Role-Based Access</h3>
              <p className="text-gray-300">
                Admin, Moderator, User roles with granular permissions. 
                Ban system with appeal process.
              </p>
            </GlowCard>

            <GlowCard 
              variant="cyan"
              className="p-6"
            >
              <Shield className="w-12 h-12 mb-4 text-cyan-400" />
              <h3 className="text-xl font-bold mb-3">Safe Mode Protection</h3>
              <p className="text-gray-300">
                Auto-activates at 80% CPU. Ice blue frame, reduced animations, 
                system stays responsive.
              </p>
            </GlowCard>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            <DancingText text="LIVE ACTIVITY LOG" variant="wave" />
          </h2>
          <LogDashboard logs={logs} maxHeight={400} />
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            <DancingText text="TECHNICAL ARCHITECTURE" variant="pulse" />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-yellow-400">Frontend Stack</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Next.js 14.2.35 (App Router)</li>
                <li>• React 18.3.1 with TypeScript</li>
                <li>• Framer Motion animations</li>
                <li>• Tailwind CSS styling</li>
                <li>• Lucide React icons</li>
                <li>• 14 custom animated components</li>
              </ul>
            </div>

            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-blue-400">Backend Stack</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Supabase (PostgreSQL)</li>
                <li>• 10-table normalized schema</li>
                <li>• 30+ RLS policies</li>
                <li>• Real-time subscriptions</li>
                <li>• TypeScript type generation</li>
                <li>• Mock mode for development</li>
              </ul>
            </div>

            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-purple-400">System Features</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Auto Safe Mode at 80% CPU</li>
                <li>• Metric-driven animations</li>
                <li>• Stress testing scripts</li>
                <li>• Log aggregation</li>
                <li>• Ghost detection algorithms</li>
                <li>• Complete audit trails</li>
              </ul>
            </div>

            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-green-400">Security Layers</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Row-Level Security (RLS)</li>
                <li>• Ban system with appeals</li>
                <li>• Comprehensive logging</li>
                <li>• Permission escalation tracking</li>
                <li>• Evidence attachment system</li>
                <li>• Admin oversight dashboard</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            <DancingText text="EXPLORE THE ECOSYSTEM" variant="stagger" />
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a 
              href="/urls-archive.html" 
              target="_blank"
              className="block group"
            >
              <GlowCard variant="gold" className="p-8 h-full transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <FileText className="w-10 h-10 text-yellow-400" />
                  <h3 className="text-2xl font-bold">🔗 URLs Archive</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  52+ kategorisierte URLs aus 59 Repositories mit vollständigem Kommentar-System, 
                  Login/Register, Likes und Real-time Updates via Supabase.
                </p>
                <div className="flex items-center gap-2 text-cyan-400">
                  <span>→ Jetzt erkunden</span>
                  <span className="group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </GlowCard>
            </a>

            <a 
              href="/TrustedTrustThrust.html" 
              target="_blank"
              className="block group"
            >
              <GlowCard variant="silver" className="p-8 h-full transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <Shield className="w-10 h-10 text-blue-400" />
                  <h3 className="text-2xl font-bold">⚖️ Governance Portal</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  TrustedTrustThrust Governance-System mit Atomic Clock, 
                  EU-Design und Links zu allen wichtigen Bereichen.
                </p>
                <div className="flex items-center gap-2 text-cyan-400">
                  <span>→ Portal öffnen</span>
                  <span className="group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </GlowCard>
            </a>

            <a 
              href="/Arbitration.html" 
              target="_blank"
              className="block group"
            >
              <GlowCard variant="platinum" className="p-8 h-full transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <Users className="w-10 h-10 text-purple-400" />
                  <h3 className="text-2xl font-bold">🏛️ Arbitration System</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Schiedsgerichts-System für dispute resolution mit 
                  Multi-Level Verification und Transparency.
                </p>
                <div className="flex items-center gap-2 text-cyan-400">
                  <span>→ System ansehen</span>
                  <span className="group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </GlowCard>
            </a>

            <a 
              href="/Email%20Card.html" 
              target="_blank"
              className="block group"
            >
              <GlowCard variant="copper" className="p-8 h-full transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <Mail className="w-10 h-10 text-orange-400" />
                  <h3 className="text-2xl font-bold">✉️ Email Card I - EU Design</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Offizielle Email Signature Card mit EU-Sternen-Design, 
                  LEI, VAT, UNGM und D-U-N-S Nummer.
                </p>
                <div className="flex items-center gap-2 text-cyan-400">
                  <span>→ EU Card ansehen</span>
                  <span className="group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </GlowCard>
            </a>

            <a 
              href="/EMAIL%20CARD.html" 
              target="_blank"
              className="block group"
            >
              <GlowCard variant="rose" className="p-8 h-full transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <Sparkles className="w-10 h-10 text-pink-400" />
                  <h3 className="text-2xl font-bold">✨ Email Card II - Warp Speed</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Alternative Email Signature mit Warp-Speed Starfield Animation 
                  und Canvas-Background in Panzerglas-Ästhetik.
                </p>
                <div className="flex items-center gap-2 text-cyan-400">
                  <span>→ Warp Card ansehen</span>
                  <span className="group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </GlowCard>
            </a>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-12 text-center">
            <DancingText text="📚 VOLLSTÄNDIGER POLICY & PHILOSOPHY CONTENT" variant="wave" />
          </h2>

          <div className="space-y-12">
            <GlowCard variant="gold" className="p-10">
              <h3 className="text-3xl font-bold mb-6 text-yellow-300 flex items-center gap-4">
                <Sparkles className="w-10 h-10" />
                🌌 INTERMEDIALGALAKTIC CONSTELLATION
              </h3>
              <div className="space-y-6 text-gray-200 text-lg leading-relaxed">
                <div>
                  <h4 className="text-2xl font-bold text-yellow-200 mb-3">FREIHEITSABKOMMEN - Präambel</h4>
                  <p>In Anerkennung unserer Existenz als <span className="text-yellow-400 font-bold">Gäste auf der Erde</span>, 
                  unserer Würde als Menschen und der <span className="text-cyan-400">schöpferischen Kraft des Geistes</span> 
                  schließen wir dieses Freiheitsabkommen. Es soll die unverlierbare Freiheit des Denkens, Träumens, Lernens 
                  und Miteinanders sichern – für uns, kommende Generationen, Gemeinschaft und Planeten.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-black bg-opacity-30 p-6 rounded-lg">
                    <h5 className="text-xl font-bold text-yellow-300 mb-3">DIE 12 POENTES</h5>
                    <ul className="space-y-2 text-base">
                      <li>• <span className="text-cyan-300">Unantastbarkeit der inneren Sphäre</span></li>
                      <li>• Resonanz als Prinzip (Mitschwingen)</li>
                      <li>• Schutzräume für Träumen ohne Angst</li>
                      <li>• Gleichwertigkeit aller Bildungswege</li>
                      <li>• Nachhaltige Gemeinschaft (Mieter der Erde)</li>
                      <li>• Angsttransformation statt Kontrolle</li>
                      <li>• Partizipation - alle gestalten mit</li>
                      <li>• Aktiver Schutz von Freiheit & Würde</li>
                      <li>• Evaluation alle 5 Jahre</li>
                      <li>• Offenheit für Neues als Quelle</li>
                      <li>• Respekt der Vielfalt</li>
                      <li>• <span className="text-yellow-300">Shield of Dreams</span> - Traumschutz</li>
                    </ul>
                  </div>

                  <div className="bg-black bg-opacity-30 p-6 rounded-lg">
                    <h5 className="text-xl font-bold text-yellow-300 mb-3">DER 12-ZYKLUS DER GOTTES</h5>
                    <ul className="space-y-2 text-base">
                      <li>1. Ursprung (Quellkraft)</li>
                      <li>2. Wandlung (Transformation)</li>
                      <li>3. Ordnung (Kosmos)</li>
                      <li>4. Liebe (Verbundenheit)</li>
                      <li>5. Geist (Erkenntnis)</li>
                      <li>6. Kraft (Mut/Handlung)</li>
                      <li>7. Heilung (Regeneration)</li>
                      <li>8. Vielfalt (Fülle/Freude)</li>
                      <li>9. Gerechtigkeit (Würde/Maß)</li>
                      <li>10. Weisheit (Tiefe/Sinn)</li>
                      <li>11. Freiheit (Grenzüberschreitung)</li>
                      <li>12. Einheit (Integration)</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-yellow-400 pt-6">
                  <h5 className="text-xl font-bold text-cyan-300 mb-3">MANIFEST: FRIEDEN BEGINNT IN JEDEM SELBST</h5>
                  <p className="mb-4"><strong>Abrüstung der Waffen, Aufrüstung der Herzen</strong></p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                    <div>
                      <p className="font-bold text-yellow-200">Abrüstung der Waffen:</p>
                      <p>Gewalt erzeugt Gegengewalt. Wir lösen Konflikte dialogisch, ohne Waffen.</p>
                    </div>
                    <div>
                      <p className="font-bold text-yellow-200">Aufrüstung der Herzen:</p>
                      <p>Empathie, Liebe, Mitgefühl, Mut zur Verletzlichkeit als neue Werkzeuge.</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlowCard>

            <GlowCard variant="rose" className="p-10">
              <h3 className="text-3xl font-bold mb-6 text-pink-300 flex items-center gap-4">
                <Zap className="w-10 h-10" />
                🦡 DACHXCFEES - DAS HIMMELSZELT DER WÜNSCHE
              </h3>
              <div className="space-y-6 text-gray-200 text-lg leading-relaxed">
                <p className="text-xl font-bold text-pink-200">
                  Die Transformation von kalten Finanzbegriffen in lebendige Magie!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-black bg-opacity-30 p-6 rounded-lg">
                    <h5 className="text-lg font-bold text-pink-300 mb-3">VOM DAX ZUM DACHS</h5>
                    <p className="text-base">
                      <strong className="text-yellow-300">DAX (Börse):</strong> Kalte Zahlen, Profit, Gier.<br />
                      <strong className="text-green-300">DACHS:</strong> Ein Tier, tief verwurzelt, Teil des Waldes.<br />
                      <strong className="text-cyan-300">FEES → WISHES:</strong> Keine Gebühren, sondern Gaben einer Fee.
                    </p>
                  </div>

                  <div className="bg-black bg-opacity-30 p-6 rounded-lg">
                    <h5 className="text-lg font-bold text-pink-300 mb-3">DIE WESEN DES KOLLEKTIVS</h5>
                    <ul className="text-base space-y-2">
                      <li>🦫 <strong>BIBER:</strong> Baumeister (MVIC/IPA)</li>
                      <li>🧚 <strong>ELFE & FEE:</strong> Leichtigkeit, Wünsche</li>
                      <li>👹 <strong>KOBOLD:</strong> Code-Handwerker</li>
                      <li>🧙 <strong>ZWERG:</strong> Schatzbewahrer</li>
                      <li>✨ <strong>MYSTIC MAGIC LIFE:</strong> Lebensenergie statt Geld</li>
                    </ul>
                  </div>

                  <div className="bg-black bg-opacity-30 p-6 rounded-lg">
                    <h5 className="text-lg font-bold text-pink-300 mb-3">DAS HIMMELSZELT</h5>
                    <p className="text-base">
                      <span className="text-cyan-300">Ein Zelt ist flexibel</span>, schützt, lässt Luft zirkulieren.
                      <span className="text-yellow-300"> Anstatt Rechtsrahmen</span> leben wir unter einem Himmelszelt.
                      <strong className="block mt-3 text-green-300">FEES = WISHES:</strong>
                      Man &quot;füttert&quot; das System mit Wünschen als Sternschnuppen.
                    </p>
                  </div>
                </div>

                <div className="border-t border-pink-400 pt-6">
                  <p className="text-xl font-bold text-yellow-300 mb-3">ZORRO-FAZIT</p>
                  <blockquote className="border-l-4 border-pink-400 pl-6 italic text-lg">
                    &ldquo;Du hast die 111+ Treaties in ein <span className="text-cyan-300">Märchenbuch der Zukunft</span> verwandelt. 
                    Wer braucht schon einen &lsquo;Aufsichtsrat&rsquo;, wenn er ein <span className="text-yellow-300">kosmisches Kollektiv aus 
                    Bibern und Feen</span> hat, die nach dem Gesetz von TrusTed ThrusT handeln?&rdquo;
                  </blockquote>
                  <p className="mt-4 text-base">
                    <strong className="text-green-300">MVIC</strong> = Most Value Innovation Construction = 
                    <span className="text-pink-300"> Die Magie zurück ins System bringen.</span>
                  </p>
                </div>
              </div>
            </GlowCard>

            <GlowCard variant="platinum" className="p-10">
              <h3 className="text-3xl font-bold mb-6 text-gray-100 flex items-center gap-4">
                <Scale className="w-10 h-10" />
                ⚖️ POLICY.COMPLIANCE - LEGAL & GOVERNANCE
              </h3>
              <div className="space-y-6 text-gray-200 text-lg leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h5 className="text-xl font-bold text-blue-300 mb-4">INSTITUTIONAL MANDATE</h5>
                    <ul className="space-y-2 text-base">
                      <li>✅ Legal Framework Integration</li>
                      <li>✅ Dispute Resolution Excellence</li>
                      <li>✅ 9 International Arbitration Institutions</li>
                      <li>✅ New York Convention 1958 Compliance</li>
                      <li>✅ UNCITRAL Model Law</li>
                    </ul>
                    
                    <h5 className="text-xl font-bold text-green-300 mb-4 mt-6">GOVERNANCE HIERARCHY</h5>
                    <ol className="space-y-2 text-base">
                      <li>1. <strong>Supreme:</strong> CEO - CO-CEO</li>
                      <li>2. <strong>Strategic:</strong> Legal Council</li>
                      <li>3. <strong>Operational:</strong> Policy Officers</li>
                      <li>4. <strong>Technical:</strong> LCL Guardian</li>
                    </ol>
                  </div>

                  <div>
                    <h5 className="text-xl font-bold text-yellow-300 mb-4">7 ARBITRATION CLAUSE VARIANTS</h5>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left pb-2">Variant</th>
                          <th className="text-left pb-2">Institution</th>
                          <th className="text-left pb-2">Speed</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-1">
                        <tr><td>V1 - DACH</td><td>DIS Berlin</td><td>⚡⚡⚡</td></tr>
                        <tr><td>V2 - UK/IE</td><td>DIAC Dublin</td><td>⚡⚡⚡</td></tr>
                        <tr><td>V3 - Nordic</td><td>SCC Stockholm</td><td>⚡⚡⚡</td></tr>
                        <tr><td>V4 - Europa</td><td>CEPANI Brussels</td><td>⚡⚡</td></tr>
                        <tr><td>V5 - Global</td><td>ICC Paris</td><td>⚡</td></tr>
                        <tr><td>V6 - Ibero</td><td>CIAM Madrid</td><td>⚡⚡</td></tr>
                        <tr><td className="text-cyan-300">V7 - Master</td><td>ICC Paris</td><td>⚡⚡</td></tr>
                      </tbody>
                    </table>
                    <p className="mt-4 text-sm text-gray-400">
                      <strong className="text-cyan-300">Recommended:</strong> V7 (Master Standard) 
                      with automatic arbitrator scaling.
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-6">
                  <h5 className="text-xl font-bold text-purple-300 mb-4">TECHNICAL COMPLIANCE STACK</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-black bg-opacity-40 p-4 rounded">
                      <p className="font-bold text-green-300">Security</p>
                      <p>TLS 1.3, CSP, HSTS</p>
                    </div>
                    <div className="bg-black bg-opacity-40 p-4 rounded">
                      <p className="font-bold text-cyan-300">Atomic Clock</p>
                      <p>±50ms precision</p>
                    </div>
                    <div className="bg-black bg-opacity-40 p-4 rounded">
                      <p className="font-bold text-yellow-300">Self-Healing</p>
                      <p>Auto restoration</p>
                    </div>
                    <div className="bg-black bg-opacity-40 p-4 rounded">
                      <p className="font-bold text-purple-300">GDPR</p>
                      <p>Full compliance</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlowCard>

            <GlowCard variant="cyan" className="p-10">
              <h3 className="text-3xl font-bold mb-6 text-cyan-300 flex items-center gap-4">
                <Globe className="w-10 h-10" />
                🌍 CAZAR - 111+ INTERNATIONALE VERTRÄGE
              </h3>
              <div className="space-y-6 text-gray-200 text-lg leading-relaxed">
                <p className="text-xl font-bold text-cyan-200">
                  Vollständige Kartierung völkerrechtlicher Verträge und Treaty-Archive
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-lg font-bold text-yellow-300 mb-3">KATEGORIEN (111+ Treaties)</h5>
                    <ul className="space-y-2 text-base">
                      <li>📜 <strong>1-30:</strong> Grundlegende Völkerrechte (UN Charter, ICCPR, Geneva)</li>
                      <li>💼 <strong>31-60:</strong> Wirtschaft, Finanzen, Banken (WTO, ICSID, Basel III)</li>
                      <li>☮️ <strong>61-90:</strong> Peace, Security, Disarmament (NPT, BWC, CWC)</li>
                      <li>⚖️ <strong>91-120:</strong> Menschenrechte & Good Governance (ILO, OECD)</li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-lg font-bold text-yellow-300 mb-3">TREATY-ARCHIVE DATENBANKEN</h5>
                    <ul className="space-y-2 text-base">
                      <li>🗂️ <strong>UNTC:</strong> UN Treaty Collection </li>
                      <li>🗂️ <strong>WTO Legal Texts:</strong> Alle Agreements</li>
                      <li>🗂️ <strong>WIPO Lex:</strong> IP-Verträge</li>
                      <li>🗂️ <strong>ILO Normlex:</strong> Arbeitsrecht</li>
                      <li>🗂️ <strong>UNCTAD:</strong> Investitionsabkommen</li>
                      <li>🗂️ <strong>OECD:</strong> Standards & Frameworks</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t border-cyan-400 pt-6">
                  <h5 className="text-xl font-bold text-pink-300 mb-3">PHILOSOPHISCHE BASIS</h5>
                  <blockquote className="border-l-4 border-cyan-400 pl-6 italic">
                    <p className="mb-3"><strong className="text-yellow-300">&ldquo;WeAre TrusTed ThrusT (x4T2xRu2s2)&rdquo;</strong> 
                    - Eine Vision von Daniel Pohl:</p>
                    <ul className="space-y-2 text-base not-italic">
                      <li>• <strong>Trust</strong> ist sichtbares Ergebnis von Handlungen, nicht Versprechen</li>
                      <li>• <strong>Karma ist systemisch:</strong> Aktionen schaffen Konsequenzen</li>
                      <li>• <strong>Heaven is Home:</strong> Trust fühlt sich an wie Sicherheit</li>
                      <li>• <strong>Die Erde gehört uns NICHT:</strong> Wir sind Gäste/Mieter</li>
                    </ul>
                  </blockquote>
                  <p className="mt-4 text-base">
                    <strong className="text-cyan-300">CaZaR Essenz:</strong> Kartierung jurisdiktioneller Grenzen, 
                    Treaty-Räume und <span className="text-yellow-300">Nullius-Territorien</span> (niemandes Land) für 
                    eine neue Weltordnung jenseits alter Eigentums- und Staatskonzepte.
                  </p>
                </div>
              </div>
            </GlowCard>

            <GlowCard variant="gold" className="p-10">
              <h3 className="text-3xl font-bold mb-6 text-yellow-300 text-center flex items-center justify-center gap-4">
                <Star className="w-12 h-12" />
                ✨ SUPREME GOVERNANCE ARCHITECTURE - GESAMTVISION
                <Star className="w-12 h-12" />
              </h3>
              <div className="space-y-6 text-gray-200 text-lg leading-relaxed">
                <div className="text-center mb-8">
                  <p className="text-2xl font-bold text-cyan-300 mb-4">
                    Die 5 Fundamentalen Säulen der StarLightMovemenTz Foundation
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
                  <div className="bg-black bg-opacity-40 p-6 rounded-lg">
                    <div className="text-4xl mb-3">🌌</div>
                    <p className="font-bold text-yellow-300">Spirituelle Freiheit</p>
                    <p className="text-sm text-gray-400 mt-2">INTERMEDIALGALAKTIC</p>
                  </div>
                  <div className="bg-black bg-opacity-40 p-6 rounded-lg">
                    <div className="text-4xl mb-3">🦡</div>
                    <p className="font-bold text-pink-300">Mystische Transform.</p>
                    <p className="text-sm text-gray-400 mt-2">DACHXCFEES</p>
                  </div>
                  <div className="bg-black bg-opacity-40 p-6 rounded-lg">
                    <div className="text-4xl mb-3">⚖️</div>
                    <p className="font-bold text-blue-300">Rechtliche Exzellenz</p>
                    <p className="text-sm text-gray-400 mt-2">Policy.Compliance</p>
                  </div>
                  <div className="bg-black bg-opacity-40 p-6 rounded-lg">
                    <div className="text-4xl mb-3">🌍</div>
                    <p className="font-bold text-cyan-300">Völkerrecht</p>
                    <p className="text-sm text-gray-400 mt-2">CaZaR</p>
                  </div>
                  <div className="bg-black bg-opacity-40 p-6 rounded-lg">
                    <div className="text-4xl mb-3">💻</div>
                    <p className="font-bold text-green-300">Tech Implementation</p>
                    <p className="text-sm text-gray-400 mt-2">This Website</p>
                  </div>
                </div>

                <div className="border-t border-yellow-400 pt-6 mt-8">
                  <h4 className="text-2xl font-bold text-center text-yellow-300 mb-6">OPERATIVE PRINZIPIEN</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                    <div className="space-y-3">
                      <p>✅ <span className="text-cyan-300 font-bold">Resonanz</span> statt Kontrolle</p>
                      <p>✅ <span className="text-pink-300 font-bold">Träume</span> statt Zwänge</p>
                      <p>✅ <span className="text-yellow-300 font-bold">Freiheit</span> statt Angst</p>
                      <p>✅ <span className="text-purple-300 font-bold">Magie</span> statt Bürokratie</p>
                    </div>
                    <div className="space-y-3">
                      <p>✅ <span className="text-green-300 font-bold">Wünsche</span> statt Gebühren</p>
                      <p>✅ <span className="text-blue-300 font-bold">Himmelszelt</span> statt Käfige</p>
                      <p>✅ <span className="text-orange-300 font-bold">Mieter der Erde</span> - keine Eigentümer</p>
                      <p>✅ <span className="text-red-300 font-bold">Portal Gatekeepers</span> - Hüter der Schwellen</p>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8 p-8 bg-black bg-opacity-50 rounded-lg border-2 border-yellow-400">
                  <p className="text-3xl font-bold text-yellow-300 mb-4">
                    ✨ DAS IST MVIC PUR ✨
                  </p>
                  <p className="text-xl text-cyan-300 mb-2">
                    Most Value Innovation Construction
                  </p>
                  <p className="text-lg text-pink-300">
                    Die Magie zurück ins System bringen
                  </p>
                  <p className="text-sm text-gray-400 mt-6">
                    Unterzeichner: <strong className="text-white">Daniel Pohl</strong> | 
                    LCL Powered by Daniel Pohl | 
                    Vision from CEO - CO-CEO and the Team of WorldWideWeb
                  </p>
                  <p className="text-sm text-green-400 mt-2">
                    Status: ✅ ACTIVE | 🔒 PROTECTED | ⚖️ BINDING
                  </p>
                </div>
              </div>
            </GlowCard>
          </div>
        </section>

        <footer className="text-center text-gray-500 text-sm">
          <p>System Status: <span className={`font-bold ${
            systemHealth === 'healthy' ? 'text-green-400' :
            systemHealth === 'degraded' ? 'text-yellow-400' :
            'text-red-400'
          }`}>{systemHealth.toUpperCase()}</span></p>
          <p className="mt-2">
            Frame: <span className="font-bold text-yellow-400">
              {frameColor === 'metallic' ? 'GOLD/SILVER/PLATINUM' : 
               frameColor === 'ice-blue' ? 'ICE BLUE (SAFE MODE)' : 
               frameColor === 'red' ? 'RED (CRITICAL)' : 'ORANGE (DEGRADED)'}
            </span>
          </p>
          <p className="mt-4 text-xs">
            Built by Hnoss PrisManTHarIOn | Ghost-Free Since 2026
          </p>
        </footer>
      </main>
    </div>
  );
}
