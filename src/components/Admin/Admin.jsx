import { useState } from 'react';
import { ClientSessionStats } from './ClientSessionStats';
import { Forms } from './Forms';

export const Admin = ({ clients, workouts, exercises }) => {
    const [activeSection, setActiveSection] = useState(null);

    return (
        <div className="space-y-6">
            {/* Overview */}
            <div className="glass rounded-2xl p-6 border border-white/10">
                <h3 className="text-sm font-semibold text-hc-textSecondary mb-3">Overview</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-hc-textSecondary">Total Workouts</span>
                        <span className="text-hc-text font-semibold">{workouts?.length ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-hc-textSecondary">Active Clients</span>
                        <span className="text-hc-text font-semibold">{clients?.length ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-hc-textSecondary">Exercise Library</span>
                        <span className="text-hc-text font-semibold">{exercises?.length ?? 0}</span>
                    </div>
                </div>
            </div>

            {/* Admin Navigation */}
            <div className="glass rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold gradient-text">Admin</h1>
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={() => setActiveSection(activeSection === 'analytics' ? null : 'analytics')}
                            className={`px-4 py-2 rounded-lg transition-all ${
                                activeSection === 'analytics'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-300 hover:bg-white/10'
                            }`}
                        >
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveSection(activeSection === 'forms' ? null : 'forms')}
                            className={`px-4 py-2 rounded-lg transition-all ${
                                activeSection === 'forms'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-300 hover:bg-white/10'
                            }`}
                        >
                            Forms
                        </button>
                    </div>
                </div>
            </div>

            {/* Analytics Section - Contains all current information */}
            {activeSection === 'analytics' && (
                <div className="space-y-6">
                    <ClientSessionStats 
                        clients={clients}
                        workouts={workouts}
                        exercises={exercises}
                    />
                </div>
            )}

            {/* Forms Section */}
            {activeSection === 'forms' && (
                <Forms />
            )}

            {/* Empty state when no section is selected */}
            {!activeSection && (
                <div className="glass rounded-2xl p-12 border border-white/10 text-center">
                    <p className="text-gray-400 text-lg">Select a section to view content</p>
                </div>
            )}
        </div>
    );
};
