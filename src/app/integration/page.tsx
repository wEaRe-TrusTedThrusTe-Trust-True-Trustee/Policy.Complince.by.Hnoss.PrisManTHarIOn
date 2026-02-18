'use client';

import React, { useState } from 'react';
import { Shield, Globe, Scale, BookOpen, FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export default function IntegrationPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('joker');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-blue-500/30 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Policy & Compliance Integration
          </h1>
          <p className="text-blue-200 mt-2">
            Internationale Rechtsressourcen • Schiedsklauseln • 5,865 URLs
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-7xl">
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-6 rounded-xl border border-blue-400/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-8 h-8 text-blue-400" />
              <h3 className="text-2xl font-bold">5,865</h3>
            </div>
            <p className="text-blue-200">Internationale URLs</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 rounded-xl border border-purple-400/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <Scale className="w-8 h-8 text-purple-400" />
              <h3 className="text-2xl font-bold">2</h3>
            </div>
            <p className="text-purple-200">Schiedsklauseln</p>
          </div>
          
          <div className="bg-gradient-to-br from-pink-500/20 to-orange-500/20 p-6 rounded-xl border border-pink-400/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-pink-400" />
              <h3 className="text-2xl font-bold">3</h3>
            </div>
            <p className="text-pink-200">Philosophische Frameworks</p>
          </div>
        </div>

        {/* 🃏 JOKER Clause */}
        <section className="mb-8">
          <button
            onClick={() => toggleSection('joker')}
            className="w-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-6 rounded-xl border border-yellow-400/30 backdrop-blur-sm hover:border-yellow-400/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🃏</span>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-yellow-400">DER JOKER: UNCITRAL AD-HOC KLAUSEL</h2>
                  <p className="text-yellow-200 text-sm">Globaler Standard für höchste Neutralität & Souveränität</p>
                </div>
              </div>
              {expandedSection === 'joker' ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
            </div>
          </button>
          
          {expandedSection === 'joker' && (
            <div className="mt-4 bg-black/40 p-8 rounded-xl border border-yellow-400/20 backdrop-blur-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-yellow-400 mb-3">§ DISPUTE RESOLUTION (UNCITRAL AD-HOC)</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-yellow-500/10 p-4 rounded-lg border-l-4 border-yellow-400">
                      <h4 className="font-bold text-yellow-300 mb-2">1. BINDING ARBITRATION:</h4>
                      <p className="text-gray-300 italic">
                        &quot;All disputes, controversies, or claims arising out of or relating to this contract, or the breach, 
                        termination, or invalidity thereof, shall be settled by arbitration in accordance with the 
                        <strong> UNCITRAL Arbitration Rules</strong> as at present in force.&quot;
                      </p>
                    </div>

                    <div className="bg-yellow-500/10 p-4 rounded-lg border-l-4 border-yellow-400">
                      <h4 className="font-bold text-yellow-300 mb-2">2. APPOINTING AUTHORITY (THE GUARDIAN):</h4>
                      <p className="text-gray-300 italic">
                        &quot;The appointing authority shall be the <strong>Secretary-General of the Permanent Court of 
                        Arbitration (PCA) at The Hague</strong>. This ensures a neutral, intergovernmental oversight 
                        of the arbitrator selection process.&quot;
                      </p>
                    </div>

                    <div className="bg-yellow-500/10 p-4 rounded-lg border-l-4 border-yellow-400">
                      <h4 className="font-bold text-yellow-300 mb-2">3. PROCEDURAL DETAILS:</h4>
                      <ul className="text-gray-300 list-disc list-inside space-y-1">
                        <li><strong>Number of Arbitrators:</strong> One (unless complexity requires three)</li>
                        <li><strong>Place of Arbitration:</strong> The Hague, Netherlands (or Vienna, Austria)</li>
                        <li><strong>Language:</strong> English and/or German</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-500/10 p-4 rounded-lg border-l-4 border-yellow-400">
                      <h4 className="font-bold text-yellow-300 mb-2">4. FINALITY & ENFORCEMENT:</h4>
                      <p className="text-gray-300 italic">
                        &quot;The parties hereby waive their right to any form of recourse to a court of law on points of 
                        law or fact. The arbitral award shall be final, binding, and enforceable globally under the 
                        <strong> New York Convention of 1958</strong>.&quot;
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 bg-blue-500/10 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-300 mb-2">💎 Warum diese Klausel &quot;gigantisch&quot; ist:</h4>
                    <ol className="text-gray-300 list-decimal list-inside space-y-2">
                      <li><strong>Der PCA-Hebel:</strong> Blockiert Verzögerungstaktiken durch neutrale UN-Institution</li>
                      <li><strong>Souveränitäts-Schutz:</strong> Goldstandard für Regierungszusammenarbeit</li>
                      <li><strong>Keine Bürokratie:</strong> Keine hohen Institutionsgebühren</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 🧠💎 HYBRID Clause */}
        <section className="mb-8">
          <button
            onClick={() => toggleSection('hybrid')}
            className="w-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-6 rounded-xl border border-purple-400/30 backdrop-blur-sm hover:border-purple-400/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🧠💎</span>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-purple-400">DIE HYBRID-KLAUSEL: COMPASSIONATE GOVERNANCE</h2>
                  <p className="text-purple-200 text-sm">The Ethical Human-Centric Development Framework</p>
                </div>
              </div>
              {expandedSection === 'hybrid' ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
            </div>
          </button>
          
          {expandedSection === 'hybrid' && (
            <div className="mt-4 bg-black/40 p-8 rounded-xl border border-purple-400/20 backdrop-blur-sm">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-purple-400">Strategische Dispute Resolution Hubs</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-400/30">
                    <h4 className="font-bold text-purple-300 mb-2">🌍 Global Sovereignty</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li><strong>PCA (The Hague)</strong> – Zwischenstaatliche Projekte</li>
                      <li><strong>ICC (Paris)</strong> – Großangelegte staatliche Projekte</li>
                    </ul>
                  </div>

                  <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-400/30">
                    <h4 className="font-bold text-blue-300 mb-2">🇪🇺 Central European Hub</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li><strong>VIAC (Vienna)</strong> – EU, CEE/SEE</li>
                      <li>Hochmodernes österreichisches Schiedsrecht</li>
                    </ul>
                  </div>

                  <div className="bg-green-500/10 p-4 rounded-lg border border-green-400/30">
                    <h4 className="font-bold text-green-300 mb-2">🌏 Technological & Pacific Hubs</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li><strong>JAMS (USA)</strong> – High-Tech-Entwicklungen</li>
                      <li><strong>SIAC (Singapore)</strong> – Pazifischer Raum</li>
                    </ul>
                  </div>

                  <div className="bg-pink-500/10 p-4 rounded-lg border border-pink-400/30">
                    <h4 className="font-bold text-pink-300 mb-2">⚖️ Spezialisten</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li><strong>WIPO (Genf)</strong> – IP & Patente</li>
                      <li><strong>LCIA (London)</strong> – Commonwealth</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-6 rounded-lg border border-purple-400/20">
                  <h4 className="font-bold text-purple-300 mb-3">🗺️ Das Giganten-Cheat-Sheet: Wer ist wofür zuständig?</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong className="text-purple-400">Völkerrechtlich:</strong>
                      <p className="text-gray-300">PCA (Den Haag): UN, WHO, EU-Kommission, Vatikan</p>
                    </div>
                    <div>
                      <strong className="text-blue-400">Regional:</strong>
                      <p className="text-gray-300">VIAC (Wien): Österreich, Balkan, Ukraine, Osteuropa</p>
                    </div>
                    <div>
                      <strong className="text-green-400">Branchen:</strong>
                      <p className="text-gray-300">WIPO (Genf): Software, Patente, IP, geistiges Eigentum</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* URL Database */}
        <section className="mb-8">
          <button
            onClick={() => toggleSection('urls')}
            className="w-full bg-gradient-to-r from-blue-500/20 to-green-500/20 p-6 rounded-xl border border-blue-400/30 backdrop-blur-sm hover:border-blue-400/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Globe className="w-10 h-10 text-blue-400" />
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-blue-400">5,865 Internationale URLs</h2>
                  <p className="text-blue-200 text-sm">UN, WHO, WTO, IMF, Regional Organizations, Treaties</p>
                </div>
              </div>
              {expandedSection === 'urls' ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
            </div>
          </button>
          
          {expandedSection === 'urls' && (
            <div className="mt-4 bg-black/40 p-8 rounded-xl border border-blue-400/20 backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-blue-400">🌐 Internationale Organisationen</h3>
                  <div className="space-y-2">
                    <a href="https://treaties.un.org/" target="_blank" rel="noopener noreferrer" 
                       className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>UN Treaties Database</span>
                    </a>
                    <a href="https://pca-cpa.org/" target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>PCA - Permanent Court of Arbitration</span>
                    </a>
                    <a href="https://icc-cpi.int/" target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>ICC - International Criminal Court</span>
                    </a>
                    <a href="https://au.int/en/treaties" target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>African Union Treaties</span>
                    </a>
                    <a href="https://asean.org/asean/legal-framework/" target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>ASEAN Legal Framework</span>
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-purple-400">⚖️ Schiedsgerichte</h3>
                  <div className="space-y-2">
                    <a href="https://www.viac.eu/" target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>VIAC (Vienna) - Österreich, Osteuropa</span>
                    </a>
                    <a href="https://iccwbo.org/" target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>ICC (Paris) - Global Trade</span>
                    </a>
                    <a href="https://www.siac.org.sg/" target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>SIAC (Singapore) - Asia-Pacific</span>
                    </a>
                    <a href="https://www.lcia.org/" target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>LCIA (London) - Commonwealth</span>
                    </a>
                    <a href="https://icsid.worldbank.org/" target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>ICSID - Investment Disputes</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-400/20">
                <p className="text-blue-200">
                  <strong>Vollständige Liste:</strong> Die komplette URL-Datenbank mit 5,865 Links ist in 
                  <code className="mx-1 px-2 py-1 bg-black/40 rounded">URL_EXTRACTION_SIMPLE.txt</code> 
                  verfügbar.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Philosophical Frameworks */}
        <section className="mb-8">
          <button
            onClick={() => toggleSection('philosophy')}
            className="w-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 p-6 rounded-xl border border-pink-400/30 backdrop-blur-sm hover:border-pink-400/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">✨</span>
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-pink-400">Philosophische Grundlagen</h2>
                  <p className="text-pink-200 text-sm">CaZaR • DACHXCFEES • INTERMEDIALGALAKTIC</p>
                </div>
              </div>
              {expandedSection === 'philosophy' ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
            </div>
          </button>
          
          {expandedSection === 'philosophy' && (
            <div className="mt-4 bg-black/40 p-8 rounded-xl border border-pink-400/20 backdrop-blur-sm">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-blue-400 mb-3">⭐ CaZaR – Der Sternenhimmel</h3>
                  <p className="text-gray-300 mb-2"><strong>Liminality Cosmic Orbits Nullius Continuum</strong></p>
                  <p className="text-gray-300">
                    CaZaR ist der Sternenhimmel selbst – das unendliche, funkelnde Zuhause des kosmischen Kollektivs. 
                    Ein Raum jenseits von Grenzen, Hierarchien und irdischen &quot;Corps&quot;.
                  </p>
                  <p className="text-blue-300 mt-2 italic">
                    <strong>MVIC – Most Value Innovation Construction:</strong> Der aktive, schöpferische Teil. 
                    Nicht nur wünschen, sondern bauen.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-purple-400 mb-3">🏔️ DACHXCFEES – Das Himmelszelt der Wünsche</h3>
                  <p className="text-gray-300 mb-2"><strong>&quot;NEIN zu kalten Zahlen – JA zur puren, wilden Magie!&quot;</strong></p>
                  <ul className="text-gray-300 space-y-2 list-disc list-inside">
                    <li><strong>BIBER:</strong> Die Baumeister (MVIC / IPA) – bauen die Strukturen im Fluss des Lebens</li>
                    <li><strong>ELFE & FEE:</strong> Leichtigkeit, Wünsche, Inspiration</li>
                    <li><strong>KOBOLD & ZWERG:</strong> Handwerker, die tief im System arbeiten</li>
                    <li><strong>MYSTIC MAGIC LIFE:</strong> Der Treibstoff – nicht Geld, sondern Lebensenergie</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-pink-500/10 to-orange-500/10 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-pink-400 mb-3">🌌 INTERMEDIALGALAKTIC – Die Ethische Dimension</h3>
                  <p className="text-gray-300 mb-2"><strong>&quot;EHTIC HUMAN ROLE AETER – StarLightMovemenTz&quot;</strong></p>
                  <div className="text-gray-300 space-y-2">
                    <p><strong>Kernfragen:</strong></p>
                    <ul className="list-disc list-inside pl-4 space-y-1">
                      <li>Wem &quot;gehört&quot; die Welt? → Niemanden – wir sind &quot;Mieter&quot;, keine Besitzer</li>
                      <li>Wer definiert &quot;Bildung&quot;? → Gesellschaftlicher Konsens vs. individuelle Traumfreiheit</li>
                      <li>Wie stehen Völkerrecht und nationale Souveränität im Verhältnis?</li>
                    </ul>
                    <p className="mt-3 text-pink-300 italic">
                      <strong>Regulatorium:</strong> Das System erkennt an, dass wir Reisende auf der Erde sind – 
                      erfordernd Demut, Schutz, nachhaltiges Wirtschaften und Respekt.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Policy Briefs */}
        <section className="mb-8">
          <button
            onClick={() => toggleSection('policy')}
            className="w-full bg-gradient-to-r from-green-500/20 to-blue-500/20 p-6 rounded-xl border border-green-400/30 backdrop-blur-sm hover:border-green-400/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Shield className="w-10 h-10 text-green-400" />
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-green-400">Policy Briefs & Regelwerke</h2>
                  <p className="text-green-200 text-sm">Shield of Dreams • Portal Gatekeeper • Compassionate Governance</p>
                </div>
              </div>
              {expandedSection === 'policy' ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
            </div>
          </button>
          
          {expandedSection === 'policy' && (
            <div className="mt-4 bg-black/40 p-8 rounded-xl border border-green-400/20 backdrop-blur-sm">
              <div className="space-y-6">
                <div className="bg-green-500/10 p-6 rounded-lg border border-green-400/20">
                  <h3 className="text-xl font-bold text-green-400 mb-3">🛡️ Shield of Dreams & Portal-Gatekeeper-Prinzip</h3>
                  <p className="text-gray-300 mb-4">
                    Praktische Leitlinien zur Anerkennung und Sicherung der geistigen, schöpferischen und 
                    persönlichen Freiheit ALLER Bürger:innen als integraler Bestandteil demokratischer 
                    Sicherheit, Resilienz und Zukunftsfähigkeit.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="bg-black/30 p-4 rounded-lg">
                      <h4 className="font-bold text-green-300 mb-2">§1 UNANTASTBARKEIT DER INNEREN WELT</h4>
                      <p className="text-gray-300 text-sm">
                        Verankerung des Rechts auf unverletzliche Gedanken-, Traum- und Kreativitätsfreiheit. 
                        Schutz vor Überwachung, Zensur und psychologischer Fremdbestimmung.
                      </p>
                    </div>

                    <div className="bg-black/30 p-4 rounded-lg">
                      <h4 className="font-bold text-green-300 mb-2">§2 SHIELD OF PROTECTION</h4>
                      <p className="text-gray-300 text-sm">
                        Kollektiver Schutzschild – alle Gemeinschaften verteidigen und bewahren Träume, 
                        Kreativität und Resonanz füreinander.
                      </p>
                    </div>

                    <div className="bg-black/30 p-4 rounded-lg">
                      <h4 className="font-bold text-green-300 mb-2">§3 PORTAL GATEKEEPER</h4>
                      <p className="text-gray-300 text-sm">
                        Gatekeeper achten Schwellen mit Respekt und Achtsamkeit – auf Grundlage von Freiwilligkeit, 
                        Vertrauen und gegenseitigem Respekt.
                      </p>
                    </div>

                    <div className="bg-black/30 p-4 rounded-lg">
                      <h4 className="font-bold text-green-300 mb-2">§4 SHIFT – WANDEL UND ERNEUERUNG</h4>
                      <p className="text-gray-300 text-sm">
                        Wandel und spirituelle Entwicklung geschehen im Einklang mit dem inneren Kompass 
                        und der Verantwortung gegenüber dem Ganzen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400 border-t border-blue-500/30 pt-8">
          <p className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            &quot;Home is where the Trust is – and the Stars are the Limit.&quot;
          </p>
          <p className="text-sm">
            Erstellt: Februar 2026 | Policy.Compliance.by.Hnoss.PrisManTHarIOn | Autor: Daniel Pohl
          </p>
        </footer>
      </main>
    </div>
  );
}
