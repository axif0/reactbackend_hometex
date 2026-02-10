import React, { useState, useEffect } from "react";
import axios from "axios";
import Constants from "../../../../Constants";

/**
 * InventoryTab - Handles product stock and inventory management
 * Database Fields:
 * - stock: int (total stock quantity)
 * - stock_status: enum('in_stock','out_of_stock','on_backorder','preorder')
 * - low_stock_threshold: int (default: 10)
 * - manage_stock: tinyint(1) (default: 1)
 * - allow_backorders: tinyint(1) (default: 0)
 * - sold_count: int (read-only, default: 0)
 * - restock_date: timestamp
 * - minimum_order_quantity: int (default: 1)
 * - maximum_order_quantity: int
 */
const InventoryTab = ({ data, onSave, isSaving, errors = {} }) => {
    // Form state - read from API response structure (data.inventory.*)
    const [formData, setFormData] = useState({
        // API returns: inventory.stock_quantity, inventory.stock_status
        stock: data?.inventory?.stock_quantity || 0,
        stock_status: data?.inventory?.stock_status || "in_stock",
        low_stock_threshold: data?.inventory?.low_stock_threshold || 10,
        manage_stock: data?.inventory?.manage_stock !== false ? 1 : 0,
        allow_backorders: data?.inventory?.allow_backorders ? 1 : 0,
        restock_date: data?.inventory?.restock_date ? data.inventory.restock_date.split('T')[0] : "",
        // These are at root level in API response
        minimum_order_quantity: data?.minimum_order_quantity || 1,
        maximum_order_quantity: data?.maximum_order_quantity || "",
    });

    const [shopQuantities, setShopQuantities] = useState(
        data?.inventory?.stock_by_location?.map(shop => ({
            shop_id: shop.shop_id,
            shop_name: shop.shop_name,
            quantity: shop.quantity || 0,
            reserved: shop.reserved || 0,
        })) || []
    );

    // eslint-disable-next-line no-unused-vars
    const [shops, setShops] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    // Fetch shops list
    useEffect(() => {
        const token = localStorage.getItem("token");
        axios.get(`${Constants.BASE_URL}/get-shop-list`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setShops(res.data || []))
            .catch(err => console.error("Error fetching shops:", err));
    }, []);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleQuantityChange = (shopId, quantity) => {
        setShopQuantities(prev => {
            const updated = prev.map(shop =>
                shop.shop_id === shopId 
                    ? { ...shop, quantity: parseInt(quantity) || 0 } 
                    : shop
            );
            return updated;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Client-side validation
        const newErrors = {};
        if (formData.stock < 0) newErrors.stock = "Stock cannot be negative";
        if (formData.low_stock_threshold < 0) newErrors.low_stock_threshold = "Threshold cannot be negative";
        
        if (Object.keys(newErrors).length > 0) {
            setValidationErrors(newErrors);
            return;
        }

        // Build payload matching database columns exactly
        const payload = {
            stock: parseInt(formData.stock) || 0,
            stock_status: formData.stock_status,
            low_stock_threshold: parseInt(formData.low_stock_threshold) || 10,
            manage_stock: formData.manage_stock ? 1 : 0,
            allow_backorders: formData.allow_backorders ? 1 : 0,
            minimum_order_quantity: parseInt(formData.minimum_order_quantity) || 1,
            // Send null explicitly if empty, otherwise parse as integer
            maximum_order_quantity: formData.maximum_order_quantity ? parseInt(formData.maximum_order_quantity) : null,
        };

        // Only include restock_date if it has a value
        if (formData.restock_date) {
            payload.restock_date = formData.restock_date;
        }

        // Add shop quantities if any exist (for shop_product pivot table)
        if (shopQuantities.length > 0) {
            payload.shop_quantities = shopQuantities.map(shop => ({
                shop_id: shop.shop_id,
                quantity: shop.quantity || 0,
            }));
        }

        onSave(payload);
    };

    // Calculate totals
    const totalStock = shopQuantities.reduce((sum, shop) => sum + (shop.quantity || 0), 0);
    const totalReserved = shopQuantities.reduce((sum, shop) => sum + (shop.reserved || 0), 0);
    const totalAvailable = totalStock - totalReserved;

    // Combine client and server errors
    const allErrors = { ...validationErrors, ...errors };

    // Stock status options
    const stockStatusOptions = [
        { value: "in_stock", label: "In Stock", color: "success" },
        { value: "out_of_stock", label: "Out of Stock", color: "danger" },
        { value: "on_backorder", label: "On Backorder", color: "warning" },
        { value: "preorder", label: "Pre-order", color: "info" },
    ];

    return (
        <form onSubmit={handleSubmit}>
            <div className="row">
                {/* Inventory Summary Cards */}
                <div className="col-md-12 mb-4">
                    <div className="row">
                        <div className="col-md-3">
                            <div className="card text-center border-primary">
                                <div className="card-body">
                                    <h3 className="text-primary">{formData.stock}</h3>
                                    <small className="text-muted">Total Stock</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card text-center border-warning">
                                <div className="card-body">
                                    <h3 className="text-warning">{totalReserved}</h3>
                                    <small className="text-muted">Reserved</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card text-center border-success">
                                <div className="card-body">
                                    <h3 className="text-success">{totalAvailable}</h3>
                                    <small className="text-muted">Available</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card text-center border-info">
                                <div className="card-body">
                                    <h3 className="text-info">{data?.inventory?.sold_count || 0}</h3>
                                    <small className="text-muted">Total Sold</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Stock Settings */}
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Stock Quantity</label>
                        <input
                            type="number"
                            className={`form-control ${allErrors.stock ? 'is-invalid' : ''}`}
                            value={formData.stock}
                            onChange={(e) => handleChange('stock', e.target.value)}
                            min="0"
                        />
                        {allErrors.stock && <div className="invalid-feedback">{allErrors.stock}</div>}
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Stock Status</label>
                        <select
                            className={`form-select ${allErrors.stock_status ? 'is-invalid' : ''}`}
                            value={formData.stock_status}
                            onChange={(e) => handleChange('stock_status', e.target.value)}
                        >
                            {stockStatusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {allErrors.stock_status && <div className="invalid-feedback">{allErrors.stock_status}</div>}
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Low Stock Threshold</label>
                        <input
                            type="number"
                            className={`form-control ${allErrors.low_stock_threshold ? 'is-invalid' : ''}`}
                            value={formData.low_stock_threshold}
                            onChange={(e) => handleChange('low_stock_threshold', e.target.value)}
                            min="0"
                        />
                        {allErrors.low_stock_threshold && <div className="invalid-feedback">{allErrors.low_stock_threshold}</div>}
                        <small className="text-muted">Alert when stock falls below this</small>
                    </div>
                </div>

                {/* Order Quantity Limits */}
                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Minimum Order Quantity</label>
                        <input
                            type="number"
                            className={`form-control ${allErrors.minimum_order_quantity ? 'is-invalid' : ''}`}
                            value={formData.minimum_order_quantity}
                            onChange={(e) => handleChange('minimum_order_quantity', e.target.value)}
                            min="1"
                        />
                        {allErrors.minimum_order_quantity && <div className="invalid-feedback">{allErrors.minimum_order_quantity}</div>}
                        <small className="text-muted">Min qty per order</small>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Maximum Order Quantity</label>
                        <input
                            type="number"
                            className={`form-control ${allErrors.maximum_order_quantity ? 'is-invalid' : ''}`}
                            value={formData.maximum_order_quantity}
                            onChange={(e) => handleChange('maximum_order_quantity', e.target.value)}
                            min="1"
                            placeholder="No limit"
                        />
                        {allErrors.maximum_order_quantity && <div className="invalid-feedback">{allErrors.maximum_order_quantity}</div>}
                        <small className="text-muted">Max qty per order (optional)</small>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="mb-3">
                        <label className="form-label">Restock Date</label>
                        <input
                            type="date"
                            className={`form-control ${allErrors.restock_date ? 'is-invalid' : ''}`}
                            value={formData.restock_date}
                            onChange={(e) => handleChange('restock_date', e.target.value)}
                        />
                        {allErrors.restock_date && <div className="invalid-feedback">{allErrors.restock_date}</div>}
                        <small className="text-muted">Expected restock date</small>
                    </div>
                </div>

                {/* Stock Management Options */}
                <div className="col-md-12 mb-3">
                    <div className="card bg-light">
                        <div className="card-body">
                            <h6 className="mb-3">Stock Management Options</h6>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="manage_stock"
                                            checked={formData.manage_stock}
                                            onChange={(e) => handleChange('manage_stock', e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="manage_stock">
                                            <strong>Manage Stock</strong>
                                            <br />
                                            <small className="text-muted">Enable stock quantity tracking</small>
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="allow_backorders"
                                            checked={formData.allow_backorders}
                                            onChange={(e) => handleChange('allow_backorders', e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="allow_backorders">
                                            <strong>Allow Backorders</strong>
                                            <br />
                                            <small className="text-muted">Allow orders when out of stock</small>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock by Location */}
                {shopQuantities.length > 0 && (
                    <div className="col-md-12">
                        <h6 className="mb-3">
                            <span className="fas fa-store me-2"></span>
                            Stock by Location
                        </h6>
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead className="table-light">
                                    <tr>
                                        <th>Shop Name</th>
                                        <th style={{ width: "150px" }}>Quantity</th>
                                        <th style={{ width: "100px" }}>Reserved</th>
                                        <th style={{ width: "100px" }}>Available</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shopQuantities.map((shop) => (
                                        <tr key={shop.shop_id}>
                                            <td>{shop.shop_name}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm"
                                                    value={shop.quantity}
                                                    onChange={(e) => handleQuantityChange(shop.shop_id, e.target.value)}
                                                    min="0"
                                                />
                                            </td>
                                            <td className="text-center text-warning">{shop.reserved || 0}</td>
                                            <td className="text-center text-success">
                                                {(shop.quantity || 0) - (shop.reserved || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="table-light">
                                    <tr>
                                        <th>Total</th>
                                        <th>{totalStock}</th>
                                        <th>{totalReserved}</th>
                                        <th>{totalAvailable}</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {/* No shops message */}
                {shopQuantities.length === 0 && (
                    <div className="col-md-12">
                        <div className="alert alert-info">
                            <span className="fas fa-info-circle me-2"></span>
                            No shop locations configured for this product. Stock will be managed globally.
                        </div>
                    </div>
                )}

                {/* Low Stock Warning */}
                {data?.inventory?.is_low_stock && (
                    <div className="col-md-12 mt-3">
                        <div className="alert alert-warning">
                            <span className="fas fa-exclamation-triangle me-2"></span>
                            <strong>Low Stock Alert:</strong> Current stock is below the threshold of {formData.low_stock_threshold} units.
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
                                <span className="fas fa-save me-2"></span>
                                Update Inventory
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default InventoryTab;
