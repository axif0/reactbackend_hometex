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
  const shop = order.shop || {};
  const shopName = shop.name || "Hometex (Bangladesh) Ltd.";
  const shopAddress = shop.address;
  const addressDisplay = (() => {
    if (!shopAddress) return ["Address not available"];
    const parts = [
      shopAddress.address,
      shopAddress.area?.name,
      shopAddress.district?.name,
      shopAddress.division?.name,
    ].filter(Boolean);
    if (parts.length === 0) return ["Address not available"];
    return parts;
  })();
  const paymentMethodName = order.payment_method?.name || "CASH";
  const paymentLabel = paymentMethodName.toUpperCase();
  const bin = shopAddress?.bin || "005757885-0203";
  const formatReceiptDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}-${mm}-${yy} ${h}:${min}`;
  };
  const totalItems = details.reduce((s, d) => s + d.quantity, 0);
  const subtotal = Number(order.subtotal) || 0;
  const taxAmount = Number(order.tax_amount) || 0;
  const taxableAmount = (Number(order.total_amount) || 0) - taxAmount;
  const totalAmount = Number(order.total_amount) || 0;
  const paidAmount = Number(order.paid_amount) || 0;
  const createdByName = order.created_by_user?.name || (order.created_by != null ? String(order.created_by) : null) || "—";

  return (
    <>
      <div className="no-print">
        <Breadcrumb title="Store Order Details" />
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <CardHeader
                  title={`Store Order #${order.id}`}
                  link="/store-orders"
                  icon="fa-list"
                  button_text="List"
                />
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => window.print()}
                >
                  <i className="fa fa-print" /> Print Invoice
                </button>
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
                        <td>{createdByName}</td>
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
                        <>
                          <tr>
                            <th>Shop</th>
                            <td>{order.shop.name || order.shop_id}</td>
                          </tr>
                          {addressDisplay.length > 0 && addressDisplay[0] !== "Address not available" && (
                            <tr>
                              <th>Shop Address</th>
                              <td>{addressDisplay.join(", ")}</td>
                            </tr>
                          )}
                        </>
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
      </div>

      <div id="thermal-receipt" className="thermal-receipt">
        <div className="receipt-paper">
          <div className="receipt-header">
            <div className="receipt-store-name">{shopName.toUpperCase()}</div>
            {addressDisplay.map((line, i) => (
              <div className="receipt-address" key={i}>{line}</div>
            ))}
            <div className="receipt-bin">BIN: {bin}</div>
            <div className="receipt-title">- INVOICE (Mushak 6.3) -</div>
          </div>
          <div className="receipt-body">
            {details.map((line, index) => {
              const name = line.product?.name || `Product #${line.product_id}`;
              const sku = line.product?.sku || "";
              const unitPrice = line.product?.sell_price?.price ?? line.product?.price ?? 0;
              const lineTotal = unitPrice * line.quantity;
              return (
                <div className="receipt-line-item" key={line.id || index}>
                  <div className="receipt-item-name">{name.toUpperCase()}</div>
                  {sku ? <div className="receipt-item-sku">{sku}</div> : null}
                  <div className="receipt-item-qty-price">
                    {line.quantity} X{Number(unitPrice).toFixed(2)} {Number(lineTotal).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="receipt-sep">--------------------------------</div>
          <div className="receipt-summary">
            <div className="receipt-row"><span>Item(s)</span><span>{details.length}</span></div>
            <div className="receipt-row"><span>Qty(s)</span><span>{totalItems}</span></div>
          </div>
          <div className="receipt-sep">--------------------------------</div>
          <div className="receipt-totals">
            <div className="receipt-row"><span>SUBTOTAL BDT</span><span>{subtotal.toFixed(2)}</span></div>
            <div className="receipt-row"><span>TAXABLE AMOUNT BDT</span><span>{taxableAmount.toFixed(2)}</span></div>
            <div className="receipt-row"><span>VAT 7.5% BDT</span><span>{taxAmount.toFixed(2)}</span></div>
            <div className="receipt-row receipt-total"><span>Total (Inclusive VAT) BDT</span><span>{totalAmount.toFixed(2)}</span></div>
            {paidAmount > 0 && (
            <div className="receipt-row"><span>{paymentLabel} BDT</span><span>{paidAmount.toFixed(2)}</span></div>
          )}
          </div>
          <div className="receipt-sep">********************************</div>
          <div className="receipt-footer-meta">
            <div>{formatReceiptDate(order.created_at)} SH01 DD002 T1 R{String(order.id).padStart(9, "0")}</div>
            <div>Created by {createdByName}</div>
          </div>
          <div className="receipt-sep">--------------------------------</div>
          <div className="receipt-footer">
            <div>EXCHANGE ARE ALLOWED WITHIN 7 DAYS WITH RECEIPT.</div>
            <div>STRICTLY NO CASH REFUND.</div>
          </div>
        </div>
      </div>

      <style>{`
        .thermal-receipt { display: none; }
        @media print {
          .no-print { display: none !important; }
          .thermal-receipt { display: block !important; }
          body * { visibility: hidden; }
          .thermal-receipt, .thermal-receipt * { visibility: visible; }
          .thermal-receipt { position: absolute; left: 0; top: 0; width: 100%; }
          .receipt-paper {
            width: 80mm;
            max-width: 80mm;
            margin: 0 auto;
            padding: 8px 6px;
            font-family: "Courier New", Courier, monospace;
            font-size: 12px;
            line-height: 1.25;
            color: #000;
            background: #fff;
          }
          .receipt-header { text-align: center; margin-bottom: 6px; }
          .receipt-store-name { font-weight: bold; font-size: 13px; margin-bottom: 4px; }
          .receipt-address { font-size: 11px; }
          .receipt-bin { font-size: 11px; margin-top: 2px; }
          .receipt-title { margin-top: 4px; font-size: 11px; }
          .receipt-body { margin: 6px 0; }
          .receipt-line-item { margin-bottom: 6px; }
          .receipt-item-name { font-size: 11px; word-break: break-word; }
          .receipt-item-sku { font-size: 10px; }
          .receipt-item-qty-price { font-size: 11px; }
          .receipt-sep { text-align: center; margin: 4px 0; font-size: 11px; }
          .receipt-summary, .receipt-totals { font-size: 11px; }
          .receipt-row { display: flex; justify-content: space-between; }
          .receipt-total { font-weight: bold; }
          .receipt-footer-meta { font-size: 10px; }
          .receipt-footer { text-align: center; font-size: 10px; margin-top: 4px; }
        }
      `}</style>
    </>
  );
};

export default StoreOrderDetails;
