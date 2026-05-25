import { useState } from 'react';
import { Button } from '../UI/Button';
import { addClientQuestionnaire, isSupabaseConfigured } from '../../utils/supabase';

export const SignUpForm = () => {
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
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'

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
        setSubmitStatus(null);

        try {
            // Check if Supabase is configured
            if (!isSupabaseConfigured) {
                throw new Error('Supabase is not configured. Please set up your environment variables.');
            }

            // Submit to Supabase
            await addClientQuestionnaire(formData);
            
            setSubmitStatus('success');
            
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
            setSubmitStatus('error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold gradient-text">Exercise Pre-Screening Questionnaire</h1>
                    <p className="mt-2 text-gray-200">Please complete this form to help us understand your fitness needs and medical history</p>
                </div>

                {/* Disclaimer */}
                <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-red-300 mb-2">Important Medical Disclaimer</h3>
                            <div className="text-sm text-red-200">
                                <p className="mb-2">This questionnaire is designed to help us understand your medical history and fitness needs. It is not a substitute for professional medical advice.</p>
                                <p className="mb-2">Please disclose ALL existing medical conditions to ensure your safety during physical activity.</p>
                                <p className="font-medium">If you have any concerns about your health or fitness, please consult with your healthcare provider before starting any exercise program.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white border-b-2 border-purple-500 pb-2">Personal Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-100 mb-1">First name</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                    placeholder="Enter your first name"
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-100 mb-1">Last name</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                    placeholder="Enter your last name"
                                />
                            </div>
                            <div>
                                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-100 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    required
                                    value={formData.dateOfBirth}
                                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                    className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="gender" className="block text-sm font-medium text-gray-100 mb-1">Gender</label>
                                <select
                                    id="gender"
                                    required
                                    value={formData.gender}
                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                    className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                >
                                    <option value="">Select your gender</option>
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                    <option value="Other">Other</option>
                                    <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-100 mb-1">Email address</label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                    placeholder="Enter your email address"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Medical Conditions */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white border-b-2 border-purple-500 pb-2">Medical Conditions</h2>
                        <p className="text-sm text-gray-200">Please check all that apply:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                <div key={key} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={key}
                                        checked={formData.medicalConditions[key]}
                                        onChange={(e) => handleInputChange(`medicalConditions.${key}`, e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <label htmlFor={key} className="ml-2 text-sm text-gray-100">{label}</label>
                                </div>
                            ))}
                        </div>
                        <div>
                            <label htmlFor="medicalDetails" className="block text-sm font-medium text-gray-100 mb-1">Additional Medical Information</label>
                            <textarea
                                id="medicalDetails"
                                rows="3"
                                value={formData.medicalDetails}
                                onChange={(e) => handleInputChange('medicalDetails', e.target.value)}
                                className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                placeholder="Please provide any additional medical information"
                            />
                        </div>
                    </div>

                    {/* Fitness Information */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white border-b-2 border-purple-500 pb-2">Fitness Information</h2>
                        <div>
                            <label htmlFor="fitnessLevel" className="block text-sm font-medium text-gray-100 mb-1">Current Fitness Level (1-10)</label>
                            <input
                                type="number"
                                id="fitnessLevel"
                                min="1"
                                max="10"
                                value={formData.fitnessLevel}
                                onChange={(e) => handleInputChange('fitnessLevel', e.target.value)}
                                className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                placeholder="Enter a number between 1 and 10"
                            />
                            <p className="mt-1 text-sm text-gray-200">1 being very sedentary, 10 being extremely active</p>
                        </div>
                        <div>
                            <label htmlFor="currentActivities" className="block text-sm font-medium text-gray-100 mb-1">Current Physical Activities</label>
                            <textarea
                                id="currentActivities"
                                rows="2"
                                value={formData.currentActivities}
                                onChange={(e) => handleInputChange('currentActivities', e.target.value)}
                                className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                placeholder="What physical activities or sports do you currently engage in?"
                            />
                        </div>
                        <div>
                            <label htmlFor="exerciseHistory" className="block text-sm font-medium text-gray-100 mb-1">Exercise History</label>
                            <textarea
                                id="exerciseHistory"
                                rows="2"
                                value={formData.exerciseHistory}
                                onChange={(e) => handleInputChange('exerciseHistory', e.target.value)}
                                className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                placeholder="Describe your previous exercise experience"
                            />
                        </div>
                        <div>
                            <label htmlFor="trainerExperience" className="block text-sm font-medium text-gray-100 mb-1">Previous Trainer Experience</label>
                            <textarea
                                id="trainerExperience"
                                rows="2"
                                value={formData.trainerExperience}
                                onChange={(e) => handleInputChange('trainerExperience', e.target.value)}
                                className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                placeholder="Have you worked with a personal trainer before? If yes, please describe"
                            />
                        </div>
                    </div>

                    {/* Goals */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white border-b-2 border-purple-500 pb-2">Fitness Goals</h2>
                        <div>
                            <label htmlFor="goals" className="block text-sm font-medium text-gray-100 mb-1">What are your fitness goals?</label>
                            <textarea
                                id="goals"
                                rows="3"
                                value={formData.goals}
                                onChange={(e) => handleInputChange('goals', e.target.value)}
                                className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                placeholder="Describe your fitness goals and what you hope to achieve"
                            />
                        </div>
                        <div>
                            <label htmlFor="timeframe" className="block text-sm font-medium text-gray-100 mb-1">Goal Timeframe</label>
                            <input
                                type="text"
                                id="timeframe"
                                value={formData.timeframe}
                                onChange={(e) => handleInputChange('timeframe', e.target.value)}
                                className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                placeholder="When would you like to achieve these goals?"
                            />
                        </div>
                        <div>
                            <label htmlFor="importance" className="block text-sm font-medium text-gray-100 mb-1">Goal Importance (1-10)</label>
                            <input
                                type="number"
                                id="importance"
                                min="1"
                                max="10"
                                value={formData.importance}
                                onChange={(e) => handleInputChange('importance', e.target.value)}
                                className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                placeholder="How important are these goals to you?"
                            />
                        </div>
                    </div>

                    {/* Agreement */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white border-b-2 border-purple-500 pb-2">Agreement</h2>
                        <div className="glass rounded-lg p-4 border border-white/10">
                            <p className="text-sm text-gray-100">
                                I confirm that all information provided is accurate to the best of my knowledge. I understand that I should inform my trainer of any changes to my medical condition and complete a new questionnaire if necessary. I acknowledge that participating in physical activity carries inherent risks, and I accept responsibility for these risks. I understand that Fusion Strength & Conditioning will exercise due care at all times.
                            </p>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="agreement"
                                required
                                checked={formData.agreement}
                                onChange={(e) => handleInputChange('agreement', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="agreement" className="ml-2 text-sm text-gray-100">I agree to the terms above</label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Questionnaire'}
                        </Button>
                    </div>

                    {/* Success/Error Messages */}
                    {submitStatus === 'success' && (
                        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                            <p className="text-green-300">Form submitted successfully! Thank you for completing the questionnaire.</p>
                        </div>
                    )}
                    {submitStatus === 'error' && (
                        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                            <p className="text-red-300">There was an error submitting your form. Please try again.</p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};
