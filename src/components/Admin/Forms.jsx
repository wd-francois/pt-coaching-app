import { useState } from 'react';
import { QuestionnaireList } from './QuestionnaireList';

export const Forms = () => {
    const [activeSection, setActiveSection] = useState('submissions');

    return (
        <div className="space-y-6">
            {/* Forms Navigation */}
            <div className="glass rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white">Forms</h2>
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={() => {
                                // Open signup form in new page
                                window.open(`${window.location.origin}${window.location.pathname}?form=signup`, '_blank');
                            }}
                            className="px-4 py-2 rounded-lg transition-all bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            Open Sign-up form
                        </button>
                        <button
                            onClick={() => setActiveSection(activeSection === 'submissions' ? null : 'submissions')}
                            className={`px-4 py-2 rounded-lg transition-all ${
                                activeSection === 'submissions'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-300 hover:bg-white/10'
                            }`}
                        >
                            View Submissions
                        </button>
                    </div>
                </div>
            </div>

            {/* Submissions Section */}
            {activeSection === 'submissions' && (
                <QuestionnaireList />
            )}

            {/* Empty state when no section is selected */}
            {!activeSection && (
                <div className="glass rounded-2xl p-12 border border-white/10 text-center">
                    <p className="text-gray-400 text-lg">Select a section to view</p>
                </div>
            )}
        </div>
    );
};
