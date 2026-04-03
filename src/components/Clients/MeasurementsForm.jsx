import React, { useState, useEffect } from 'react';
import { Button } from '../UI/Button';

const toFormValue = (v) => (v != null && v !== '' ? String(v) : '');

const SKINFOLD_SITES = ['chest', 'abdominal', 'thigh', 'tricep', 'subscapular', 'suprailiac'];
const SKINFOLD_LABELS = {
  chest: 'Chest',
  abdominal: 'Abdominal',
  thigh: 'Thigh',
  tricep: 'Tricep',
  subscapular: 'Subscapular',
  suprailiac: 'Suprailiac',
};
const SKINFOLD_LEGACY_FIELD = {
  chest: 'chestSkinfold',
  abdominal: 'abdominalSkinfold',
  thigh: 'thighSkinfold',
  tricep: 'tricepSkinfold',
  subscapular: 'subscapularSkinfold',
  suprailiac: 'suprailiacSkinfold',
};

const emptySkinFolds = () =>
  SKINFOLD_SITES.reduce((acc, site) => {
    acc[site] = ['', '', ''];
    return acc;
  }, {});

const skinfoldReadingsToForm = (readings) => {
  const next = emptySkinFolds();
  if (!readings || typeof readings !== 'object') return next;
  for (const site of SKINFOLD_SITES) {
    const arr = readings[site];
    if (!Array.isArray(arr)) continue;
    for (let i = 0; i < 3; i++) {
      next[site][i] = arr[i] != null && arr[i] !== '' ? String(arr[i]) : '';
    }
  }
  return next;
};

const skinFoldsFromInitialData = (data) => {
  if (!data) return emptySkinFolds();
  const sr = data.skinfoldReadings;
  if (sr && typeof sr === 'object' && !Array.isArray(sr)) {
    return skinfoldReadingsToForm(sr);
  }
  const next = emptySkinFolds();
  for (const site of SKINFOLD_SITES) {
    const legacy = data[SKINFOLD_LEGACY_FIELD[site]];
    if (legacy != null && legacy !== '') next[site][0] = toFormValue(legacy);
  }
  return next;
};

const getDefaultDate = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};
const getDefaultTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Show stored instant in the user's local calendar + clock (avoid mixing UTC date with local time). */
const timestampToLocalDateAndTime = (timestamp) => {
  if (timestamp == null || timestamp === '') return { date: getDefaultDate(), time: getDefaultTime() };
  const d = new Date(Number(timestamp));
  if (Number.isNaN(d.getTime())) return { date: getDefaultDate(), time: getDefaultTime() };
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { date, time };
};

const DATE_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_INPUT_RE = /^(\d{1,2}):(\d{2})$/;

/** Combine local calendar date + local time into UTC millis for storage. */
const parseLocalDateTimeToUtcMillis = (dateStr, timeStr) => {
  const ds = dateStr?.trim();
  const ts = timeStr?.trim();
  if (!ds || !ts) return { ok: false, error: 'dateTime', ms: null };
  const dm = ds.match(DATE_INPUT_RE);
  if (!dm) return { ok: false, error: 'date', ms: null };
  const tm = ts.match(TIME_INPUT_RE);
  if (!tm) return { ok: false, error: 'time', ms: null };
  const y = parseInt(dm[1], 10);
  const mo = parseInt(dm[2], 10) - 1;
  const day = parseInt(dm[3], 10);
  const hh = parseInt(tm[1], 10);
  const mm = parseInt(tm[2], 10);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return { ok: false, error: 'time', ms: null };
  const dt = new Date(y, mo, day, hh, mm, 0, 0);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== day) {
    return { ok: false, error: 'date', ms: null };
  }
  return { ok: true, ms: dt.getTime() };
};

