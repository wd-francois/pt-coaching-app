import { useState } from 'react';
import { Button } from '../UI/Button';

const SKINFOLD_ROWS = [
  { site: 'chest', label: 'Chest', legacyKey: 'chestSkinfold' },
  { site: 'abdominal', label: 'Abdominal', legacyKey: 'abdominalSkinfold' },
  { site: 'thigh', label: 'Thigh', legacyKey: 'thighSkinfold' },
  { site: 'tricep', label: 'Tricep', legacyKey: 'tricepSkinfold' },
  { site: 'subscapular', label: 'Subscapular', legacyKey: 'subscapularSkinfold' },
  { site: 'suprailiac', label: 'Suprailiac', legacyKey: 'suprailiacSkinfold' },
];

const formatSkinfoldReadingsLine = (readings, legacySingle) => {
  if (readings && Array.isArray(readings)) {
    const parts = readings.map((v) =>
      v != null && v !== '' && !Number.isNaN(Number(v)) ? String(v) : null
    );
    if (parts.some(Boolean)) {
      const filled = parts.filter(Boolean);
      if (filled.length === 1) return filled[0];
      return parts.map((p) => p ?? '—').join(' / ');
    }
  }
  if (legacySingle != null && legacySingle !== '') return String(legacySingle);
  return null;
};

export const MeasurementsList = ({ measurements, onEdit, onDelete, settings = { weightUnit: 'kg', lengthUnit: 'cm' } }) => {
  const [expandedId, setExpandedId] = useState(null);

  if (!measurements || measurements.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No measurements recorded yet.</p>
        <p className="text-sm text-gray-500 mt-2">Add your first measurement to start tracking progress.</p>
      </div>
    );
  }

  // Sort measurements by date (newest first)
  const sortedMeasurements = [...measurements].sort((a, b) => {
    const dateA = a.date || a.createdAt || 0;
    const dateB = b.date || b.createdAt || 0;
    return dateB - dateA;
  });

  const formatDateAndTime = (timestamp) => {
    if (!timestamp) return 'No date';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderMeasurementValue = (value, unit) => {
    if (value === null || value === undefined || value === '') return '-';
    return `${value} ${unit}`;
  };

  return (
    <div className="space-y-4">
      {sortedMeasurements.map((measurement) => {
        const isExpanded = expandedId === measurement.id;
        const hasGirth = measurement.neck || measurement.shoulders || measurement.chest || 
                        measurement.waist || measurement.hips || measurement.thigh || measurement.thighLower || measurement.arm;
        const hasSkinfolds = SKINFOLD_ROWS.some(
          ({ site, legacyKey }) =>
            formatSkinfoldReadingsLine(measurement.skinfoldReadings?.[site], measurement[legacyKey]) != null
        );

        return (
          <div key={measurement.id} className="glass rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white">
                  {formatDateAndTime(measurement.date || measurement.createdAt)}
                </h4>
                {((measurement.weight != null && measurement.weight !== '') || hasGirth || hasSkinfolds || measurement.notes) && (
                  <button
                    onClick={() => toggleExpand(measurement.id)}
                    className="mt-2 text-sm text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"
                  >
                    {isExpanded ? 'Show Less' : 'Show Details'}
                    <svg
                      className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(measurement)}
                  >
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this measurement?')) {
                        onDelete(measurement.id);
                      }
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                {measurement.weight != null && measurement.weight !== '' && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Weight</h5>
                    <p className="text-sm text-white font-medium">
                      {measurement.weight} {settings.weightUnit}
                    </p>
                  </div>
                )}
                {hasGirth && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Girth Measurements</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {measurement.neck && (
                        <div>
                          <span className="text-gray-400">Neck:</span>
                          <span className="text-white ml-2">{renderMeasurementValue(measurement.neck, settings.lengthUnit)}</span>
                        </div>
                      )}
                      {measurement.shoulders && (
                        <div>
                          <span className="text-gray-400">Shoulders:</span>
                          <span className="text-white ml-2">{renderMeasurementValue(measurement.shoulders, settings.lengthUnit)}</span>
                        </div>
                      )}
                      {measurement.chest && (
                        <div>
                          <span className="text-gray-400">Chest:</span>
                          <span className="text-white ml-2">{renderMeasurementValue(measurement.chest, settings.lengthUnit)}</span>
                        </div>
                      )}
                      {measurement.waist && (
                        <div>
                          <span className="text-gray-400">Waist:</span>
                          <span className="text-white ml-2">{renderMeasurementValue(measurement.waist, settings.lengthUnit)}</span>
                        </div>
                      )}
                      {measurement.hips && (
                        <div>
                          <span className="text-gray-400">Hips:</span>
                          <span className="text-white ml-2">{renderMeasurementValue(measurement.hips, settings.lengthUnit)}</span>
                        </div>
                      )}
                      {measurement.thigh != null && measurement.thigh !== '' && (
                        <div>
                          <span className="text-gray-400">Thigh (Upper):</span>
                          <span className="text-white ml-2">{renderMeasurementValue(measurement.thigh, settings.lengthUnit)}</span>
                        </div>
                      )}
                      {measurement.thighLower != null && measurement.thighLower !== '' && (
                        <div>
                          <span className="text-gray-400">Thigh (Lower):</span>
                          <span className="text-white ml-2">{renderMeasurementValue(measurement.thighLower, settings.lengthUnit)}</span>
                        </div>
                      )}
                      {measurement.arm && (
                        <div>
                          <span className="text-gray-400">Arm:</span>
                          <span className="text-white ml-2">{renderMeasurementValue(measurement.arm, settings.lengthUnit)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {hasSkinfolds && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Skinfolds</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {SKINFOLD_ROWS.map(({ site, label, legacyKey }) => {
                        const line = formatSkinfoldReadingsLine(
                          measurement.skinfoldReadings?.[site],
                          measurement[legacyKey]
                        );
                        if (!line) return null;
                        return (
                          <div key={site}>
                            <span className="text-gray-400">{label}:</span>
                            <span className="text-white ml-2">
                              {line} mm
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {measurement.notes && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Notes</h5>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{measurement.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
