import React, { useState } from "react";

/**
 * AdditionalInfoTab - Handles warranty, returns, and tax settings
 * API Response Structure:
 * - pricing.tax: rate, amount, included, class
 * - warranty: has_warranty, duration, duration_unit, type, details
 * - return_policy: returnable, return_window_days, conditions
 */
const AdditionalInfoTab = ({ data, onSave, isSaving, errors = {} }) => {
    // Initialize form state from actual API response structure
    const [formData, setFormData] = useState({
        // Tax settings (from pricing.tax)
        tax_rate: data?.pricing?.tax?.rate ?? 0,
        tax_included: data?.pricing?.tax?.included ?? false,
        
        // Warranty settings (from warranty object)
        has_warranty: data?.warranty?.has_warranty ?? false,
        warranty_duration: data?.warranty?.duration ?? 0,
        warranty_duration_unit: data?.warranty?.duration_unit ?? "months",
        
        // Return settings (from return_policy object)
        returnable: data?.return_policy?.returnable ?? true,
        return_window_days: data?.return_policy?.return_window_days ?? 7,
    });

    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear errors
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleNumberChange = (field, value) => {
        const numValue = parseFloat(value) || 0;
        handleChange(field, numValue);
    };

    const handleBooleanChange = (field, value) => {
        handleChange(field, value === "true" || value === true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        
        if (formData.tax_rate < 0 || formData.tax_rate > 100) {
            newErrors.tax_rate = "Tax rate must be between 0 and 100";
        }
        
        if (formData.has_warranty && formData.warranty_duration <= 0) {
            newErrors.warranty_duration = "Warranty duration is required when warranty is enabled";
        }
        
        if (formData.returnable && formData.return_window_days <= 0) {
            newErrors.return_window_days = "Return period is required when returns are enabled";
        }

        if (Object.keys(newErrors).length > 0) {
            setValidationErrors(newErrors);
            return;
        }

        // Build payload matching actual API field names
        const payload = {
            tax_rate: formData.tax_rate,
            tax_included: formData.tax_included,
            has_warranty: formData.has_warranty,
            warranty_duration: formData.has_warranty ? formData.warranty_duration : null,
            warranty_duration_unit: formData.warranty_duration_unit,
            returnable: formData.returnable,
            return_window_days: formData.returnable ? formData.return_window_days : null,
        };

        onSave(payload);
    };

    // Merge errors
    const allErrors = { ...validationErrors, ...errors };

    // Common warranty durations
    const warrantyOptions = [
        { value: 3, label: "3 Months" },
        { value: 6, label: "6 Months" },
        { value: 12, label: "1 Year" },
        { value: 24, label: "2 Years" },
        { value: 36, label: "3 Years" },
        { value: 60, label: "5 Years" },
    ];

    // Common return periods
    const returnOptions = [
        { value: 7, label: "7 Days" },
        { value: 14, label: "14 Days" },
        { value: 30, label: "30 Days" },
        { value: 60, label: "60 Days" },
        { value: 90, label: "90 Days" },
    ];

    return (
        <form onSubmit={handleSubmit}>
            <div className="row">
                {/* Tax Settings */}
                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-header">
                            <h6 className="mb-0">
                                <i className="fas fa-percent me-2"></i>
                                Tax Settings
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Tax Rate (%)</label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        className={`form-control ${allErrors.tax_rate ? 'is-invalid' : ''}`}
                                        value={formData.tax_rate}
                                        onChange={(e) => handleNumberChange('tax_rate', e.target.value)}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                    />
                                    <span className="input-group-text">%</span>
                                    {allErrors.tax_rate && <div className="invalid-feedback">{allErrors.tax_rate}</div>}
                                </div>
                                <small className="text-muted">Enter the applicable tax rate (0-100%)</small>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Tax Included in Price?</label>
                                <div className="form-check">
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        name="tax_included"
                                        id="tax_included_yes"
                                        checked={formData.tax_included === true}
                                        onChange={() => handleBooleanChange('tax_included', true)}
                                    />
                                    <label className="form-check-label" htmlFor="tax_included_yes">
                                        Yes - Price includes tax
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        type="radio"
                                        className="form-check-input"
                                        name="tax_included"
                                        id="tax_included_no"
                                        checked={formData.tax_included === false}
                                        onChange={() => handleBooleanChange('tax_included', false)}
                                    />
                                    <label className="form-check-label" htmlFor="tax_included_no">
                                        No - Tax will be added at checkout
                                    </label>
                                </div>
                            </div>

                            {/* Tax Summary */}
                            <div className="alert alert-light border">
                                <small>
                                    <strong>Tax Info:</strong> {formData.tax_rate}% tax 
                                    {formData.tax_included ? " (included in price)" : " (added at checkout)"}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warranty Settings */}
                <div className="col-md-6">
                    <div className="card h-100">
                        <div className="card-header">
                            <h6 className="mb-0">
                                <i className="fas fa-shield-alt me-2"></i>
                                Warranty
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <div className="form-check form-switch">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="has_warranty"
                                        checked={formData.has_warranty}
                                        onChange={(e) => handleBooleanChange('has_warranty', e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="has_warranty">
                                        This product has warranty
                                    </label>
                                </div>
                            </div>

                            {formData.has_warranty && (
                                <div className="mb-3">
                                    <label className="form-label">Warranty Duration</label>
                                    <select
                                        className={`form-select ${allErrors.warranty_duration ? 'is-invalid' : ''}`}
                                        value={formData.warranty_duration}
                                        onChange={(e) => handleNumberChange('warranty_duration', e.target.value)}
                                    >
                                        <option value="0">Select duration</option>
                                        {warrantyOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                        <option value="custom">Custom...</option>
                                    </select>
                                    {allErrors.warranty_duration && (
                                        <div className="invalid-feedback">{allErrors.warranty_duration}</div>
                                    )}

                                    {!warrantyOptions.find(o => o.value === formData.warranty_duration) && formData.warranty_duration > 0 && (
                                        <div className="mt-2">
                                            <label className="form-label small">Custom Duration (months)</label>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={formData.warranty_duration}
                                                onChange={(e) => handleNumberChange('warranty_duration', e.target.value)}
                                                min="1"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Warranty Badge Preview */}
                            {formData.has_warranty && formData.warranty_duration > 0 && (
                                <div className="alert alert-success">
                                    <i className="fas fa-check-circle me-2"></i>
                                    <strong>Warranty Badge:</strong> {formData.warranty_duration} {formData.warranty_duration_unit}{formData.warranty_duration > 1 ? 's' : ''} Warranty
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Return Policy */}
                <div className="col-md-12 mt-4">
                    <div className="card">
                        <div className="card-header">
                            <h6 className="mb-0">
                                <i className="fas fa-undo me-2"></i>
                                Return Policy
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <div className="form-check form-switch">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="returnable"
                                                checked={formData.returnable}
                                                onChange={(e) => handleBooleanChange('returnable', e.target.checked)}
                                            />
                                            <label className="form-check-label" htmlFor="returnable">
                                                This product is returnable
                                            </label>
                                        </div>
                                    </div>

                                    {formData.returnable && (
                                        <div className="mb-3">
                                            <label className="form-label">Return Period</label>
                                            <select
                                                className={`form-select ${allErrors.return_window_days ? 'is-invalid' : ''}`}
                                                value={formData.return_window_days}
                                                onChange={(e) => handleNumberChange('return_window_days', e.target.value)}
                                            >
                                                <option value="0">Select period</option>
                                                {returnOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                            {allErrors.return_window_days && (
                                                <div className="invalid-feedback">{allErrors.return_window_days}</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="col-md-6">
                                    {/* Return Policy Summary */}
                                    <div className={`card ${formData.returnable ? 'bg-success text-white' : 'bg-warning'}`}>
                                        <div className="card-body text-center">
                                            {formData.returnable ? (
                                                <>
                                                    <i className="fas fa-check-circle fa-2x mb-2"></i>
                                                    <h6>Returns Accepted</h6>
                                                    <p className="mb-0">
                                                        Customers can return within {formData.return_window_days} days
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-times-circle fa-2x mb-2"></i>
                                                    <h6>Non-Returnable</h6>
                                                    <p className="mb-0">
                                                        This item cannot be returned
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Policy Summary */}
                <div className="col-md-12 mt-4">
                    <div className="card border-info">
                        <div className="card-header bg-info text-white">
                            <i className="fas fa-info-circle me-2"></i>
                            Policy Summary
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-4 text-center border-end">
                                    <i className="fas fa-percent fa-2x text-primary mb-2"></i>
                                    <h6>Tax</h6>
                                    <p className="mb-0">
                                        {formData.tax_rate}%
                                        <br />
                                        <small className="text-muted">
                                            {formData.tax_included ? "Included" : "Added at checkout"}
                                        </small>
                                    </p>
                                </div>
                                <div className="col-md-4 text-center border-end">
                                    <i className={`fas fa-shield-alt fa-2x ${formData.has_warranty ? 'text-success' : 'text-muted'} mb-2`}></i>
                                    <h6>Warranty</h6>
                                    <p className="mb-0">
                                        {formData.has_warranty 
                                            ? `${formData.warranty_duration} ${formData.warranty_duration_unit}` 
                                            : "No warranty"}
                                    </p>
                                </div>
                                <div className="col-md-4 text-center">
                                    <i className={`fas fa-undo fa-2x ${formData.returnable ? 'text-success' : 'text-muted'} mb-2`}></i>
                                    <h6>Returns</h6>
                                    <p className="mb-0">
                                        {formData.returnable 
                                            ? `${formData.return_window_days} day return` 
                                            : "Non-returnable"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="col-md-12 mt-4">
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save me-2"></i>
                                Save Additional Info
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default AdditionalInfoTab;
