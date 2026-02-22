import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../../partoals/Breadcrumb";
import Constants from "../../../Constants";
import Swal from "sweetalert2";
import Loader from "../../partoals/miniComponents/Loader";

const Adjustment = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState(null);
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [isLoadingOrder, setIsLoadingOrder] = useState(!!orderId);
  const [reducingIds, setReducingIds] = useState(new Set());
  const [reduceAllInProgress, setReduceAllInProgress] = useState(false);
  const [stockByProductId, setStockByProductId] = useState({});
  const [shopsWithStockByProductId, setShopsWithStockByProductId] = useState({});
  const [loadingProductShops, setLoadingProductShops] = useState({});
  const [stockShopByRow, setStockShopByRow] = useState({});
  const [reduceQtyByProductId, setReduceQtyByProductId] = useState({});
  const fetchedProductShopsRef = useRef(new Set());

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    setIsLoadingOrder(true);
    const token = localStorage.getItem("token");
    axios
      .get(`${Constants.BASE_URL}/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setOrder(data);
        const orderShopId = data?.shop?.id ?? data?.shop_id;
        setSelectedShopId(orderShopId ? String(orderShopId) : "");
      })
      .catch((err) => {
        Swal.fire({
          icon: "error",
          title: "Failed to load order",
          text: err.response?.data?.message || err.message,
        });
        setOrder(null);
      })
      .finally(() => setIsLoadingOrder(false));
  }, [orderId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get(`${Constants.BASE_URL}/get-shop-list`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setShops(res.data || []))
      .catch(() => setShops([]));
  }, []);

  const shopId = selectedShopId ? Number(selectedShopId) : null;
  const items = order?.order_details ?? [];
  const notes = orderId ? `Order #${orderId} adjustment` : "Manual adjustment";

  const productIdsStr = items.map((i) => i.product_id).filter(Boolean).join(",");
  useEffect(() => {
    if (!shopId || !productIdsStr) {
      setStockByProductId({});
      return;
    }
    const token = localStorage.getItem("token");
    axios
      .get(
        `${Constants.BASE_URL}/shop-quantity/stock?shop_id=${shopId}&product_ids=${productIdsStr}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => setStockByProductId(res.data || {}))
      .catch(() => setStockByProductId({}));
  }, [shopId, productIdsStr]);

  useEffect(() => {
    const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))];
    const token = localStorage.getItem("token");
    if (!token) return;
    productIds.forEach((productId) => {
      if (fetchedProductShopsRef.current.has(productId)) return;
      fetchedProductShopsRef.current.add(productId);
      setLoadingProductShops((prev) => ({ ...prev, [productId]: true }));
      axios
        .get(
          `${Constants.BASE_URL}/shop-quantity/product-shops?product_id=${productId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((res) => setShopsWithStockByProductId((prev) => ({ ...prev, [productId]: res.data || [] })))
        .catch(() => setShopsWithStockByProductId((prev) => ({ ...prev, [productId]: [] })))
        .finally(() => setLoadingProductShops((prev) => ({ ...prev, [productId]: false })));
    });
  }, [productIdsStr]);

  const reduceOne = (productId, quantity, orderItemQuantity, orderDetailId, shopIdToReduceFrom) => {
    const effectiveShopId = shopIdToReduceFrom ?? shopId;
    if (!effectiveShopId || !productId || !quantity) return;
    const token = localStorage.getItem("token");
    const currentOrderId = searchParams.get("order_id");
    setReducingIds((prev) => new Set(prev).add(productId));
    axios
      .post(
        `${Constants.BASE_URL}/shop-quantity/reduce`,
        {
          shop_id: Number(effectiveShopId),
          product_id: Number(productId),
          quantity: Number(quantity),
          notes,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((res) => {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: res.data?.message || "Quantity reduced.",
          showConfirmButton: false,
          toast: true,
          timer: 1500,
        });
        if (effectiveShopId === shopId) {
          const newQty = Math.max(0, (stockByProductId[String(productId)] ?? 0) - quantity);
          setStockByProductId((prev) => ({ ...prev, [String(productId)]: newQty }));
        }
        setShopsWithStockByProductId((prev) => {
          const list = prev[productId];
          if (!Array.isArray(list)) return prev;
          return {
            ...prev,
            [productId]: list.map((s) =>
              s.shop_id === effectiveShopId ? { ...s, quantity: Math.max(0, s.quantity - quantity) } : s
            ).filter((s) => s.quantity > 0),
          };
        });
        setOrder((prev) => {
          const nextDetails = (prev?.order_details ?? []).filter(
            (d) => d.id !== orderDetailId
          );
          if (nextDetails.length === 0 && currentOrderId) {
            axios
              .post(
                `${Constants.BASE_URL}/order/${currentOrderId}/mark-adjusted`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              )
              .then(() => {
                Swal.fire({
                  position: "top-end",
                  icon: "success",
                  title: "Order marked as adjusted",
                  showConfirmButton: false,
                  toast: true,
                  timer: 1500,
                });
              })
              .catch((err) => {
                const msg = err.response?.data?.message || err.message;
                Swal.fire({ icon: "error", title: "Mark adjusted failed", text: String(msg) });
              });
          }
          return { ...prev, order_details: nextDetails };
        });
      })
      .catch((err) => {
        const msg =
          err.response?.data?.message ||
          JSON.stringify(err.response?.data?.errors) ||
          err.message;
        Swal.fire({ icon: "error", title: "Reduce failed", text: String(msg) });
      })
      .finally(() =>
        setReducingIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        })
      );
  };

  const reduceAll = () => {
    if (!shopId || items.length === 0) return;
    setReduceAllInProgress(true);
    const token = localStorage.getItem("token");
    const promises = items.map((item) => {
      const productId = item.product_id;
      const quantity = item.quantity ?? 0;
      if (!productId || !quantity) return Promise.resolve();
      return axios.post(
        `${Constants.BASE_URL}/shop-quantity/reduce`,
        {
          shop_id: Number(shopId),
          product_id: Number(productId),
          quantity: Number(quantity),
          notes,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    });
    Promise.allSettled(promises)
      .then((results) => {
        const failed = results.filter((r) => r.status === "rejected");
        const succeeded = results.filter((r) => r.status === "fulfilled");
        if (failed.length === 0) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: `Reduced quantity for ${succeeded.length} item(s).`,
            showConfirmButton: false,
            toast: true,
            timer: 2000,
          });
          setOrder((prev) => (prev ? { ...prev, order_details: [] } : prev));
          const currentOrderId = searchParams.get("order_id");
          if (currentOrderId) {
            axios
              .post(
                `${Constants.BASE_URL}/order/${currentOrderId}/mark-adjusted`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              )
              .then(() => {
                Swal.fire({
                  position: "top-end",
                  icon: "success",
                  title: "Order marked as adjusted",
                  showConfirmButton: false,
                  toast: true,
                  timer: 1500,
                });
              })
              .catch((err) => {
                const msg = err.response?.data?.message || err.message;
                Swal.fire({ icon: "error", title: "Mark adjusted failed", text: String(msg) });
              });
          }
        } else {
          Swal.fire({
            icon: "warning",
            title: `${succeeded.length} reduced, ${failed.length} failed.`,
            text: failed[0]?.reason?.response?.data?.message || failed[0]?.reason?.message,
          });
        }
      })
      .finally(() => setReduceAllInProgress(false));
  };

  if (!orderId) {
    return (
      <>
        <Breadcrumb title="Quantity Adjustment" />
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <p className="text-muted mb-3">No order selected.</p>
                <Link to="/orders" className="btn theme-button">
                  Open Order List and click the adjustment icon on an order
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoadingOrder) {
    return (
      <>
        <Breadcrumb title="Quantity Adjustment" />
        <Loader />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Breadcrumb title="Quantity Adjustment" />
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <p className="text-muted">Order not found.</p>
                <Link to="/orders" className="btn btn-secondary">Back to Order List</Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Breadcrumb title="Quantity Adjustment" />
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <div className="card-header">
                <strong>Order #{orderId}</strong>
                <span className="ms-2 text-muted">{order?.shop?.name}</span>
              </div>
              <div className="card-body text-center py-5">
                <p className="text-muted">No order items to adjust.</p>
                <Link to="/orders" className="btn btn-secondary">Back to Order List</Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb title="Quantity Adjustment" />
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <strong>Order #{orderId}</strong>
                <span className="ms-2 text-muted">{order?.shop?.name}</span>
              </div>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <label className="mb-0 d-flex align-items-center gap-1">
                  <span className="text-nowrap">Reduce from shop:</span>
                  <select
                    className="form-select form-select-sm"
                    value={selectedShopId}
                    onChange={(e) => setSelectedShopId(e.target.value)}
                    style={{ minWidth: "160px" }}
                  >
                    <option value="">Select shop</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>{s.name || s.id}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="btn theme-button"
                  onClick={reduceAll}
                  disabled={reduceAllInProgress || items.length === 0 || !shopId}
                >
                  {reduceAllInProgress ? "Reducing…" : "Reduce all quantities"}
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered table-hover table-striped table-sm mb-0">
                  <thead>
                    <tr>
                      <th>SL</th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th className="text-end">Order qty</th>
                      <th className="text-end">Available stock (by shop)</th>
                      <th className="text-end">Reduce by</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const productId = item.product_id;
                      const orderQty = item.quantity ?? 0;
                      const available = stockByProductId[String(productId)];
                      const defaultReduce = Math.min(orderQty, typeof available === "number" ? available : orderQty) || orderQty;
                      const reduceQty = reduceQtyByProductId[item.id] ?? defaultReduce;
                      const setReduceQty = (val) => setReduceQtyByProductId((prev) => ({ ...prev, [item.id]: val }));
                      const reducing = productId ? reducingIds.has(productId) : false;
                      const shopOptions = shopsWithStockByProductId[productId] || [];
                      const stockShopId = stockShopByRow[item.id] ?? (shopOptions[0]?.shop_id ? String(shopOptions[0].shop_id) : "");
                      const shopIdToReduceFrom = stockShopId ? Number(stockShopId) : shopId;
                      const availableForReduce = shopIdToReduceFrom === shopId ? available : shopOptions.find((s) => s.shop_id === shopIdToReduceFrom)?.quantity;
                      const canReduce = productId && reduceQty > 0 && shopIdToReduceFrom && (availableForReduce == null || reduceQty <= availableForReduce);
                      const onStockShopChange = (e) => setStockShopByRow((prev) => ({ ...prev, [item.id]: e.target.value }));
                      return (
                        <tr key={item.id}>
                          <td className="align-middle">{index + 1}</td>
                          <td className="align-middle">{item.name ?? (productId ? `Product #${productId}` : item.sku || "—")}</td>
                          <td className="align-middle">{item.sku ?? "—"}</td>
                          <td className="align-middle text-end">{orderQty}</td>
                          <td className="align-middle">
                            {productId ? (
                              loadingProductShops[productId] ? (
                                <span className="text-muted small">Loading…</span>
                              ) : shopOptions.length === 0 ? (
                                <span className="text-muted small">No stock in any shop</span>
                              ) : (
                                <select
                                  className="form-select form-select-sm"
                                  value={stockShopId}
                                  onChange={onStockShopChange}
                                  style={{ minWidth: "140px" }}
                                >
                                  {shopOptions.map((s) => (
                                    <option key={s.shop_id} value={s.shop_id}>
                                      {s.shop_name || s.shop_id} ({s.quantity})
                                    </option>
                                  ))}
                                </select>
                              )
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="align-middle text-end">
                            {productId ? (
                              <input
                                type="number"
                                className="form-control form-control-sm text-end"
                                style={{ width: "70px", display: "inline-block" }}
                                min={1}
                                max={typeof available === "number" ? available : undefined}
                                value={reduceQty}
                                onChange={(e) => setReduceQty(Number(e.target.value) || 0)}
                              />
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="align-middle text-center">
                            {canReduce ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => reduceOne(productId, Number(reduceQty) || 0, orderQty, item.id, shopIdToReduceFrom)}
                                disabled={reducing || !shopIdToReduceFrom}
                                title={!shopIdToReduceFrom ? "Select a shop first" : ""}
                              >
                                {reducing ? "…" : "Reduce"}
                              </button>
                            ) : (
                              <span className="text-muted small">
                                {!productId ? "No product ID" : !shopIdToReduceFrom ? "Select shop" : "—"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Adjustment;
