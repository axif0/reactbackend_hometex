import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Breadcrumb from "../../partoals/Breadcrumb";
import CardHeader from "../../partoals/miniComponents/CardHeader";
import Loader from "../../partoals/miniComponents/Loader";
import BasicInfoTab from "./editTabs/BasicInfoTab";
import PricingTab from "./editTabs/PricingTab";
import InventoryTab from "./editTabs/InventoryTab";
import SEOTab from "./editTabs/SEOTab";
import VariationsTab from "./editTabs/VariationsTab";
import MediaTab from "./editTabs/MediaTab";
import ShippingTab from "./editTabs/ShippingTab";
import SpecificationsTab from "./editTabs/SpecificationsTab";
import AdditionalInfoTab from "./editTabs/AdditionalInfoTab";
import RelationsTab from "./editTabs/RelationsTab";
import { fetchProduct, updateProduct, parseApiError } from "../../../services/productApi";

const ProductEditNew = () => {
    const { id } = useParams();
    
    const [activeTab, setActiveTab] = useState("basic");
    const [hoveredTab, setHoveredTab] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [productData, setProductData] = useState(null);
    const [apiErrors, setApiErrors] = useState({});

    // Restore saved tab on mount
    useEffect(() => {
        const savedTab = sessionStorage.getItem('productEditActiveTab');
        if (savedTab) {
            setActiveTab(savedTab);
            sessionStorage.removeItem('productEditActiveTab');
        }
    }, []);

    // Fetch product data
    const loadProduct = useCallback(async () => {
        try {
            setIsLoading(true);
            setApiErrors({});
            const response = await fetchProduct(id);
            console.log("Product fetched successfully:", response);
            setProductData(response.data.product);
        } catch (error) {
            console.error("Error fetching product:", error);
            const parsedError = parseApiError(error);
            
            Swal.fire({
                icon: "warning",
                title: "Failed to Load Product",
                html: `<p>${parsedError.message}</p>`,
                confirmButtonText: 'Continue Anyway',
            });
            
            // Set default empty product data
            setProductData(getDefaultProductData(id));
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadProduct();
    }, [loadProduct]);

    /**
     * Handle save from any tab
     * Supports partial updates - only sends changed fields
     */
    const handleSave = async (updatedData) => {
        try {
            setIsSaving(true);
            setApiErrors({});
            
            // Save current tab before potential reload
            sessionStorage.setItem('productEditActiveTab', activeTab);
            
            console.log('Sending to API:', JSON.stringify(updatedData, null, 2));
            
            const response = await updateProduct(id, updatedData);
            
            console.log('API Response:', response);

            // Update local state with new data
            if (response.data?.product) {
                setProductData(response.data.product);
            }

            Swal.fire({
                icon: "success",
                title: "Success",
                text: response.message || "Product updated successfully",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
            });

            // Show updated fields if available
            if (response.data?.updated_fields?.length > 0) {
                console.log("Updated fields:", response.data.updated_fields);
            }

        } catch (error) {
            console.error("Error updating product:", error);
            const parsedError = parseApiError(error);
            
            setApiErrors(parsedError.errors);

            // Handle validation errors (422)
            if (parsedError.status === 422 && Object.keys(parsedError.errors).length > 0) {
                const errorMessages = Object.entries(parsedError.errors)
                    .map(([field, messages]) => `<b>${field}:</b> ${messages[0]}`)
                    .join('<br>');
                
                Swal.fire({
                    icon: "error",
                    title: "Validation Failed",
                    html: errorMessages,
                });
            } else if (parsedError.status === 401) {
                // Session expired - redirect to login
                Swal.fire({
                    icon: "warning",
                    title: "Session Expired",
                    text: "Please login again.",
                    confirmButtonText: "Login",
                }).then(() => {
                    window.location.href = "/login";
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: parsedError.message,
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: "basic", label: "Basic Info", icon: "fa-info-circle" },
        { id: "pricing", label: "Pricing", icon: "fa-dollar-sign" },
        { id: "inventory", label: "Inventory", icon: "fa-box" },
        { id: "shipping", label: "Shipping", icon: "fa-truck" },
        { id: "specifications", label: "Specifications", icon: "fa-list-alt" },
        { id: "additional", label: "Additional Info", icon: "fa-plus-circle" },
        { id: "relations", label: "Relations", icon: "fa-link" },
        { id: "variations", label: "Variations", icon: "fa-layer-group" },
        { id: "media", label: "Media", icon: "fa-image" },
        { id: "seo", label: "SEO", icon: "fa-search" },
    ];

    if (isLoading) {
        return (
            <>
                <Breadcrumb title="Edit Product" />
                <div className="card">
                    <div className="card-body">
                        <Loader />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Breadcrumb title={`Edit: ${productData?.name || 'Product'}`} />
            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <CardHeader
                                title={`Edit Product - ${productData?.name}`}
                                link="/products"
                                icon="fa-list"
                                button_text="Back to List"
                            />
                        </div>

                        <div className="card-body">
                            {/* Tabs Navigation */}
                            <ul className="nav nav-tabs mb-0" role="tablist" style={{ 
                                borderBottom: 'none',
                                backgroundColor: 'transparent',
                                padding: '0'
                            }}>
                                {tabs.map(tab => {
                                    const isActive = activeTab === tab.id;
                                    const isHovered = hoveredTab === tab.id;
                                    const showHoverStyle = !isActive && isHovered;
                                    
                                    return (
                                    <li className="nav-item" key={tab.id}>
                                        <button
                                            onClick={() => setActiveTab(tab.id)}
                                            type="button"
                                            style={{
                                                border: isActive ? '1px solid #6f42c1' : '1px solid #662999',
                                                borderBottom: isActive ? 'none' : '1px solid #662999',
                                                borderRadius: '8px 8px 0 0',
                                                marginRight: '0.25rem',
                                                marginBottom: isActive ? '-1px' : '0',
                                                color: isActive || showHoverStyle ? '#ffffff' : '#b8b8b8',
                                                backgroundColor: isActive ? '#6f42c1' : showHoverStyle ? '#8e4dd1' : '#a22bff',
                                                cursor: 'pointer',
                                                fontWeight: isActive ? '600' : '500',
                                                padding: '0.75rem 1.25rem',
                                                transition: 'none',
                                                fontSize: '0.95rem',
                                                position: 'relative',
                                                zIndex: isActive ? '2' : '1',
                                                opacity: '1',
                                                outline: 'none',
                                                borderColor: showHoverStyle ? '#6f42c1' : (isActive ? '#6f42c1' : '#662999')
                                            }}
                                            onMouseEnter={() => setHoveredTab(tab.id)}
                                            onMouseLeave={() => setHoveredTab(null)}
                                        >
                                            <i className={`fas ${tab.icon} me-2`}></i>
                                            {tab.label}
                                        </button>
                                    </li>
                                    );
                                })}
                            </ul>
                            <div style={{ 
                                borderTop: '1px solid #dee2e6',
                                marginTop: '-1px',
                                paddingTop: '1.5rem'
                            }}>

                            {/* Tab Content */}
                            {activeTab === "basic" && (
                                <BasicInfoTab
                                    data={productData} 
                                    onSave={handleSave}
                                    isSaving={isSaving}
                                    errors={apiErrors}
                                />
                            )}
                            {activeTab === "pricing" && (
                                <PricingTab
                                    data={productData} 
                                    onSave={handleSave}
                                    isSaving={isSaving}
                                    errors={apiErrors}
                                />
                            )}
                            {activeTab === "inventory" && (
                                <InventoryTab
                                    data={productData} 
                                    onSave={handleSave}
                                    isSaving={isSaving}
                                    errors={apiErrors}
                                />
                            )}
                            {activeTab === "shipping" && (
                                <ShippingTab
                                    data={productData} 
                                    onSave={handleSave}
                                    isSaving={isSaving}
                                    errors={apiErrors}
                                />
                            )}
                            {activeTab === "specifications" && (
                                <SpecificationsTab
                                    data={productData} 
                                    onSave={handleSave}
                                    isSaving={isSaving}
                                    errors={apiErrors}
                                />
                            )}
                            {activeTab === "additional" && (
                                <AdditionalInfoTab
                                    data={productData} 
                                    onSave={handleSave}
                                    isSaving={isSaving}
                                    errors={apiErrors}
                                />
                            )}
                            {activeTab === "relations" && (
                                <RelationsTab
                                    data={productData} 
                                    onSave={handleSave}
                                    isSaving={isSaving}
                                    errors={apiErrors}
                                />
                            )}
                            {activeTab === "variations" && (
                                <VariationsTab
                                    data={productData} 
                                    onSave={handleSave}
                                    isSaving={isSaving}
                                    errors={apiErrors}
                                />
                            )}
                            {activeTab === "media" && (
                                <MediaTab
                                    data={productData} 
                                    onSave={handleSave}
                                    isSaving={isSaving}
                                    errors={apiErrors}
                                />
                            )}
                            {activeTab === "seo" && (
                                <SEOTab
                                    data={productData} 
                                    onSave={handleSave}
                                    isSaving={isSaving}
                                    errors={apiErrors}
                                />
                            )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

/**
 * Default product data structure for when loading fails
 */
const getDefaultProductData = (id) => ({
    id: id,
    name: "",
    sku: "",
    slug: "",
    description: "",
    short_description: "",
    status: "active",
    type: "simple",
    category: null,
    sub_category: null,
    child_sub_category: null,
    brand: null,
    country_of_origin: null,
    tags: [],
    badges: {
        is_featured: false,
        is_new: false,
        is_trending: false,
        is_bestseller: false,
        is_on_sale: false,
    },
    pricing: {
        cost_price: 0,
        regular_price: 0,
        sale_price: null,
        discount: { type: "percentage", value: 0 },
    },
    inventory: {
        stock_quantity: 0,
        stock_status: "in_stock",
        low_stock_threshold: 10,
        stock_by_location: [],
    },
    shipping: {
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
    },
    specifications: [],
    media: { gallery: [], videos: [] },
    seo: {
        meta_title: "",
        meta_description: "",
        meta_keywords: [],
    },
});

export default ProductEditNew;
