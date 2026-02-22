import React, { useState } from "react";

/**
 * SEOTab - Handles product SEO metadata
 * API Fields per documentation (flat, not nested):
 * - meta_title: string (max 255 chars)
 * - meta_description: string (max 500 chars)
 * - meta_keywords: string (max 500 chars)
 */
const SEOTab = ({ data, onSave, isSaving, errors = {} }) => {
    // Form state
    const [formData, setFormData] = useState({
        meta_title: data?.seo?.meta_title || "",
        meta_description: data?.seo?.meta_description || "",
        meta_keywords: Array.isArray(data?.seo?.meta_keywords) 
            ? data.seo.meta_keywords.join(", ") 
            : (data?.seo?.meta_keywords || ""),
    });

    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Client-side validation
        const newErrors = {};
        if (formData.meta_title.length > 255) {
            newErrors.meta_title = "Meta title must be less than 255 characters";
        }
        if (formData.meta_description.length > 500) {
            newErrors.meta_description = "Meta description must be less than 500 characters";
        }
        
        if (Object.keys(newErrors).length > 0) {
            setValidationErrors(newErrors);
            return;
        }

        // Build payload matching API documentation - flat fields
        const payload = {
            meta_title: formData.meta_title,
            meta_description: formData.meta_description,
            meta_keywords: formData.meta_keywords,
        };

        onSave(payload);
    };

    // Combine client and server errors
    const allErrors = { ...validationErrors, ...errors };

    // Character counts
    const titleLength = formData.meta_title.length;
    const descriptionLength = formData.meta_description.length;

    // SEO score indicators
    const getTitleStatus = () => {
        if (titleLength === 0) return { color: "text-muted", text: "Not set" };
        if (titleLength < 30) return { color: "text-warning", text: "Too short" };
        if (titleLength > 60) return { color: "text-warning", text: "Too long" };
        return { color: "text-success", text: "Good" };
    };

    const getDescriptionStatus = () => {
        if (descriptionLength === 0) return { color: "text-muted", text: "Not set" };
        if (descriptionLength < 120) return { color: "text-warning", text: "Too short" };
        if (descriptionLength > 160) return { color: "text-warning", text: "Too long" };
        return { color: "text-success", text: "Good" };
    };

    const titleStatus = getTitleStatus();
    const descriptionStatus = getDescriptionStatus();

    return (
        <form onSubmit={handleSubmit}>
            <div className="row">
                {/* SEO Preview */}
                <div className="col-md-12 mb-4">
                    <div className="card border-primary">
                        <div className="card-header bg-primary text-white">
                            <i className="fab fa-google me-2"></i>
                            Search Engine Preview
                        </div>
                        <div className="card-body" style={{ backgroundColor: "#fff" }}>
                            <div style={{ fontFamily: "Arial, sans-serif" }}>
                                <div style={{ color: "#1a0dab", fontSize: "18px", lineHeight: "1.3" }}>
                                    {formData.meta_title || data?.name || "Product Title"}
                                </div>
                                <div style={{ color: "#006621", fontSize: "14px" }}>
                                    https://hometexbd.com/products/{data?.slug || "product-slug"}
                                </div>
                                <div style={{ color: "#545454", fontSize: "13px", lineHeight: "1.4" }}>
                                    {formData.meta_description || "Add a meta description to improve your search engine visibility..."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meta Title */}
                <div className="col-md-12">
                    <div className="mb-3">
                        <label className="form-label">
                            Meta Title
                            <span className={`ms-2 badge ${titleStatus.color.replace('text-', 'bg-')}`}>
                                {titleStatus.text}
                            </span>
                        </label>
                        <input
                            type="text"
                            className={`form-control ${allErrors.meta_title ? 'is-invalid' : ''}`}
                            value={formData.meta_title}
                            onChange={(e) => handleChange('meta_title', e.target.value)}
                            maxLength={255}
                            placeholder="Enter SEO title (50-60 characters recommended)"
                        />
                        {allErrors.meta_title && <div className="invalid-feedback">{allErrors.meta_title}</div>}
                        <div className="d-flex justify-content-between">
                            <small className="text-muted">Recommended: 50-60 characters</small>
                            <small className={titleLength > 60 ? "text-warning" : "text-muted"}>
                                {titleLength}/60
                            </small>
                        </div>
                    </div>
                </div>

                {/* Meta Description */}
                <div className="col-md-12">
                    <div className="mb-3">
                        <label className="form-label">
                            Meta Description
                            <span className={`ms-2 badge ${descriptionStatus.color.replace('text-', 'bg-')}`}>
                                {descriptionStatus.text}
                            </span>
                        </label>
                        <textarea
                            className={`form-control ${allErrors.meta_description ? 'is-invalid' : ''}`}
                            rows="3"
                            value={formData.meta_description}
                            onChange={(e) => handleChange('meta_description', e.target.value)}
                            maxLength={500}
                            placeholder="Enter meta description (150-160 characters recommended)"
                        />
                        {allErrors.meta_description && <div className="invalid-feedback">{allErrors.meta_description}</div>}
                        <div className="d-flex justify-content-between">
                            <small className="text-muted">Recommended: 150-160 characters</small>
                            <small className={descriptionLength > 160 ? "text-warning" : "text-muted"}>
                                {descriptionLength}/160
                            </small>
                        </div>
                    </div>
                </div>

                {/* Meta Keywords */}
                <div className="col-md-12">
                    <div className="mb-3">
                        <label className="form-label">Meta Keywords</label>
                        <input
                            type="text"
                            className={`form-control ${allErrors.meta_keywords ? 'is-invalid' : ''}`}
                            value={formData.meta_keywords}
                            onChange={(e) => handleChange('meta_keywords', e.target.value)}
                            placeholder="keyword1, keyword2, keyword3"
                        />
                        {allErrors.meta_keywords && <div className="invalid-feedback">{allErrors.meta_keywords}</div>}
                        <small className="text-muted">Separate keywords with commas</small>
                    </div>
                </div>

                {/* SEO Tips */}
                <div className="col-md-12">
                    <div className="alert alert-info">
                        <h6>
                            <i className="fas fa-lightbulb me-2"></i>
                            SEO Best Practices
                        </h6>
                        <ul className="mb-0 small">
                            <li><strong>Meta Title:</strong> Keep between 50-60 characters. Include main keyword at the beginning.</li>
                            <li><strong>Meta Description:</strong> Keep between 150-160 characters. Include a call-to-action.</li>
                            <li><strong>Keywords:</strong> Use relevant, specific keywords. Avoid keyword stuffing.</li>
                            <li><strong>Unique Content:</strong> Each product should have unique meta data.</li>
                        </ul>
                    </div>
                </div>

                {/* Current SEO Data */}
                {data?.seo && (
                    <div className="col-md-12">
                        <div className="card bg-light">
                            <div className="card-body">
                                <h6>Additional SEO Information</h6>
                                <div className="row">
                                    <div className="col-md-6">
                                        <small><strong>Canonical URL:</strong> {data?.seo?.canonical_url || 'Auto-generated'}</small>
                                    </div>
                                    <div className="col-md-6">
                                        <small><strong>Twitter Card:</strong> {data?.seo?.twitter_card || 'Not set'}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="col-md-12 mt-3">
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save me-2"></i>
                                Save SEO Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default SEOTab;
