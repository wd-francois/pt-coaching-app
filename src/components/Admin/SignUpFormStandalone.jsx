import { useState } from 'react';
import { addClientQuestionnaire, isSupabaseConfigured } from '../../utils/supabase';
import { Modal } from '../UI/Modal';

export const SignUpFormStandalone = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        email: '',
        medicalConditions: {
            heartCondition: false,
            chestDiscomfort: false,
            asthma: false,
            diabetic: false,
            dizziness: false,
            pregnant: false,
            epilepsy: false,
            medication: false,
            smoke: false,
            injury: false,
        },
        medicalDetails: '',
        fitnessLevel: '',
        currentActivities: '',
        exerciseHistory: '',
        trainerExperience: '',
        goals: '',
        timeframe: '',
        importance: '',
        agreement: false,
    });

    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleInputChange = (field, value) => {
        if (field.startsWith('medicalConditions.')) {
            const condition = field.split('.')[1];
            setFormData(prev => ({
                ...prev,
                medicalConditions: {
                    ...prev.medicalConditions,
                    [condition]: value,
                },
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setShowSuccessModal(false);
        setShowErrorModal(false);

        try {
            if (!isSupabaseConfigured) {
                throw new Error('Service is temporarily unavailable. Please try again later.');
            }

            await addClientQuestionnaire(formData);
            
            setShowSuccessModal(true);
            
            // Reset form after successful submission
            setFormData({
                firstName: '',
                lastName: '',
                dateOfBirth: '',
                gender: '',
                email: '',
                medicalConditions: {
                    heartCondition: false,
                    chestDiscomfort: false,
                    asthma: false,
                    diabetic: false,
                    dizziness: false,
                    pregnant: false,
                    epilepsy: false,
                    medication: false,
                    smoke: false,
                    injury: false,
                },
                medicalDetails: '',
                fitnessLevel: '',
                currentActivities: '',
                exerciseHistory: '',
                trainerExperience: '',
                goals: '',
                timeframe: '',
                importance: '',
                agreement: false,
            });
        } catch (error) {
            console.error('Error submitting form:', error);
            setErrorMessage(error.message || 'There was an error submitting your form. Please try again.');
            setShowErrorModal(true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        // If opened in a new window, close it
        if (window.opener) {
            window.close();
        } else {
            // Remove the form parameter from URL and navigate to admin/forms
            const url = new URL(window.location.href);
            url.searchParams.delete('form');
            // Navigate to the same page without the form parameter, which will show the normal app
            window.history.pushState({}, '', url.pathname);
            window.location.reload();
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 overflow-y-auto">
            <div className="max-w-5xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8 relative">
                {/* Close Button (X) - Top Right */}
                <button
                    onClick={handleBack}
                    className="absolute top-4 right-4 p-2 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-all z-10"
                    title="Close form"
                    aria-label="Close form"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Back Button - Top Left */}
                <div className="mb-6">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-4 py-2 text-gray-100 hover:text-white hover:bg-white/10 rounded-lg transition-all group"
                        title="Go back to Forms"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="font-medium">Back to Forms</span>
                    </button>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
                        Exercise Pre-Screening Questionnaire
                    </h1>
                    <p className="text-lg text-gray-100">
                        Please complete this form to help us understand your fitness needs and medical history
                    </p>
                </div>

                {/* Form Container */}
                <div className="bg-white/5 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 lg:p-10">
                    {/* Disclaimer */}
                    <div className="bg-red-500/10 border-l-4 border-red-500 p-5 mb-8 rounded-xl">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-red-300 mb-2">Important Medical Disclaimer</h3>
                                <div className="text-sm text-red-200 space-y-1">
                                    <p>This questionnaire is designed to help us understand your medical history and fitness needs. It is not a substitute for professional medical advice.</p>
                                    <p>Please disclose ALL existing medical conditions to ensure your safety during physical activity.</p>
                                    <p className="font-medium">If you have any concerns about your health or fitness, please consult with your healthcare provider before starting any exercise program.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Personal Information */}
                        <div className="space-y-5">
                            <h2 className="text-2xl font-bold text-white border-b-2 border-purple-500 pb-3">Personal Information</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-200 mb-2">First name *</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        required
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                                        placeholder="Enter your first name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-200 mb-2">Last name *</label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        required
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                        className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                                        placeholder="Enter your last name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-200 mb-2">Date of Birth *</label>
                                    <input
                                        type="date"
                                        id="dateOfBirth"
                                        required
                                        value={formData.dateOfBirth}
                                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                        className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="gender" className="block text-sm font-semibold text-gray-200 mb-2">Gender *</label>
                                    <select
                                        id="gender"
                                        required
                                        value={formData.gender}
                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                        className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white transition-all"
                                    >
                                        <option value="" className="bg-gray-800">Select your gender</option>
                                        <option value="Female" className="bg-gray-800">Female</option>
                                        <option value="Male" className="bg-gray-800">Male</option>
                                        <option value="Other" className="bg-gray-800">Other</option>
                                        <option value="Prefer not to say" className="bg-gray-800">Prefer not to say</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-200 mb-2">Email address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                                        placeholder="Enter your email address"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Medical Conditions */}
                        <div className="space-y-5">
                            <h2 className="text-2xl font-bold text-white border-b-2 border-purple-500 pb-3">Medical Conditions</h2>
                            <p className="text-sm text-gray-100">Please check all that apply:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries({
                                    heartCondition: 'Heart Condition',
                                    chestDiscomfort: 'Chest Discomfort',
                                    asthma: 'Asthma',
                                    diabetic: 'Diabetes',
                                    dizziness: 'Dizziness/Fainting',
                                    pregnant: 'Pregnant',
                                    epilepsy: 'Epilepsy',
                                    medication: 'Prescribed Medication',
                                    smoke: 'Do you smoke?',
                                    injury: 'Injury or Pain',
                                }).map(([key, label]) => (
                                    <div key={key} className="flex items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                        <input
                                            type="checkbox"
                                            id={key}
                                            checked={formData.medicalConditions[key]}
                                            onChange={(e) => handleInputChange(`medicalConditions.${key}`, e.target.checked)}
                                            className="h-5 w-5 rounded border-gray-400 text-purple-600 focus:ring-purple-500 focus:ring-2 cursor-pointer"
                                        />
                                        <label htmlFor={key} className="ml-3 text-sm font-medium text-gray-200 cursor-pointer">{label}</label>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label htmlFor="medicalDetails" className="block text-sm font-semibold text-gray-200 mb-2">Additional Medical Information</label>
                                <textarea
                                    id="medicalDetails"
                                    rows="4"
                                    value={formData.medicalDetails}
                                    onChange={(e) => handleInputChange('medicalDetails', e.target.value)}
                                    className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all resize-none"
                                    placeholder="Please provide any additional medical information"
                                />
                            </div>
                        </div>

                        {/* Fitness Information */}
                        <div className="space-y-5">
                            <h2 className="text-2xl font-bold text-white border-b-2 border-purple-500 pb-3">Fitness Information</h2>
                            <div>
                                <label htmlFor="fitnessLevel" className="block text-sm font-semibold text-gray-200 mb-2">Current Fitness Level (1-10)</label>
                                <input
                                    type="number"
                                    id="fitnessLevel"
                                    min="1"
                                    max="10"
                                    value={formData.fitnessLevel}
                                    onChange={(e) => handleInputChange('fitnessLevel', e.target.value)}
                                    className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                                    placeholder="Enter a number between 1 and 10"
                                />
                                <p className="mt-2 text-sm text-gray-200">1 being very sedentary, 10 being extremely active</p>
                            </div>
                            <div>
                                <label htmlFor="currentActivities" className="block text-sm font-semibold text-gray-200 mb-2">Current Physical Activities</label>
                                <textarea
                                    id="currentActivities"
                                    rows="3"
                                    value={formData.currentActivities}
                                    onChange={(e) => handleInputChange('currentActivities', e.target.value)}
                                    className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all resize-none"
                                    placeholder="What physical activities or sports do you currently engage in?"
                                />
                            </div>
                            <div>
                                <label htmlFor="exerciseHistory" className="block text-sm font-semibold text-gray-200 mb-2">Exercise History</label>
                                <textarea
                                    id="exerciseHistory"
                                    rows="3"
                                    value={formData.exerciseHistory}
                                    onChange={(e) => handleInputChange('exerciseHistory', e.target.value)}
                                    className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all resize-none"
                                    placeholder="Describe your previous exercise experience"
                                />
                            </div>
                            <div>
                                <label htmlFor="trainerExperience" className="block text-sm font-semibold text-gray-200 mb-2">Previous Trainer Experience</label>
                                <textarea
                                    id="trainerExperience"
                                    rows="3"
                                    value={formData.trainerExperience}
                                    onChange={(e) => handleInputChange('trainerExperience', e.target.value)}
                                    className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all resize-none"
                                    placeholder="Have you worked with a personal trainer before? If yes, please describe"
                                />
                            </div>
                        </div>

                        {/* Goals */}
                        <div className="space-y-5">
                            <h2 className="text-2xl font-bold text-white border-b-2 border-purple-500 pb-3">Fitness Goals</h2>
                            <div>
                                <label htmlFor="goals" className="block text-sm font-semibold text-gray-200 mb-2">What are your fitness goals?</label>
                                <textarea
                                    id="goals"
                                    rows="4"
                                    value={formData.goals}
                                    onChange={(e) => handleInputChange('goals', e.target.value)}
                                    className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all resize-none"
                                    placeholder="Describe your fitness goals and what you hope to achieve"
                                />
                            </div>
                            <div>
                                <label htmlFor="timeframe" className="block text-sm font-semibold text-gray-200 mb-2">Goal Timeframe</label>
                                <input
                                    type="text"
                                    id="timeframe"
                                    value={formData.timeframe}
                                    onChange={(e) => handleInputChange('timeframe', e.target.value)}
                                    className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                                    placeholder="When would you like to achieve these goals?"
                                />
                            </div>
                            <div>
                                <label htmlFor="importance" className="block text-sm font-semibold text-gray-200 mb-2">Goal Importance (1-10)</label>
                                <input
                                    type="number"
                                    id="importance"
                                    min="1"
                                    max="10"
                                    value={formData.importance}
                                    onChange={(e) => handleInputChange('importance', e.target.value)}
                                    className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                                    placeholder="How important are these goals to you?"
                                />
                            </div>
                        </div>

                        {/* Agreement */}
                        <div className="space-y-5">
                            <h2 className="text-2xl font-bold text-white border-b-2 border-purple-500 pb-3">Agreement</h2>
                            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                                <p className="text-sm text-gray-100 leading-relaxed">
                                    I confirm that all information provided is accurate to the best of my knowledge. I understand that I should inform my trainer of any changes to my medical condition and complete a new questionnaire if necessary. I acknowledge that participating in physical activity carries inherent risks, and I accept responsibility for these risks. I understand that Fusion Strength & Conditioning will exercise due care at all times.
                                </p>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="agreement"
                                    required
                                    checked={formData.agreement}
                                    onChange={(e) => handleInputChange('agreement', e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-400 text-purple-600 focus:ring-purple-500 focus:ring-2 mt-0.5 cursor-pointer"
                                />
                                <label htmlFor="agreement" className="text-sm font-medium text-gray-200 cursor-pointer">I agree to the terms above *</label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-center pt-6">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[200px]"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Submitting...
                                    </span>
                                ) : (
                                    'Submit Questionnaire'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Success!"
                size="sm"
            >
                <div className="text-center py-4">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-4">
                        <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-6">Form Submitted Successfully!</h3>
                    <button
                        onClick={() => setShowSuccessModal(false)}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </Modal>

            {/* Error Modal */}
            <Modal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                title="Submission Failed"
                size="sm"
            >
                <div className="text-center py-4">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 mb-4">
                        <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Error</h3>
                    <p className="text-gray-100 mb-6">{errorMessage}</p>
                    <button
                        onClick={() => setShowErrorModal(false)}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </div>
    );
};
