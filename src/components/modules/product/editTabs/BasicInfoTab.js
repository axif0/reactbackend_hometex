import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import Constants from "../../../../Constants";

/**
 * BasicInfoTab - Handles basic product information
 * Database Fields:
 * - name, slug, sku, description, short_description
 * - status: tinyint (1 = active, 0 = inactive)
 * - visibility: enum('visible','catalog','search','hidden')
 * - type: enum('simple','variable','grouped','bundle')
 * - isFeatured, isNew, isTrending: int (0|1)
 * - is_bestseller, is_limited_edition, is_exclusive, is_eco_friendly: tinyint(1)
 * - category_id, sub_category_id, child_sub_category_id, brand_id, country_id, supplier_id
 */
const BasicInfoTab = ({ data, onSave, isSaving, errors = {} }) => {
    // Form state - read from API response structure
    const [formData, setFormData] = useState({
        name: data?.name || "",
        slug: data?.slug || "",
        sku: data?.sku || "",
        description: data?.description || "",
        short_description: data?.short_description || "",
        // Status: API returns "active"/"inactive" string, convert to 1/0
        status: data?.status === "active" || data?.status === 1 ? 1 : 0,
        // Visibility enum
        visibility: data?.visibility || "visible",
        // Product type enum
        type: data?.type || "simple",
        // Category relations - API returns nested objects
        category_id: data?.category?.id || data?.category_id || "",
        sub_category_id: data?.sub_category?.id || data?.sub_category_id || "",
        child_sub_category_id: data?.child_sub_category?.id || data?.child_sub_category_id || "",
        brand_id: data?.brand?.id || data?.brand_id || "",
        country_id: data?.country_of_origin?.id || data?.country_id || "",
        supplier_id: data?.supplier?.id || data?.supplier_id || "",
        // Featured flags - API returns in badges object as booleans
        isFeatured: data?.badges?.is_featured ? 1 : 0,
        isNew: data?.badges?.is_new ? 1 : 0,
        isTrending: data?.badges?.is_trending ? 1 : 0,
        is_bestseller: data?.badges?.is_bestseller ? 1 : 0,
        is_limited_edition: data?.badges?.is_limited_edition ? 1 : 0,
        is_exclusive: data?.badges?.is_exclusive ? 1 : 0,
        is_eco_friendly: data?.badges?.is_eco_friendly ? 1 : 0,
    });

    // Dropdown options
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [childSubCategories, setChildSubCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [countries, setCountries] = useState([]);

    const [validationErrors, setValidationErrors] = useState({});

    // Fetch dropdown data
    useEffect(() => {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch categories
        axios.get(`${Constants.BASE_URL}/get-category-list`, { headers })
            .then(res => setCategories(res.data || []))
            .catch(err => console.error("Error fetching categories:", err));

        // Fetch brands
        axios.get(`${Constants.BASE_URL}/get-brand-list`, { headers })
            .then(res => setBrands(res.data || []))
            .catch(err => console.error("Error fetching brands:", err));

        // Fetch countries
        axios.get(`${Constants.BASE_URL}/get-country-list`, { headers })
            .then(res => setCountries(res.data || []))
            .catch(err => console.error("Error fetching countries:", err));
    }, []);

    // Fetch sub-categories when category changes
    useEffect(() => {
        if (formData.category_id) {
            const token = localStorage.getItem("token");
            axios.get(`${Constants.BASE_URL}/get-sub-category-list/${formData.category_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => setSubCategories(res.data || []))
                .catch(err => console.error("Error fetching sub-categories:", err));
        } else {
            setSubCategories([]);
        }
    }, [formData.category_id]);

    // Fetch child sub-categories when sub-category changes
    useEffect(() => {
        if (formData.sub_category_id) {
            const token = localStorage.getItem("token");
            axios.get(`${Constants.BASE_URL}/get-child-sub-category-list/${formData.sub_category_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => setChildSubCategories(res.data || []))
                .catch(err => console.error("Error fetching child sub-categories:", err));
        } else {
            setChildSubCategories([]);
        }
    }, [formData.sub_category_id]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear validation error when field is updated
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Client-side validation
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.sku.trim()) newErrors.sku = "SKU is required";
        if (formData.name.length < 3) newErrors.name = "Name must be at least 3 characters";
        
        if (Object.keys(newErrors).length > 0) {
            setValidationErrors(newErrors);
            return;
        }

        // Build payload matching database columns exactly
        const payload = {
            // Basic info
            name: formData.name,
            sku: formData.sku,
            slug: formData.slug || undefined, // Let API auto-generate if empty
            description: formData.description,
            short_description: formData.short_description,
            // Status and visibility
            status: parseInt(formData.status),
            visibility: formData.visibility,
            type: formData.type,
            // Category relations (only include if set)
            ...(formData.category_id && { category_id: parseInt(formData.category_id) }),
            ...(formData.sub_category_id && { sub_category_id: parseInt(formData.sub_category_id) }),
            ...(formData.child_sub_category_id && { child_sub_category_id: parseInt(formData.child_sub_category_id) }),
            ...(formData.brand_id && { brand_id: parseInt(formData.brand_id) }),
            ...(formData.country_id && { country_id: parseInt(formData.country_id) }),
            ...(formData.supplier_id && { supplier_id: parseInt(formData.supplier_id) }),
            // Featured flags - matching database column names exactly
            isFeatured: formData.isFeatured,
            isNew: formData.isNew,
            isTrending: formData.isTrending,
            is_bestseller: formData.is_bestseller,
            is_limited_edition: formData.is_limited_edition,
            is_exclusive: formData.is_exclusive,
            is_eco_friendly: formData.is_eco_friendly,
        };

        onSave(payload);
    };

    // Combine client and server errors
    const allErrors = { ...validationErrors, ...errors };

    return (
        <form onSubmit={handleSubmit}>
            <div className="row">
                {/* Product Name */}
                <div className="col-md-6">
                    <div className="mb-3">
                        <label className="form-label">Product Name <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            className={`form-control ${allErrors.name ? 'is-invalid' : ''}`}
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            maxLength={255}
                        />
                        {allErrors.name && <div className="invalid-feedback">{allErrors.name}</div>}
                        <small className="text-muted">{formData.name.length}/255 characters</small>
                    </div>
                </div>

                {/* SKU */}
                <div className="col-md-6">
                    <div className="mb-3">
                        <label className="form-label">SKU <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            className={`form-control ${allErrors.sku ? 'is-invalid' : ''}`}
                            value={formData.sku}
                            onChange={(e) => handleChange('sku', e.target.value)}
                            maxLength={255}
                        />
                        {allErrors.sku && <div className="invalid-feedback">{allErrors.sku}</div>}
                    </div>
                </div>

                {/* Slug */}
                <div className="col-md-6">
                    <div className="mb-3">
                        <label className="form-label">Slug</label>
                        <input
                            type="text"
                            className={`form-control ${allErrors.slug ? 'is-invalid' : ''}`}
                            value={formData.slug}
                            onChange={(e) => handleChange('slug', e.target.value)}
                            maxLength={255}
                        />
                        {allErrors.slug && <div className="invalid-feedback">{allErrors.slug}</div>}
                        <small className="text-muted">URL-friendly identifier (auto-generated if empty)</small>
                    </div>
                </div>

                {/* Status */}
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={formData.status}
                            onChange={(e) => handleChange('status', parseInt(e.target.value))}
                        >
                            <option value={1}>Active</option>
                            <option value={0}>Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Visibility */}
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Visibility</label>
                        <select
                            className="form-select"
                            value={formData.visibility}
                            onChange={(e) => handleChange('visibility', e.target.value)}
                        >
                            <option value="visible">Visible (Show Everywhere)</option>
                            <option value="catalog">Catalog Only</option>
                            <option value="search">Search Only</option>
                            <option value="hidden">Hidden</option>
                        </select>
                    </div>
                </div>

                {/* Product Type */}
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Product Type</label>
                        <select
                            className="form-select"
                            value={formData.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                        >
                            <option value="simple">Simple</option>
                            <option value="variable">Variable</option>
                            <option value="grouped">Grouped</option>
                            <option value="bundle">Bundle</option>
                        </select>
                    </div>
                </div>

                {/* Category */}
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Category</label>
                        <select
                            className="form-select"
                            value={formData.category_id}
                            onChange={(e) => {
                                handleChange('category_id', e.target.value);
                                handleChange('sub_category_id', '');
                                handleChange('child_sub_category_id', '');
                            }}
                        >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Sub Category */}
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Sub Category</label>
                        <select
                            className="form-select"
                            value={formData.sub_category_id}
                            onChange={(e) => {
                                handleChange('sub_category_id', e.target.value);
                                handleChange('child_sub_category_id', '');
                            }}
                            disabled={!formData.category_id}
                        >
                            <option value="">Select Sub Category</option>
                            {subCategories.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Child Sub Category */}
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Child Sub Category</label>
                        <select
                            className="form-select"
                            value={formData.child_sub_category_id}
                            onChange={(e) => handleChange('child_sub_category_id', e.target.value)}
                            disabled={!formData.sub_category_id}
                        >
                            <option value="">Select Child Sub Category</option>
                            {childSubCategories.map(child => (
                                <option key={child.id} value={child.id}>{child.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Brand */}
                <div className="col-md-6">
                    <div className="mb-3">
                        <label className="form-label">Brand</label>
                        <select
                            className="form-select"
                            value={formData.brand_id}
                            onChange={(e) => handleChange('brand_id', e.target.value)}
                        >
                            <option value="">Select Brand</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Country of Origin */}
                <div className="col-md-6">
                    <div className="mb-3">
                        <label className="form-label">Country of Origin</label>
                        <select
                            className="form-select"
                            value={formData.country_id}
                            onChange={(e) => handleChange('country_id', e.target.value)}
                        >
                            <option value="">Select Country</option>
                            {countries.map(country => (
                                <option key={country.id} value={country.id}>{country.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Short Description */}
                <div className="col-md-12">
                    <div className="mb-3">
                        <label className="form-label">Short Description</label>
                        <textarea
                            className={`form-control ${allErrors.short_description ? 'is-invalid' : ''}`}
                            rows="3"
                            value={formData.short_description}
                            onChange={(e) => handleChange('short_description', e.target.value)}
                            maxLength={500}
                        />
                        {allErrors.short_description && <div className="invalid-feedback">{allErrors.short_description}</div>}
                        <small className="text-muted">{formData.short_description.length}/500 characters</small>
                    </div>
                </div>

                {/* Full Description */}
                <div className="col-md-12">
                    <div className="mb-3">
                        <label className="form-label">Description</label>
                        <ReactQuill
                            value={formData.description}
                            onChange={(value) => handleChange('description', value)}
                            theme="snow"
                            style={{ minHeight: '200px' }}
                        />
                        {allErrors.description && <div className="text-danger small mt-1">{allErrors.description}</div>}
                    </div>
                </div>

                {/* Product Badges */}
                <div className="col-md-12">
                    <div className="card bg-light">
                        <div className="card-body">
                            <h6 className="mb-3">Product Badges & Flags</h6>
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="isFeatured"
                                            checked={formData.isFeatured === 1}
                                            onChange={(e) => handleChange('isFeatured', e.target.checked ? 1 : 0)}
                                        />
                                        <label className="form-check-label" htmlFor="isFeatured">
                                            <span className="fas fa-star text-warning me-1"></span> Featured
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="isNew"
                                            checked={formData.isNew === 1}
                                            onChange={(e) => handleChange('isNew', e.target.checked ? 1 : 0)}
                                        />
                                        <label className="form-check-label" htmlFor="isNew">
                                            <span className="fas fa-sparkles text-info me-1"></span> New Arrival
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="is_bestseller"
                                            checked={formData.is_bestseller === 1}
                                            onChange={(e) => handleChange('is_bestseller', e.target.checked ? 1 : 0)}
                                        />
                                        <label className="form-check-label" htmlFor="is_bestseller">
                                            <span className="fas fa-trophy text-success me-1"></span> Best Seller
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="isTrending"
                                            checked={formData.isTrending === 1}
                                            onChange={(e) => handleChange('isTrending', e.target.checked ? 1 : 0)}
                                        />
                                        <label className="form-check-label" htmlFor="isTrending">
                                            <span className="fas fa-fire text-danger me-1"></span> Trending
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="is_limited_edition"
                                            checked={formData.is_limited_edition === 1}
                                            onChange={(e) => handleChange('is_limited_edition', e.target.checked ? 1 : 0)}
                                        />
                                        <label className="form-check-label" htmlFor="is_limited_edition">
                                            <span className="fas fa-gem text-purple me-1"></span> Limited Edition
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="is_exclusive"
                                            checked={formData.is_exclusive === 1}
                                            onChange={(e) => handleChange('is_exclusive', e.target.checked ? 1 : 0)}
                                        />
                                        <label className="form-check-label" htmlFor="is_exclusive">
                                            <span className="fas fa-crown text-warning me-1"></span> Exclusive
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-3 mt-2">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="is_eco_friendly"
                                            checked={formData.is_eco_friendly === 1}
                                            onChange={(e) => handleChange('is_eco_friendly', e.target.checked ? 1 : 0)}
                                        />
                                        <label className="form-check-label" htmlFor="is_eco_friendly">
                                            <span className="fas fa-leaf text-success me-1"></span> Eco-Friendly
                                        </label>
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
                                Save Basic Info
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default BasicInfoTab;
