import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Breadcrumb from "../../partoals/Breadcrumb";
import Constants from "../../../Constants";

const Return = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchBy, setSearchBy] = useState("phone");
  const [orders, setOrders] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [orderedItems, setOrderedItems] = useState([]);
  const [returnedItems, setReturnedItems] = useState([]);
  const [returnQty, setReturnQty] = useState({});
  const [shops, setShops] = useState([]);
  const [returnToShopId, setReturnToShopId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${Constants.BASE_URL}/get-shop-list`, { headers }).then((res) => {
      const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setShops(list);
    }).catch(() => {});
  }, []);

  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    setSearching(true);
    const params = searchBy === "phone" ? { phone: q } : { order_id: q };
    axios.get(`${Constants.BASE_URL}/returns/search`, { headers, params })
      .then((res) => {
        setOrders(res.data?.data ?? []);
        setSelectedOrder(null);
        setOrderDetails(null);
        setOrderedItems([]);
        setReturnedItems([]);
        setReturnQty({});
      })
      .catch(() => setOrders([]))
      .finally(() => setSearching(false));
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setLoadingDetails(true);
    setOrderDetails(null);
    setOrderedItems([]);
    setReturnedItems([]);
    setReturnQty({});
    axios.get(`${Constants.BASE_URL}/returns/order-details`, {
      headers,
      params: { order_type: order.type, order_id: order.id },
    })
      .then((res) => {
        const data = res.data?.data;
        setOrderDetails(data);
        setOrderedItems(data?.items ?? []);
        setReturnedItems([]);
      })
      .catch(() => {
        setOrderDetails(null);
        setOrderedItems([]);
      })
      .finally(() => setLoadingDetails(false));
  };

  const addToReturn = (item, qty) => {
    const num = Math.min(Math.max(1, parseInt(qty, 10) || 1), item.max_return);
    const existing = returnedItems.find((r) => r.detail_id === item.detail_id);
    if (existing) {
      setReturnedItems((prev) =>
        prev.map((r) =>
          r.detail_id === item.detail_id ? { ...r, quantity: Math.min(r.quantity + num, item.max_return) } : r
        )
      );
    } else {
      setReturnedItems((prev) => [...prev, { ...item, quantity: num }]);
    }
    setReturnQty((prev) => ({ ...prev, [item.detail_id]: "" }));
  };

  const removeFromReturn = (detailId) => {
    setReturnedItems((prev) => prev.filter((r) => r.detail_id !== detailId));
  };

  const setReturnQuantity = (detailId, qty) => {
    const item = returnedItems.find((r) => r.detail_id === detailId);
    if (!item) return;
    const num = Math.min(Math.max(0, parseInt(qty, 10) || 0), item.max_return);
    if (num <= 0) {
      removeFromReturn(detailId);
      return;
    }
    setReturnedItems((prev) =>
      prev.map((r) => (r.detail_id === detailId ? { ...r, quantity: num } : r))
    );
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ detail_id: item.detail_id, ...item }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return;
      const item = JSON.parse(raw);
      if (!item.detail_id) return;
      const full = orderedItems.find((o) => o.detail_id === item.detail_id);
      if (full && !returnedItems.some((r) => r.detail_id === item.detail_id)) {
        addToReturn(full, full.max_return);
      }
    } catch (_) {}
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleSubmitReturn = () => {
    if (!selectedOrder || !returnToShopId || returnedItems.length === 0) {
      Swal.fire({ icon: "warning", title: "Select order, return-to shop, and at least one item to return." });
      return;
    }
    setSubmitting(true);
    axios.post(
      `${Constants.BASE_URL}/returns/submit`,
      {
        order_type: selectedOrder.type,
        order_id: selectedOrder.id,
        return_to_shop_id: Number(returnToShopId),
        items: returnedItems.map((r) => ({ detail_id: r.detail_id, quantity: r.quantity })),
      },
      { headers }
    )
      .then((res) => {
        Swal.fire({
          position: "top-end",
          icon: res.data?.cls || "success",
          title: res.data?.message || "Return processed",
          showConfirmButton: false,
          toast: true,
          timer: 1500,
        });
        setReturnedItems([]);
        handleSelectOrder(selectedOrder);
        if (searchInput.trim()) {
          const params = searchBy === "phone" ? { phone: searchInput.trim() } : { order_id: searchInput.trim() };
          axios.get(`${Constants.BASE_URL}/returns/search`, { headers, params }).then((r) => setOrders(r.data?.data ?? []));
        }
      })
      .catch((err) => {
        Swal.fire({
          icon: "error",
          title: "Return failed",
          text: err.response?.data?.message || err.message,
        });
      })
      .finally(() => setSubmitting(false));
  };

  const remainingItems = orderedItems.filter(
    (o) => !returnedItems.some((r) => r.detail_id === o.detail_id)
  );
  const returnedSum = returnedItems.reduce((a, r) => a + r.quantity, 0);
  const returnedTotalPrice = returnedItems.reduce((a, r) => a + (r.quantity * (r.unit_price || 0)), 0);

  const formatPrice = (n) => (n == null || n === "" ? "" : `${Number(n).toLocaleString()}৳`);

  return (
    <>
      <Breadcrumb title="Product Return" />
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Search by phone or order ID</h5>
            </div>
            <div className="card-body">
              <div className="row g-2 align-items-end">
                <div className="col-auto">
                  <label className="form-label">Search by</label>
                  <select
                    className="form-select"
                    value={searchBy}
                    onChange={(e) => setSearchBy(e.target.value)}
                  >
                    <option value="phone">Phone number</option>
                    <option value="order_id">Order ID / Invoice</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">{searchBy === "phone" ? "Phone" : "Order ID"}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={searchBy === "phone" ? "Customer phone" : "Order ID or invoice"}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="col-auto">
                  <button type="button" className="btn btn-primary" onClick={handleSearch} disabled={searching}>
                    {searching ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {orders.length > 0 && (
        <div className="row mt-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Orders</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Order #</th>
                        <th>Customer / Phone</th>
                        <th>Shop</th>
                        <th>Total</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr
                          key={`${o.type}-${o.id}`}
                          className={selectedOrder?.id === o.id && selectedOrder?.type === o.type ? "table-active" : ""}
                        >
                          <td>{o.type === "store" ? "Store" : "Ecommerce"}</td>
                          <td>{o.order_number}</td>
                          <td>{o.customer?.phone || o.customer?.name || "—"}</td>
                          <td>{o.shop?.name || "—"}</td>
                          <td>{o.total != null ? Number(o.total) : "—"}</td>
                          <td>{o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}</td>
                          <td>
                            {o.has_return ? (
                              <span className="badge bg-secondary">Returned</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleSelectOrder(o)}
                            >
                              Select
                            </button>
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
      )}

      {loadingDetails && (
        <div className="text-center py-4">Loading order details...</div>
      )}

      {!loadingDetails && orderDetails && (
        <div className="row mt-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h5 className="mb-0">
                  Order {orderDetails.order?.order_number} ({orderDetails.order?.type})
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <label className="mb-0">Return to shop:</label>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={returnToShopId}
                    onChange={(e) => setReturnToShopId(e.target.value)}
                  >
                    <option value="">Select shop</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={handleSubmitReturn}
                    disabled={submitting || returnedItems.length === 0 || !returnToShopId}
                  >
                    {submitting ? "Processing..." : "Submit return"}
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="border-bottom pb-2">Ordered items (read-only)</h6>
                    <div className="list-group list-group-flush" style={{ minHeight: 120 }}>
                      {remainingItems.map((item) => (
                        <div
                          key={item.detail_id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                          draggable
                          onDragStart={(e) => handleDragStart(e, item)}
                        >
                          <span>
                            {item.name} {item.sku && `(${item.sku})`} — Qty: <strong>{item.quantity}</strong>
                            {item.unit_price != null && item.unit_price > 0 && (
                              <span className="text-muted ms-1"> @ {formatPrice(item.unit_price)}</span>
                            )}
                          </span>
                          <div className="d-flex align-items-center gap-1">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{ width: 56 }}
                              min={1}
                              max={item.max_return}
                              placeholder="Qty"
                              title="Quantity to return"
                              value={returnQty[item.detail_id] ?? ""}
                              onChange={(e) => setReturnQty((prev) => ({ ...prev, [item.detail_id]: e.target.value }))}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => addToReturn(item, returnQty[item.detail_id] || item.max_return)}
                            >
                              Add to return
                            </button>
                          </div>
                        </div>
                      ))}
                      {remainingItems.length === 0 && orderedItems.length > 0 && (
                        <div className="text-muted small">All items moved to return.</div>
                      )}
                      {orderedItems.length === 0 && (
                        <div className="text-muted small">No line items.</div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="border-bottom pb-2">Returned items ({returnedSum})</h6>
                    <div
                      className="list-group list-group-flush border rounded p-2"
                      style={{ minHeight: 120 }}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      {returnedItems.map((r) => {
                        const lineTotal = r.quantity * (r.unit_price || 0);
                        return (
                          <div
                            key={r.detail_id}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <span>
                              {r.name} {r.sku && `(${r.sku})`}
                              <br />
                              <small className="text-muted">
                                {formatPrice(r.unit_price)} × {r.quantity} = <strong>{formatPrice(lineTotal)}</strong>
                              </small>
                            </span>
                            <div className="d-flex align-items-center gap-1">
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: 60 }}
                                min={1}
                                max={r.max_return}
                                value={r.quantity}
                                onChange={(e) => setReturnQuantity(r.detail_id, e.target.value)}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeFromReturn(r.detail_id)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {returnedItems.length > 0 && (
                        <div className="list-group-item border-top fw-bold">
                          Total: {formatPrice(returnedTotalPrice)}
                        </div>
                      )}
                      {returnedItems.length === 0 && (
                        <div className="text-muted small">Drag or add items here to return.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Return;
