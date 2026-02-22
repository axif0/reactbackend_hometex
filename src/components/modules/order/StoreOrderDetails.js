import React, { useEffect, useState } from "react";
import Breadcrumb from "../../partoals/Breadcrumb";
import CardHeader from "../../partoals/miniComponents/CardHeader";
import axios from "axios";
import Constants from "../../../Constants";
import { useParams, Link } from "react-router-dom";
import GlobalFunction from "../../../assets/GlobalFunction";
import Loader from "../../partoals/miniComponents/Loader";

const StoreOrderDetails = () => {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getOrderDetails = () => {
    const token = localStorage.getItem("token");
    axios
      .get(`${Constants.BASE_URL}/storecustomer/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setOrder(res.data);
        setError(null);
      })
      .catch((err) => {
        setError(err?.response?.status === 404 ? "Order not found." : err?.message || "Failed to load order.");
        setOrder(null);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    getOrderDetails();
  }, [params.id]);

  if (isLoading) {
    return <Loader />;
  }

  if (error || !order) {
    return (
      <>
        <Breadcrumb title="Store Order Details" />
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger">
              {error || "Order not found."}
            </div>
            <Link to="/store-orders" className="btn btn-secondary">
              Back to Store Order List
            </Link>
          </div>
        </div>
      </>
    );
  }

  const details = order.details || [];

  return (
    <>
      <Breadcrumb title="Store Order Details" />
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <CardHeader
                title={`Store Order #${order.id}`}
                link="/store-orders"
                icon="fa-list"
                button_text="List"
              />
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <table className="table table-hover table-bordered table-striped table-sm">
                    <tbody>
                      <tr>
                        <th>Order ID</th>
                        <td>{order.id}</td>
                      </tr>
                      <tr>
                        <th>Customer / Phone</th>
                        <td>{order.customer_number || "—"}</td>
                      </tr>
                      <tr>
                        <th>Created By</th>
                        <td>{order.created_by || "—"}</td>
                      </tr>
                      <tr>
                        <th>Created At</th>
                        <td>{order.created_at}</td>
                      </tr>
                      <tr>
                        <th>Status</th>
                        <td>{order.status || "—"}</td>
                      </tr>
                      {order.shop && (
                        <tr>
                          <th>Shop</th>
                          <td>{order.shop.name || order.shop_id}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <table className="table table-hover table-bordered table-striped table-sm">
                    <tbody>
                      <tr>
                        <th>Subtotal</th>
                        <td>{GlobalFunction.formatPrice(order.subtotal)}</td>
                      </tr>
                      <tr>
                        <th>Discount</th>
                        <td>{GlobalFunction.formatPrice(order.discount_amount)}</td>
                      </tr>
                      <tr>
                        <th>Tax</th>
                        <td>{GlobalFunction.formatPrice(order.tax_amount)}</td>
                      </tr>
                      <tr>
                        <th>Total</th>
                        <td><strong>{GlobalFunction.formatPrice(order.total_amount)}</strong></td>
                      </tr>
                      <tr>
                        <th>Paid</th>
                        <td>{GlobalFunction.formatPrice(order.paid_amount)}</td>
                      </tr>
                      <tr>
                        <th>Due</th>
                        <td>{GlobalFunction.formatPrice(order.due_amount)}</td>
                      </tr>
                      {order.notes && (
                        <tr>
                          <th>Notes</th>
                          <td>{order.notes}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card-header">
                <h5>Order Items</h5>
              </div>
              <table className="table table-bordered table-hover table-striped table-sm">
                <thead>
                  <tr>
                    <th>SL</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Sub Total</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((line, index) => (
                    <tr key={line.id || index}>
                      <td>{index + 1}</td>
                      <td>
                        {line.product
                          ? (line.product.name || `Product #${line.product_id}`)
                          : `Product #${line.product_id}`}
                      </td>
                      <td>{line.quantity}</td>
                      <td>
                        {GlobalFunction.formatPrice(
                          (line.product?.sell_price?.price ?? line.product?.price ?? 0) * line.quantity
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StoreOrderDetails;
