import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import Breadcrumb from "../../partoals/Breadcrumb";
import Constants from "../../../Constants";
import Loader from "../../partoals/miniComponents/Loader";
import GlobalFunction from "../../../assets/GlobalFunction";

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const formatDate = (str) => {
    if (!str) return "—";
    try {
        const d = new Date(str);
        return d.toLocaleString();
    } catch {
        return str;
    }
};

function CustomerOrders() {
    const { id } = useParams();
    const [customer, setCustomer] = useState(null);
    const [ecommerceOrders, setEcommerceOrders] = useState([]);
    const [storeOrders, setStoreOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        setError(null);
        axios
            .get(`${Constants.BASE_URL}/customer/${id}/orders`, authHeaders())
            .then((res) => {
                setCustomer(res.data.customer || null);
                setEcommerceOrders(Array.isArray(res.data.ecommerce_orders) ? res.data.ecommerce_orders : []);
                setStoreOrders(Array.isArray(res.data.store_orders) ? res.data.store_orders : []);
            })
            .catch((err) => {
                setError(err?.response?.status === 404 ? "Customer not found." : err?.message || "Failed to load.");
                setCustomer(null);
                setEcommerceOrders([]);
                setStoreOrders([]);
            })
            .finally(() => setIsLoading(false));
    }, [id]);

    if (isLoading) return <Loader />;

    if (error || !customer) {
        return (
            <>
                <Breadcrumb title="Customer Orders" />
                <div className="row">
                    <div className="col-12">
                        <div className="alert alert-danger">{error || "Customer not found."}</div>
                        <Link to="/customers" className="btn btn-secondary">Back to Customer List</Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Breadcrumb title="Customer Orders" />
            <div className="row">
                <div className="col-md-12">
                    <div className="card mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Customer</h5>
                            <Link to="/customers" className="btn btn-sm btn-outline-secondary">Back to List</Link>
                        </div>
                        <div className="card-body">
                            <p className="mb-1"><strong>Name:</strong> {customer.name || "—"}</p>
                            <p className="mb-1"><strong>Phone:</strong> {customer.phone || "—"}</p>
                            <p className="mb-0"><strong>Email:</strong> {customer.email || "—"}</p>
                        </div>
                    </div>

                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Ecommerce Orders</h5>
                        </div>
                        <div className="card-body p-0">
                            {ecommerceOrders.length === 0 ? (
                                <p className="text-muted mb-0 p-3">No ecommerce orders.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-sm table-bordered table-hover table-striped mb-0">
                                        <thead>
                                            <tr>
                                                <th>Order #</th>
                                                <th>Total</th>
                                                <th>Shop</th>
                                                <th>Payment</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ecommerceOrders.map((o) => (
                                                <tr key={`e-${o.id}`}>
                                                    <td>{o.order_number || o.id}</td>
                                                    <td>{GlobalFunction.formatPrice(o.total)}</td>
                                                    <td>{o.shop?.name ?? "—"}</td>
                                                    <td>{o.payment_method?.name ?? "—"}</td>
                                                    <td>{o.status ?? "—"}</td>
                                                    <td>{formatDate(o.created_at)}</td>
                                                    <td>
                                                        <Link to={`/order/${o.id}`} className="btn btn-sm btn-outline-primary">View</Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Store Orders</h5>
                        </div>
                        <div className="card-body p-0">
                            {storeOrders.length === 0 ? (
                                <p className="text-muted mb-0 p-3">No store orders.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-sm table-bordered table-hover table-striped mb-0">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Total</th>
                                                <th>Shop</th>
                                                <th>Payment</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {storeOrders.map((o) => (
                                                <tr key={`s-${o.id}`}>
                                                    <td>{o.id}</td>
                                                    <td>{GlobalFunction.formatPrice(o.total_amount)}</td>
                                                    <td>{o.shop?.name ?? "—"}</td>
                                                    <td>{o.payment_method?.name ?? "—"}</td>
                                                    <td>{o.status ?? "—"}</td>
                                                    <td>{formatDate(o.created_at)}</td>
                                                    <td>
                                                        <Link to={`/store-order/${o.id}`} className="btn btn-sm btn-outline-primary">View</Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CustomerOrders;
