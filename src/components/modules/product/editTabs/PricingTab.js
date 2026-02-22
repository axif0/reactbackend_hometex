import React, { useState } from "react";

/**
 * PricingTab - Handles product pricing
 * Database Fields:
 * - cost: int (purchase/manufacturing cost)
 * - price: int (regular selling price)
 * - old_price: int (previous price for display)
 * - discount_fixed: int (fixed discount amount)
 * - discount_percent: int (percentage discount)
 * - discount_start: timestamp (discount period start)
 * - discount_end: timestamp (discount period end)
 * - tax_rate: decimal(5,2)
 * - tax_included: tinyint(1)
 * - tax_class: varchar(50)
 */
const PricingTab = ({ data, onSave, isSaving, errors = {} }) => {
    // Form state - read from API response structure (data.pricing.*)
    const [formData, setFormData] = useState({
        // API returns: pricing.cost_price, pricing.regular_price
        cost: data?.pricing?.cost_price || 0,
        price: data?.pricing?.regular_price || 0,
        old_price: data?.pricing?.old_price || "",
        // API returns discount info in: pricing.discount.amount (fixed), pricing.discount.value (percent)
        discount_fixed: data?.pricing?.discount?.type === "fixed" ? data?.pricing?.discount?.amount : "",
        discount_percent: data?.pricing?.discount?.value || "",
        // API returns dates in ISO format, need to extract date part
        discount_start: data?.pricing?.discount?.start_date ? data.pricing.discount.start_date.split('T')[0] : "",
        discount_end: data?.pricing?.discount?.end_date ? data.pricing.discount.end_date.split('T')[0] : "",
        // API returns: pricing.tax.rate, pricing.tax.included, pricing.tax.class
        tax_rate: data?.pricing?.tax?.rate || 0,
        tax_included: data?.pricing?.tax?.included ? 1 : 0,
        tax_class: data?.pricing?.tax?.class || "standard",
    });

    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Client-side validation
        const newErrors = {};
        if (formData.price < 0) newErrors.price = "Price cannot be negative";
        if (formData.cost < 0) newErrors.cost = "Cost cannot be negative";
        if (formData.discount_percent && (formData.discount_percent < 0 || formData.discount_percent > 100)) {
            newErrors.discount_percent = "Discount must be between 0 and 100";
        }
        
        if (Object.keys(newErrors).length > 0) {
            setValidationErrors(newErrors);
            return;
        }

        // Build payload matching database columns exactly
        const payload = {
            cost: parseInt(formData.cost) || 0,
            price: parseInt(formData.price) || 0,
        };

        // Only include optional fields if they have values
        if (formData.old_price) payload.old_price = parseInt(formData.old_price);
        if (formData.discount_fixed) payload.discount_fixed = parseInt(formData.discount_fixed);
        if (formData.discount_percent) payload.discount_percent = parseInt(formData.discount_percent);
        if (formData.discount_start) payload.discount_start = formData.discount_start;
        if (formData.discount_end) payload.discount_end = formData.discount_end;
        if (formData.tax_rate !== undefined) payload.tax_rate = parseFloat(formData.tax_rate);
        payload.tax_included = formData.tax_included ? 1 : 0;
        if (formData.tax_class) payload.tax_class = formData.tax_class;

        onSave(payload);
    };

    // Calculate derived values
    const regularPrice = parseInt(formData.price) || 0;
    const costPrice = parseInt(formData.cost) || 0;
    
    // Calculate final price based on discounts
    let finalPrice = regularPrice;
    if (formData.discount_percent) {
        finalPrice = regularPrice - (regularPrice * parseInt(formData.discount_percent) / 100);
    } else if (formData.discount_fixed) {
        finalPrice = regularPrice - parseInt(formData.discount_fixed);
    }
    finalPrice = Math.max(0, finalPrice);
    
    const profitMargin = finalPrice - costPrice;
    const profitPercentage = costPrice > 0 
        ? ((profitMargin / costPrice) * 100).toFixed(2) 
        : 0;

    // Combine client and server errors
    const allErrors = { ...validationErrors, ...errors };

    return (
        <form onSubmit={handleSubmit}>
            <div className="row">
                {/* Cost Price */}
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Cost (৳)</label>
                        <input
                            type="number"
                            className={`form-control ${allErrors.cost ? 'is-invalid' : ''}`}
                            value={formData.cost}
                            onChange={(e) => handleChange('cost', e.target.value)}
                            min="0"
                        />
                        {allErrors.cost && <div className="invalid-feedback">{allErrors.cost}</div>}
                        <small className="text-muted">Your purchase/manufacturing cost</small>
                    </div>
                </div>

                {/* Regular Price */}
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Price (৳) <span className="text-danger">*</span></label>
                        <input
                            type="number"
                            className={`form-control ${allErrors.price ? 'is-invalid' : ''}`}
                            value={formData.price}
                            onChange={(e) => handleChange('price', e.target.value)}
                            min="0"
                        />
                        {allErrors.price && <div className="invalid-feedback">{allErrors.price}</div>}
                        <small className="text-muted">Regular selling price</small>
                    </div>
                </div>

                {/* Old Price */}
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Old Price (৳)</label>
                        <input
                            type="number"
                            className={`form-control ${allErrors.old_price ? 'is-invalid' : ''}`}
                            value={formData.old_price}
                            onChange={(e) => handleChange('old_price', e.target.value)}
                            min="0"
                            placeholder="Previous price (strikethrough)"
                        />
                        {allErrors.old_price && <div className="invalid-feedback">{allErrors.old_price}</div>}
                        <small className="text-muted">Shown as crossed-out price</small>
                    </div>
                </div>

                {/* Discount Section */}
                <div className="col-md-12">
                    <h6 className="mb-3 mt-2">
                        <span className="fas fa-percent me-2"></span>
                        Discount Settings
                    </h6>
                </div>

                <div className="col-md-3">
                    <div className="mb-3">
                        <label className="form-label">Discount Fixed (৳)</label>
                        <input
                            type="number"
                            className={`form-control ${allErrors.discount_fixed ? 'is-invalid' : ''}`}
                            value={formData.discount_fixed}
                            onChange={(e) => handleChange('discount_fixed', e.target.value)}
                            min="0"
                            placeholder="0"
                        />
                        {allErrors.discount_fixed && <div className="invalid-feedback">{allErrors.discount_fixed}</div>}
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="mb-3">
                        <label className="form-label">Discount Percent (%)</label>
                        <input
                            type="number"
                            className={`form-control ${allErrors.discount_percent ? 'is-invalid' : ''}`}
                            value={formData.discount_percent}
                            onChange={(e) => handleChange('discount_percent', e.target.value)}
                            min="0"
                            max="100"
                            placeholder="0"
                        />
                        {allErrors.discount_percent && <div className="invalid-feedback">{allErrors.discount_percent}</div>}
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="mb-3">
                        <label className="form-label">Discount Start</label>
                        <input
                            type="date"
                            className={`form-control ${allErrors.discount_start ? 'is-invalid' : ''}`}
                            value={formData.discount_start}
                            onChange={(e) => handleChange('discount_start', e.target.value)}
                        />
                        {allErrors.discount_start && <div className="invalid-feedback">{allErrors.discount_start}</div>}
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="mb-3">
                        <label className="form-label">Discount End</label>
                        <input
                            type="date"
                            className={`form-control ${allErrors.discount_end ? 'is-invalid' : ''}`}
                            value={formData.discount_end}
                            onChange={(e) => handleChange('discount_end', e.target.value)}
                        />
                        {allErrors.discount_end && <div className="invalid-feedback">{allErrors.discount_end}</div>}
                    </div>
                </div>

                {/* Tax Section */}
                <div className="col-md-12">
                    <h6 className="mb-3 mt-2">
                        <span className="fas fa-receipt me-2"></span>
                        Tax Settings
                    </h6>
                </div>

                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Tax Rate (%)</label>
                        <input
                            type="number"
                            className={`form-control ${allErrors.tax_rate ? 'is-invalid' : ''}`}
                            value={formData.tax_rate}
                            onChange={(e) => handleChange('tax_rate', e.target.value)}
                            step="0.01"
                            min="0"
                            max="100"
                        />
                        {allErrors.tax_rate && <div className="invalid-feedback">{allErrors.tax_rate}</div>}
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Tax Class</label>
                        <select
                            className="form-select"
                            value={formData.tax_class}
                            onChange={(e) => handleChange('tax_class', e.target.value)}
                        >
                            <option value="standard">Standard</option>
                            <option value="reduced">Reduced</option>
                            <option value="zero">Zero Rate</option>
                            <option value="exempt">Tax Exempt</option>
                        </select>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Tax Included in Price</label>
                        <div className="form-check form-switch mt-2">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={formData.tax_included === 1}
                                onChange={(e) => handleChange('tax_included', e.target.checked ? 1 : 0)}
                            />
                            <label className="form-check-label">
                                {formData.tax_included ? 'Yes - Tax included' : 'No - Tax added separately'}
                            </label>
                        </div>
                    </div>
                </div>

                {/* Pricing Summary */}
                <div className="col-md-12 mt-3">
                    <div className="card border-primary">
                        <div className="card-body">
                            <h6 className="card-title mb-3">
                                <span className="fas fa-calculator me-2"></span>
                                Pricing Summary
                            </h6>
                            <div className="row text-center">
                                <div className="col-md-3">
                                    <div className="border rounded p-3">
                                        <h6 className="text-muted mb-1">Cost</h6>
                                        <h4 className="mb-0">৳{costPrice}</h4>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="border rounded p-3">
                                        <h6 className="text-muted mb-1">Regular Price</h6>
                                        <h4 className="mb-0">৳{regularPrice}</h4>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className={`border rounded p-3 ${finalPrice < regularPrice ? 'bg-success text-white' : ''}`}>
                                        <h6 className="mb-1">Final Price</h6>
                                        <h4 className="mb-0">৳{Math.round(finalPrice)}</h4>
                                        {finalPrice < regularPrice && (
                                            <small>{Math.round((1 - finalPrice/regularPrice) * 100)}% off</small>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className={`border rounded p-3 ${profitMargin >= 0 ? 'bg-info text-white' : 'bg-danger text-white'}`}>
                                        <h6 className="mb-1">Profit Margin</h6>
                                        <h4 className="mb-0">৳{Math.round(profitMargin)}</h4>
                                        <small>({profitPercentage}%)</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="col-md-12 mt-3">
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? (
                            <span>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Saving...
                            </span>
                        ) : (
                            <span>
                                <span className="fas fa-save me-2"></span>
                                Save Pricing
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default PricingTab;