export const MeasurementsForm = ({ onSubmit, onCancel, initialData = null, settings = { weightUnit: 'kg', lengthUnit: 'cm' } }) => {
  const initialDateTime = timestampToLocalDateAndTime(initialData?.date ?? initialData?.createdAt);
  const [formData, setFormData] = useState({
    date: initialDateTime.date,
    time: initialDateTime.time,
    weight: toFormValue(initialData?.weight),
    neck: toFormValue(initialData?.neck),
    shoulders: toFormValue(initialData?.shoulders),
    chest: toFormValue(initialData?.chest),
    waist: toFormValue(initialData?.waist),
    hips: toFormValue(initialData?.hips),
    thigh: toFormValue(initialData?.thigh),
    thighLower: toFormValue(initialData?.thighLower),
    arm: toFormValue(initialData?.arm),
    skinFolds: skinFoldsFromInitialData(initialData),
    notes: initialData?.notes || ''
  });

  const [errors, setErrors] = useState({});
  const [openSections, setOpenSections] = useState({
    weight: true,
    girth: false,
    skinfolds: false
  });

  // Update form data when initialData changes (for editing)
  // Using a key prop on the parent component is preferred, but for now we'll use a ref to track previous initialData
  const prevInitialDataRef = React.useRef();
  useEffect(() => {
    const syncKey = initialData
      ? `${initialData.id ?? ''}:${initialData.updatedAt ?? initialData.updated_at ?? ''}:${initialData.date ?? ''}`
      : 'new';
    if (syncKey !== prevInitialDataRef.current) {
      prevInitialDataRef.current = syncKey;
      const { date, time } = timestampToLocalDateAndTime(initialData?.date ?? initialData?.createdAt);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        date,
        time,
        weight: toFormValue(initialData?.weight),
        neck: toFormValue(initialData?.neck),
        shoulders: toFormValue(initialData?.shoulders),
        chest: toFormValue(initialData?.chest),
        waist: toFormValue(initialData?.waist),
        hips: toFormValue(initialData?.hips),
        thigh: toFormValue(initialData?.thigh),
        thighLower: toFormValue(initialData?.thighLower),
        arm: toFormValue(initialData?.arm),
        skinFolds: skinFoldsFromInitialData(initialData),
        notes: toFormValue(initialData?.notes)
      });
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const skinfoldErrorKey = (site, index) => `skinfold_${site}_${index}`;

  const handleSkinFoldChange = (site, index, value) => {
    setFormData((prev) => {
      const row = Array.isArray(prev.skinFolds?.[site]) ? prev.skinFolds[site] : ['', '', ''];
      return {
        ...prev,
        skinFolds: {
          ...emptySkinFolds(),
          ...prev.skinFolds,
          [site]: row.map((cell, i) => (i === index ? value : cell)),
        },
      };
    });
    const ek = skinfoldErrorKey(site, index);
    if (errors[ek]) {
      setErrors((prev) => ({ ...prev, [ek]: '' }));
    }
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const str = (v) => (v != null && v !== '' ? String(v).trim() : '');

  const validateForm = () => {
    const newErrors = {};

    // Weight is required (handle number from initialData when editing)
    if (!str(formData.weight)) {
      newErrors.weight = 'Weight is required';
    } else if (isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'Please enter a valid weight';
    }

    // Validate numeric fields (optional but must be valid if provided)
    const numericFields = ['neck', 'shoulders', 'chest', 'waist', 'hips', 'thigh', 'thighLower', 'arm'];
    numericFields.forEach(field => {
      const val = formData[field];
      if (str(val) && (isNaN(parseFloat(val)) || parseFloat(val) <= 0)) {
        newErrors[field] = 'Please enter a valid measurement';
      }
    });

    for (const site of SKINFOLD_SITES) {
      for (let i = 0; i < 3; i++) {
        const val = formData.skinFolds[site][i];
        const ek = skinfoldErrorKey(site, i);
        if (str(val) && (isNaN(parseFloat(val)) || parseFloat(val) <= 0)) {
          newErrors[ek] = 'Please enter a valid measurement';
        }
      }
    }

    const parsed = parseLocalDateTimeToUtcMillis(formData.date, formData.time);
    if (!parsed.ok) {
      if (parsed.error === 'dateTime') {
        newErrors.date = 'Required';
        newErrors.time = 'Required';
      } else if (parsed.error === 'date') {
        newErrors.date = 'Use YYYY-MM-DD (local date)';
      } else {
        newErrors.time = 'Use HH:MM (24-hour, local time)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      const parsed = parseLocalDateTimeToUtcMillis(formData.date, formData.time);
      if (!parsed.ok) return;
      const dateTimestamp = parsed.ms;
      const { skinFolds, date: _dateStr, time: _timeStr, ...formRest } = formData;
      const submissionData = {
        ...formRest,
        date: dateTimestamp,
        weight: parseFloat(formData.weight),
        neck: formData.neck ? parseFloat(formData.neck) : null,
        shoulders: formData.shoulders ? parseFloat(formData.shoulders) : null,
        chest: formData.chest ? parseFloat(formData.chest) : null,
        waist: formData.waist ? parseFloat(formData.waist) : null,
        hips: formData.hips ? parseFloat(formData.hips) : null,
        thigh: formData.thigh ? parseFloat(formData.thigh) : null,
        thighLower: formData.thighLower ? parseFloat(formData.thighLower) : null,
        arm: formData.arm ? parseFloat(formData.arm) : null,
        skinfoldReadings: SKINFOLD_SITES.reduce((acc, site) => {
          acc[site] = [0, 1, 2].map((idx) => {
            const v = str(formData.skinFolds[site][idx]);
            return v ? parseFloat(v) : null;
          });
          return acc;
        }, {}),
        id: initialData?.id || null
      };

      await onSubmit(submissionData);
    }
  };

  const weightFields = [
    { key: 'weight', label: 'Weight', required: true, unit: settings.weightUnit }
  ];

  const girthFields = [
    { key: 'neck', label: 'Neck', required: false, unit: settings.lengthUnit },
    { key: 'shoulders', label: 'Shoulders', required: false, unit: settings.lengthUnit },
    { key: 'chest', label: 'Chest', required: false, unit: settings.lengthUnit },
    { key: 'waist', label: 'Waist', required: false, unit: settings.lengthUnit },
    { key: 'hips', label: 'Hips', required: false, unit: settings.lengthUnit },
    { key: 'thigh', label: 'Thigh (Upper)', required: false, unit: settings.lengthUnit },
    { key: 'thighLower', label: 'Thigh (Lower)', required: false, unit: settings.lengthUnit },
    { key: 'arm', label: 'Arm', required: false, unit: settings.lengthUnit }
  ];

  const renderField = (field) => (
    <div key={field.key}>
      <label htmlFor={field.key} className="block text-sm font-medium text-hc-textSecondary mb-1">
        {field.label} {field.required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <input
          id={field.key}
          type="number"
          step="0.1"
          min="0"
          value={formData[field.key]}
          onChange={(e) => handleInputChange(field.key, e.target.value)}
          className={`w-full px-3 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 ${errors[field.key] ? 'border-red-500' : ''}`}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-hc-textSecondary text-sm">{field.unit}</span>
        </div>
      </div>
      {errors[field.key] && (
        <p className="mt-1 text-sm text-red-400">{errors[field.key]}</p>
      )}
    </div>
  );

  const renderSkinfoldSite = (site) => {
    const label = SKINFOLD_LABELS[site];
    return (
      <div key={site} className="space-y-2">
        <p className="text-sm font-medium text-hc-textSecondary">{label}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((idx) => {
            const inputId = `${site}Skinfold_${idx + 1}`;
            const ek = skinfoldErrorKey(site, idx);
            return (
              <div key={ek}>
                <label htmlFor={inputId} className="block text-xs text-gray-400 mb-1">
                  Reading {idx + 1}
                </label>
                <div className="relative">
                  <input
                    id={inputId}
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.skinFolds[site][idx]}
                    onChange={(e) => handleSkinFoldChange(site, idx, e.target.value)}
                    className={`w-full px-3 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 ${errors[ek] ? 'border border-red-500' : ''}`}
                    placeholder="mm"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-hc-textSecondary text-sm">mm</span>
                  </div>
                </div>
                {errors[ek] && <p className="mt-1 text-sm text-red-400">{errors[ek]}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSkinfoldsAccordion = () => (
    <div className="border border-gray-700 rounded-lg mb-4">
      <button
        type="button"
        onClick={() => toggleSection('skinfolds')}
        className="w-full px-4 py-3 text-left glass hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset rounded-t-lg transition-colors"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-white">Skinfolds</h4>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${openSections.skinfolds ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {openSections.skinfolds && (
        <div className="p-3 sm:p-4 bg-gray-900/50 rounded-b-lg">
          <p className="text-xs text-gray-500 mb-3">Up to three readings per site (e.g. triplicate protocol).</p>
          <div className="flex flex-col gap-4 sm:gap-5">{SKINFOLD_SITES.map(renderSkinfoldSite)}</div>
        </div>
      )}
    </div>
  );

  const renderAccordionSection = (sectionKey, title, fields) => (
    <div className="border border-gray-700 rounded-lg mb-4">
      <button
        type="button"
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-4 py-3 text-left glass hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset rounded-t-lg transition-colors"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-white">{title}</h4>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${openSections[sectionKey] ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {openSections[sectionKey] && (
        <div className="p-3 sm:p-4 bg-gray-900/50 rounded-b-lg">
          <div className="flex flex-col gap-3 sm:gap-4">
            {fields.map(renderField)}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gray-900/30 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">
          {initialData ? 'Edit Measurements' : 'Add Measurements'}
        </h3>
        <button
          onClick={onCancel}
          aria-label="Close measurements form"
          className="text-gray-400 hover:text-gray-200 transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <label htmlFor="measurement-date" className="block text-sm font-medium text-hc-textSecondary mb-1">
              Date
            </label>
            <input
              id="measurement-date"
              type="text"
              value={formData.date ?? ''}
              onChange={(e) => handleInputChange('date', e.target.value)}
              placeholder="YYYY-MM-DD (your local date)"
              className={`w-full px-3 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 ${errors.date ? 'border border-red-500' : ''}`}
            />
            {errors.date && <p className="mt-1 text-sm text-red-400">{errors.date}</p>}
          </div>
          <div>
            <label htmlFor="measurement-time" className="block text-sm font-medium text-hc-textSecondary mb-1">
              Time
            </label>
            <input
              id="measurement-time"
              type="text"
              value={formData.time ?? ''}
              onChange={(e) => handleInputChange('time', e.target.value)}
              placeholder="HH:MM (24h, local time)"
              className={`w-full px-3 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 ${errors.time ? 'border border-red-500' : ''}`}
            />
            {errors.time && <p className="mt-1 text-sm text-red-400">{errors.time}</p>}
          </div>
        </div>

        {renderAccordionSection('weight', 'Weight', weightFields)}
        {renderAccordionSection('girth', 'Girth Measurements', girthFields)}
        {renderSkinfoldsAccordion()}

        <div>
          <label className="block text-sm font-medium text-hc-textSecondary mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 resize-none"
            placeholder="Add any additional notes about the measurements..."
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
          >
            {initialData ? 'Update' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
};
