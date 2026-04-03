import { useState } from 'react';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';

export const ClientForm = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const [formData, setFormData] = useState(initialData || {
        name: '',
        email: '',
        phone: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateField = (name, value) => {
        const newErrors = { ...errors };
        
        switch (name) {
            case 'name':
                if (!value.trim()) {
                    newErrors.name = 'Name is required';
                } else if (value.trim().length < 2) {
                    newErrors.name = 'Name must be at least 2 characters';
                } else {
                    delete newErrors.name;
                }
                break;
            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    newErrors.email = 'Please enter a valid email address';
                } else {
                    delete newErrors.email;
                }
                break;
            case 'phone':
                if (value && !/^[\d\s\-+()]+$/.test(value)) {
                    newErrors.phone = 'Please enter a valid phone number';
                } else {
                    delete newErrors.phone;
                }
                break;
            default:
                break;
        }
        
        setErrors(newErrors);
        return !newErrors[name];
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const validateForm = () => {
        const isValid = validateField('name', formData.name);
        if (formData.email) validateField('email', formData.email);
        if (formData.phone) validateField('phone', formData.phone);
        return isValid && Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
            setFormData({ name: '', email: '', phone: '', notes: '' });
            setErrors({});
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Client' : 'Add New Client'} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={(e) => validateField('name', e.target.value)}
                        required
                        aria-invalid={errors.name ? 'true' : 'false'}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                        className={`w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 ${errors.name ? 'border-2 border-red-500' : ''}`}
                        placeholder="Client name"
                    />
                    {errors.name && (
                        <p id="name-error" className="mt-1 text-sm text-red-400" role="alert">
                            {errors.name}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={(e) => validateField('email', e.target.value)}
                        aria-invalid={errors.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        className={`w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 ${errors.email ? 'border-2 border-red-500' : ''}`}
                        placeholder="client@example.com"
                    />
                    {errors.email && (
                        <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">
                        Phone
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={(e) => validateField('phone', e.target.value)}
                        aria-invalid={errors.phone ? 'true' : 'false'}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                        className={`w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 ${errors.phone ? 'border-2 border-red-500' : ''}`}
                        placeholder="+1 (555) 123-4567"
                    />
                    {errors.phone && (
                        <p id="phone-error" className="mt-1 text-sm text-red-400" role="alert">
                            {errors.phone}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium mb-2">
                        Notes
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 resize-none"
                        placeholder="Additional notes about the client..."
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <Button type="submit" variant="primary" loading={loading} className="flex-1">
                        {initialData ? 'Update Client' : 'Add Client'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
