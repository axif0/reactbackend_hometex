import axios from "axios";
import Constants from "../Constants";

/**
 * Product API Service
 * Centralized API calls for product operations following the API documentation
 */

/**
 * Get authorization headers
 * @returns {Object} Headers object with Authorization token
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    };
};

/**
 * Fetch a single product by ID
 * @param {number|string} productId - Product ID
 * @returns {Promise<Object>} Product data
 */
export const fetchProduct = async (productId) => {
    const response = await axios.get(
        `${Constants.BASE_URL}/products/${productId}`,
        getAuthHeaders()
    );
    return response.data;
};

/**
 * Update a product with partial data
 * Only sends fields that are provided - supports partial updates
 * 
 * @param {number|string} productId - Product ID
 * @param {Object} updateData - Fields to update (only include changed fields)
 * @returns {Promise<Object>} Updated product data
 */
export const updateProduct = async (productId, updateData) => {
    const response = await axios.put(
        `${Constants.BASE_URL}/products/${productId}`,
        updateData,
        getAuthHeaders()
    );
    return response.data;
};

/**
 * Fetch dropdown list data for forms
 */
export const fetchCategories = async () => {
    const response = await axios.get(
        `${Constants.BASE_URL}/get-category-list`,
        getAuthHeaders()
    );
    return response.data;
};

export const fetchSubCategories = async (categoryId = null) => {
    const url = categoryId 
        ? `${Constants.BASE_URL}/get-sub-category-list/${categoryId}`
        : `${Constants.BASE_URL}/get-sub-category-list`;
    const response = await axios.get(url, getAuthHeaders());
    return response.data;
};

export const fetchChildSubCategories = async (subCategoryId = null) => {
    const url = subCategoryId 
        ? `${Constants.BASE_URL}/get-child-sub-category-list/${subCategoryId}`
        : `${Constants.BASE_URL}/get-child-sub-category-list`;
    const response = await axios.get(url, getAuthHeaders());
    return response.data;
};

export const fetchBrands = async () => {
    const response = await axios.get(
        `${Constants.BASE_URL}/get-brand-list`,
        getAuthHeaders()
    );
    return response.data;
};

export const fetchSuppliers = async () => {
    const response = await axios.get(
        `${Constants.BASE_URL}/get-supplier-list`,
        getAuthHeaders()
    );
    return response.data;
};

export const fetchCountries = async () => {
    const response = await axios.get(
        `${Constants.BASE_URL}/get-country-list`,
        getAuthHeaders()
    );
    return response.data;
};

export const fetchAttributes = async () => {
    const response = await axios.get(
        `${Constants.BASE_URL}/get-attribute-list`,
        getAuthHeaders()
    );
    return response.data;
};

export const fetchShops = async () => {
    const response = await axios.get(
        `${Constants.BASE_URL}/get-shop-list`,
        getAuthHeaders()
    );
    return response.data;
};

/**
 * Format date to YYYY-MM-DD format as expected by API
 * @param {Date|string} date - Date to format
 * @returns {string|null} Formatted date string
 */
export const formatDateForApi = (date) => {
    if (!date) return null;
    if (typeof date === 'string') {
        // If already in correct format, return as-is
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        date = new Date(date);
    }
    return date.toISOString().split('T')[0];
};

/**
 * Parse API errors into a user-friendly format
 * @param {Error} error - Axios error object
 * @returns {Object} Parsed error with message and field errors
 */
export const parseApiError = (error) => {
    const response = error.response;
    
    if (!response) {
        return {
            message: "Network error. Please check your connection.",
            errors: {},
            status: 0,
        };
    }

    const { status, data } = response;

    switch (status) {
        case 401:
            return {
                message: "Session expired. Please login again.",
                errors: {},
                status: 401,
            };
        case 404:
            return {
                message: "Product not found.",
                errors: {},
                status: 404,
            };
        case 422:
            return {
                message: data.message || "Validation failed",
                errors: data.errors || {},
                status: 422,
            };
        case 500:
            return {
                message: "Server error. Please try again later.",
                errors: {},
                status: 500,
            };
        default:
            return {
                message: data.message || "An error occurred",
                errors: data.errors || {},
                status: status,
            };
    }
};

const productApi = {
    fetchProduct,
    updateProduct,
    fetchCategories,
    fetchSubCategories,
    fetchChildSubCategories,
    fetchBrands,
    fetchSuppliers,
    fetchCountries,
    fetchAttributes,
    fetchShops,
    formatDateForApi,
    parseApiError,
};
export default productApi;