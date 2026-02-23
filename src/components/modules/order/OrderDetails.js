import React, { useEffect, useState } from "react";
import Breadcrumb from "../../partoals/Breadcrumb";
import CardHeader from "../../partoals/miniComponents/CardHeader";
import axios from "axios";
import Constants from "../../../Constants";
import { useParams } from "react-router-dom";
import ReactDOM from "react-dom";
import GlobalFunction from "../../../assets/GlobalFunction";
import PrintInvoice from "./PrintInvoice";
import GiftInvoicePrint from "./GiftInvoicePrint";

const CANCELLED = 4;

const OrderDetails = () => {
  const params = useParams();
  const [order, setOrder] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTaxType, setSelectedTaxType] = useState(0);
  const [editPaidAmount, setEditPaidAmount] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [addressForm, setAddressForm] = useState({});
  const [addressSaving, setAddressSaving] = useState(false);
  const [addItemProductId, setAddItemProductId] = useState("");
  const [addItemQuantity, setAddItemQuantity] = useState(1);
  const [addItemAttributeValueId, setAddItemAttributeValueId] = useState("");
  const [productAttributes, setProductAttributes] = useState([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [addItemSaving, setAddItemSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [childSubCategories, setChildSubCategories] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [allChildSubCategories, setAllChildSubCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [selectedChildSubCategoryId, setSelectedChildSubCategoryId] = useState("");
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [editQuantities, setEditQuantities] = useState({});
  const [cancelling, setCancelling] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const token = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
  const base = Constants.BASE_URL;
  const id = params.id;
  const isCancelled = order?.order_status === CANCELLED;

  const getOrderDetails = () => {
    setIsLoading(true);
    setLoadError(null);
    const authToken = localStorage.getItem("token");
    axios
      .get(`${Constants.BASE_URL}/order/${params.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setOrder(data);
        const qtyMap = {};
        (data?.order_details ?? []).forEach((d) => { if (d.id != null) qtyMap[d.id] = Number(d.quantity) || 1; });
        setEditQuantities((prev) => ({ ...prev, ...qtyMap }));
        setEditPaidAmount(data?.paid_amount != null ? String(data.paid_amount) : "");
        setAddressForm({
          shipping_name: data?.shipping_name ?? "",
          shipping_phone: data?.shipping_phone ?? "",
          shipping_email: data?.shipping_email ?? "",
          shipping_address_line_1: data?.shipping_address_line_1 ?? "",
          shipping_address_line_2: data?.shipping_address_line_2 ?? "",
          shipping_city: data?.shipping_city ?? "",
          shipping_state: data?.shipping_state ?? "",
          shipping_postal_code: data?.shipping_postal_code ?? "",
          shipping_country: data?.shipping_country ?? "",
          billing_name: data?.billing_name ?? "",
          billing_phone: data?.billing_phone ?? "",
          billing_email: data?.billing_email ?? "",
          billing_address_line_1: data?.billing_address_line_1 ?? "",
          billing_address_line_2: data?.billing_address_line_2 ?? "",
          billing_city: data?.billing_city ?? "",
          billing_state: data?.billing_state ?? "",
          billing_postal_code: data?.billing_postal_code ?? "",
          billing_country: data?.billing_country ?? "",
        });
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
        const msg = err.response?.data?.message || err.message || "Request failed";
        setLoadError(msg);
      });
  };

  const handleUpdateAddress = (e) => {
    e.preventDefault();
    setAddressSaving(true);
    axios.put(`${base}/order/${id}/address`, addressForm, token())
      .then((res) => {
        setOrder(res.data?.data ?? res.data);
        setAddressSaving(false);
      })
      .catch(() => setAddressSaving(false));
  };

  const loadProductFilterData = () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) return;
    axios
      .get(`${base}/get-add-product-data`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then((res) => {
        const data = res.data ?? {};
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setAllSubCategories(Array.isArray(data.sub_categories) ? data.sub_categories : []);
        setAllChildSubCategories(Array.isArray(data.child_sub_categories) ? data.child_sub_categories : []);
      })
      .catch(() => {});
  };

  const fetchProductsForSelection = (categoryId, subCategoryId, childSubCategoryId) => {
    if (!categoryId && !subCategoryId && !childSubCategoryId) {
      setAvailableProducts([]);
      return;
    }
    setLoadingProducts(true);
    const params = { per_page: 100, page: 1 };
    if (categoryId) params.category_id = categoryId;
    if (subCategoryId) params.sub_category_id = subCategoryId;
    if (childSubCategoryId) params.child_sub_category_id = childSubCategoryId;
    axios
      .get(`${Constants.BASE_URL}/products`, { params })
      .then((res) => {
        const raw = res.data;
        const payload = raw?.data ?? raw;
        const list = Array.isArray(payload?.products)
          ? payload.products
          : Array.isArray(payload)
          ? payload
          : [];
        const shopId = order?.shop?.id ? Number(order.shop.id) : null;
        const filtered = !shopId
          ? list
          : list.filter((p) => {
              const shops = Array.isArray(p.shops) ? p.shops : [];
              return shops.some(
                (s) => Number(s.shop_id) === shopId && Number(s.shop_quantity ?? 0) > 0
              );
            });
        setAvailableProducts(filtered);
      })
      .catch(() => {
        setAvailableProducts([]);
      })
      .finally(() => setLoadingProducts(false));
  };

  const handleCategorySelect = (event) => {
    const value = event.target.value;
    setSelectedCategoryId(value);
    setSelectedSubCategoryId("");
    setSelectedChildSubCategoryId("");
    setSubCategories([]);
    setChildSubCategories([]);
    setAvailableProducts([]);
    const id = Number(value);
    if (!id) return;
    const subs = allSubCategories.filter((s) => Number(s.category_id) === id);
    setSubCategories(subs);
    fetchProductsForSelection(id, null, null);
  };

  const handleSubCategorySelect = (event) => {
    const value = event.target.value;
    setSelectedSubCategoryId(value);
    setSelectedChildSubCategoryId("");
    setChildSubCategories([]);
    setAvailableProducts([]);
    const categoryId = selectedCategoryId ? Number(selectedCategoryId) : null;
    const subId = Number(value);
    if (!subId) {
      if (categoryId) fetchProductsForSelection(categoryId, null, null);
      return;
    }
    const childs = allChildSubCategories.filter(
      (c) => Number(c.sub_category_id) === subId
    );
    setChildSubCategories(childs);
    fetchProductsForSelection(categoryId, subId, null);
  };

  const handleChildSubCategorySelect = (event) => {
    const value = event.target.value;
    setSelectedChildSubCategoryId(value);
    setAvailableProducts([]);
    const categoryId = selectedCategoryId ? Number(selectedCategoryId) : null;
    const subId = selectedSubCategoryId ? Number(selectedSubCategoryId) : null;
    const childId = Number(value);
    if (!childId) {
      fetchProductsForSelection(categoryId, subId, null);
      return;
    }
    fetchProductsForSelection(categoryId, subId, childId);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const pid = Number(addItemProductId);
    if (!pid || addItemQuantity < 1) return;
    setAddItemSaving(true);
    const payload = { product_id: pid, quantity: Number(addItemQuantity) };
    const attrId = addItemAttributeValueId ? Number(addItemAttributeValueId) : null;
    if (attrId) payload.attribute_value_id = attrId;
    axios.post(`${base}/order/${id}/items`, payload, token())
      .then((res) => {
        setOrder(res.data?.data ?? res.data);
        setAddItemProductId("");
        setAddItemQuantity(1);
        setAddItemAttributeValueId("");
        setAddItemSaving(false);
      })
      .catch(() => setAddItemSaving(false));
  };

  const handleUpdateQuantity = (detailId) => {
    const qty = editQuantities[detailId] ?? order?.order_details?.find((d) => d.id === detailId)?.quantity;
    const num = Number(qty);
    if (detailId == null || num < 1) return;
    setUpdatingId(detailId);
    axios.put(`${base}/order/${id}/items/${detailId}`, { quantity: num }, { ...token(), headers: { ...token().headers, "Content-Type": "application/json" } })
      .then((res) => {
        const raw = res.data;
        const data = raw?.data ?? raw;
        if (data && (data.order_details || data.total != null)) {
          setOrder(data);
          setEditPaidAmount(data.paid_amount != null ? String(data.paid_amount) : editPaidAmount);
        }
        const details = data?.order_details ?? [];
        const qtyMap = {};
        details.forEach((d) => { if (d.id != null) qtyMap[d.id] = Number(d.quantity) || 1; });
        setEditQuantities((prev) => ({ ...prev, ...qtyMap }));
        setUpdatingId(null);
      })
      .catch(() => setUpdatingId(null));
  };

  const handleRemoveItem = (detailId) => {
    if (!detailId) return;
    setRemovingId(detailId);
    axios.delete(`${base}/order/${id}/items/${detailId}`, token())
      .then((res) => {
        setOrder(res.data?.data ?? res.data);
        setRemovingId(null);
      })
      .catch(() => setRemovingId(null));
  };

  const handleCancelOrder = () => {
    if (!window.confirm("Cancel this order? Stock will be restored.")) return;
    setCancelling(true);
    axios.post(`${base}/order/${id}/cancel`, {}, token())
      .then((res) => {
        setOrder(res.data?.data ?? res.data);
        setCancelling(false);
      })
      .catch(() => setCancelling(false));
  };

  const handleUpdatePayment = () => {
    const paid = Number(editPaidAmount);
    if (isNaN(paid) || paid < 0) return;
    setPaymentSaving(true);
    axios
      .put(
        `${base}/order/${id}/payment`,
        { paid_amount: paid },
        token()
      )
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setOrder(data);
        setEditPaidAmount(data?.paid_amount != null ? String(data.paid_amount) : "");
        setPaymentSaving(false);
      })
      .catch(() => setPaymentSaving(false));
  };

  useEffect(() => {
    getOrderDetails();
    loadProductFilterData();
  }, []);

  useEffect(() => {
    const details = order?.order_details ?? [];
    if (details.length === 0) return;
    setEditQuantities((prev) => {
      const next = { ...prev };
      details.forEach((d) => { if (d.id != null) next[d.id] = Number(d.quantity) ?? prev[d.id] ?? 1; });
      return next;
    });
  }, [order?.order_details]);

  useEffect(() => {
    const pid = Number(addItemProductId);
    if (!pid || pid < 1) {
      setProductAttributes([]);
      setAddItemAttributeValueId("");
      return;
    }
    setLoadingAttributes(true);
    axios.get(`${base}/products/${pid}`, token())
      .then((res) => {
        const product = res.data?.data?.product ?? res.data?.product ?? res.data;
        const attrs = product?.attributes ?? [];
        setProductAttributes(Array.isArray(attrs) ? attrs : []);
        setAddItemAttributeValueId("");
        setLoadingAttributes(false);
      })
      .catch(() => {
        setProductAttributes([]);
        setAddItemAttributeValueId("");
        setLoadingAttributes(false);
      });
  }, [addItemProductId]);

  const handleTaxTypeChange = (event) => {
    setSelectedTaxType(event.target.value);
  };

  console.log(selectedTaxType);

  const printInvoice = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.open();
    printWindow.document.write(
      "<html><head><title>Print Invoice</title></head><body>"
    );
    ReactDOM.render(
      <PrintInvoice order={order} taxType={selectedTaxType} />,
      printWindow.document.body
    );

    printWindow.document.write("</body></html>");
    printWindow.document.close();

    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };

  const giftInvoicePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.open();
    printWindow.document.write(
      "<html><head><title>Print Gift Invoice</title></head><body>"
    );
    ReactDOM.render(
      <GiftInvoicePrint order={order} taxType={selectedTaxType} />,
      printWindow.document.body
    );

    printWindow.document.write("</body></html>");
    printWindow.document.close();
    
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };
  

  if (isLoading && !order) {
    return (
      <>
        <Breadcrumb title={"Order Details"} />
        <div className="row"><div className="col-md-12"><div className="card"><div className="card-body">Loading…</div></div></div></div>
      </>
    );
  }
  if (!order && loadError) {
    return (
      <>
        <Breadcrumb title={"Order Details"} />
        <div className="row"><div className="col-md-12"><div className="card"><div className="card-body text-danger">{loadError}</div></div></div></div>
      </>
    );
  }
  if (!order) {
    return (
      <>
        <Breadcrumb title={"Order Details"} />
        <div className="row"><div className="col-md-12"><div className="card"><div className="card-body">Order not found.</div></div></div></div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb title={"Order Details"} />
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <CardHeader
                title={`${order?.order_number} Order Details`}
                link={"/orders"}
                icon={"fa-list"}
                button_text={"List"}
              />
            </div>
            <div className="tax-type-dropdown text-center my-3">
                <label>Select Tax Type:</label>
                <select value={selectedTaxType} onChange={handleTaxTypeChange} className="mx-2">
                  <option value="0" selected>Select Vat %</option>
                  <option value="0.050">Retail Vat (5.0%)</option>
                  <option value="0.075">Supply Vat (7.5%)</option>
                  <option value="0.000">Vat Exempt (0.0%)</option>
                  {/* Add options for other tax types as needed */}
                </select>
              </div>
            <div className="search-area mb-4 mx-3">
              <div className="row">
                <div className="col-md-6">
                  <div className="card-header">
                    <h5> Customer Details</h5>
                  </div>
                  <div className="card-body">
                    <table
                      className={
                        "table table-hover table-bordered table-striped sm-table"
                      }
                    >
                      <thead>
                        <tr>
                          <th>Name</th>
                          <td>{order?.customer?.name}</td>
                        </tr>
                        <tr>
                          <th>Phone</th>
                          <td>{order?.customer?.phone}</td>
                        </tr>
                        <tr>
                          <th>Email</th>
                          <td>{order?.customer?.email}</td>
                        </tr>
                      </thead>
                    </table>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card-header">
                    <h5> Shop Details</h5>
                  </div>
                  <div className="card-body">
                    <table
                      className={
                        "table table-hover table-bordered table-striped sm-table"
                      }
                    >
                      <thead>
                        <tr>
                          <th className={"align-middle"}>Shop</th>
                          <td className={"align-middle"}>
                            <img
                              src={order?.shop?.logo}
                              alt={"shop Logo"}
                              className="table-image img-thumbnail"
                            />
                          </td>
                        </tr>
                        <tr>
                          <th className={"align-middle"}>Shop Name</th>
                          <td className={"align-middle"}>
                            {order?.shop?.name}
                          </td>
                        </tr>
                        <tr>
                          <th className={"align-middle"}>Sales Manager</th>
                          <td className={"align-middle"}>
                            {order?.sales_manager?.name}
                          </td>
                        </tr>
                      </thead>
                    </table>
                  </div>
                </div>
              </div>
              <div className="col-md-12 mt-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h5>Order Summary</h5>
                  </div>

                  <div className="card-body">
                    <table
                      className={
                        "table table-bordered table-hover table-striped sm-table"
                      }
                    >
                      <tbody>
                        <tr>
                          <th className="align-middle">Order Number</th>
                          <td className="align-middle">
                            <strong>{order?.order_number}</strong>
                          </td>
                          <th className="align-middle">Total Items</th>
                          <td className="align-middle">
                            <strong>{order?.quantity}</strong>
                          </td>
                        </tr>
                        <tr>
                          <th className="align-middle">Order status</th>
                          <td className="align-middle">
                            <strong>{order?.order_status_string}</strong>
                          </td>
                          <th className="align-middle">Payment Status</th>
                          <td className="align-middle">
                            <strong>{order?.payment_status}</strong>
                          </td>
                        </tr>
                        <tr>
                          <th className="align-middle">Payment Method</th>
                          <td className="align-middle">
                            {order?.payment_method?.name}
                          </td>
                          <th className="align-middle">Account Number</th>
                          <td className="align-middle">
                            {order?.payment_method?.account_number}
                          </td>
                        </tr>
                        <tr>
                          <th className="align-middle">Sub Total</th>
                          <td className="align-middle">
                            <strong>
                              {GlobalFunction.formatPrice(order?.sub_total)}
                            </strong>
                          </td>
                          <th className="align-middle">Discount</th>
                          <td className="align-middle">
                            {GlobalFunction.formatPrice(order?.discount)}
                          </td>
                        </tr>
                        <tr>
                          <th className="align-middle">Total</th>
                          <td className="align-middle">
                            <strong className="text-theme">
                              {GlobalFunction.formatPrice(order?.total)}
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <th className="align-middle">Paid Amount</th>
                          <td className="align-middle">
                            <strong className="text-success">
                              {GlobalFunction.formatPrice(order?.paid_amount)}
                            </strong>
                          </td>
                          <th className="align-middle">Due Amount</th>
                          <td className="align-middle">
                            <strong className="text-danger">
                              {GlobalFunction.formatPrice(order?.due_amount)}
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <th className="align-middle">Order Placed</th>
                          <td className="align-middle">
                            <strong>{order?.created_at}</strong>
                          </td>
                          <th className="align-middle">Order Updated</th>
                          <td className="align-middle">
                            <strong>{order?.updated_at}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {!isCancelled && (
              <div className="col-md-12 mt-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h5>Edit payment</h5>
                  </div>
                  <div className="card-body">
                    <div className="row align-items-end">
                      <div className="col-md-2">
                        <label className="form-label">Paid amount</label>
                        <input
                          type="number"
                          className="form-control"
                          min={0}
                          max={order?.total ?? 0}
                          value={editPaidAmount}
                          onChange={(e) => setEditPaidAmount(e.target.value)}
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Total</label>
                        <p className="form-control-plaintext mb-0">{GlobalFunction.formatPrice(order?.total)}</p>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Due amount</label>
                        <p className="form-control-plaintext mb-0">
                          {GlobalFunction.formatPrice(Math.max(0, (order?.total ?? 0) - (Number(editPaidAmount) || 0)))}
                        </p>
                      </div>
                      <div className="col-md-2">
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={paymentSaving}
                          onClick={handleUpdatePayment}
                        >
                          {paymentSaving ? "Saving…" : "Update payment"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {!isCancelled && (
              <div className="col-md-12 mt-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h5>Update address</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={handleUpdateAddress}>
                      <div className="row mb-2">
                        <div className="col-md-12"><strong>Shipping</strong></div>
                        <div className="col-md-4 mt-1">
                          <input className="form-control form-control-sm" placeholder="Name" value={addressForm.shipping_name ?? ""} onChange={(e) => setAddressForm({ ...addressForm, shipping_name: e.target.value })} />
                        </div>
                        <div className="col-md-4 mt-1">
                          <input className="form-control form-control-sm" placeholder="Phone" value={addressForm.shipping_phone ?? ""} onChange={(e) => setAddressForm({ ...addressForm, shipping_phone: e.target.value })} />
                        </div>
                        <div className="col-md-4 mt-1">
                          <input className="form-control form-control-sm" placeholder="Email" value={addressForm.shipping_email ?? ""} onChange={(e) => setAddressForm({ ...addressForm, shipping_email: e.target.value })} />
                        </div>
                        <div className="col-md-6 mt-1">
                          <input className="form-control form-control-sm" placeholder="Address line 1" value={addressForm.shipping_address_line_1 ?? ""} onChange={(e) => setAddressForm({ ...addressForm, shipping_address_line_1: e.target.value })} />
                        </div>
                        <div className="col-md-6 mt-1">
                          <input className="form-control form-control-sm" placeholder="Address line 2" value={addressForm.shipping_address_line_2 ?? ""} onChange={(e) => setAddressForm({ ...addressForm, shipping_address_line_2: e.target.value })} />
                        </div>
                        <div className="col-md-4 mt-1">
                          <input className="form-control form-control-sm" placeholder="City" value={addressForm.shipping_city ?? ""} onChange={(e) => setAddressForm({ ...addressForm, shipping_city: e.target.value })} />
                        </div>
                        <div className="col-md-4 mt-1">
                          <input className="form-control form-control-sm" placeholder="State" value={addressForm.shipping_state ?? ""} onChange={(e) => setAddressForm({ ...addressForm, shipping_state: e.target.value })} />
                        </div>
                        <div className="col-md-4 mt-1">
                          <input className="form-control form-control-sm" placeholder="Postal / Country" value={addressForm.shipping_postal_code ?? ""} onChange={(e) => setAddressForm({ ...addressForm, shipping_postal_code: e.target.value })} />
                        </div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-md-12"><strong>Billing</strong></div>
                        <div className="col-md-4 mt-1">
                          <input className="form-control form-control-sm" placeholder="Name" value={addressForm.billing_name ?? ""} onChange={(e) => setAddressForm({ ...addressForm, billing_name: e.target.value })} />
                        </div>
                        <div className="col-md-4 mt-1">
                          <input className="form-control form-control-sm" placeholder="Phone" value={addressForm.billing_phone ?? ""} onChange={(e) => setAddressForm({ ...addressForm, billing_phone: e.target.value })} />
                        </div>
                        <div className="col-md-4 mt-1">
                          <input className="form-control form-control-sm" placeholder="Email" value={addressForm.billing_email ?? ""} onChange={(e) => setAddressForm({ ...addressForm, billing_email: e.target.value })} />
                        </div>
                        <div className="col-md-6 mt-1">
                          <input className="form-control form-control-sm" placeholder="Address line 1" value={addressForm.billing_address_line_1 ?? ""} onChange={(e) => setAddressForm({ ...addressForm, billing_address_line_1: e.target.value })} />
                        </div>
                        <div className="col-md-6 mt-1">
                          <input className="form-control form-control-sm" placeholder="Address line 2" value={addressForm.billing_address_line_2 ?? ""} onChange={(e) => setAddressForm({ ...addressForm, billing_address_line_2: e.target.value })} />
                        </div>
                        <div className="col-md-4 mt-1">
                          <input className="form-control form-control-sm" placeholder="City" value={addressForm.billing_city ?? ""} onChange={(e) => setAddressForm({ ...addressForm, billing_city: e.target.value })} />
                        </div>
                        <div className="col-md-4 mt-1">
                          <input className="form-control form-control-sm" placeholder="State" value={addressForm.billing_state ?? ""} onChange={(e) => setAddressForm({ ...addressForm, billing_state: e.target.value })} />
                        </div>
                        <div className="col-md-4 mt-1">
                          <input className="form-control form-control-sm" placeholder="Postal / Country" value={addressForm.billing_postal_code ?? ""} onChange={(e) => setAddressForm({ ...addressForm, billing_postal_code: e.target.value })} />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={addressSaving}>{addressSaving ? "Saving…" : "Update address"}</button>
                    </form>
                  </div>
                </div>
              </div>
              )}

              {!isCancelled && (
              <div className="col-md-12 mt-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h5>Add item to order</h5>
                  </div>
                  <div className="card-body">
                  <form onSubmit={handleAddItem} className="row align-items-end g-2">
                    <div className="col-md-3 col-sm-6">
                      <label className="form-label mb-0">Category</label>
                      <select
                        className="form-select form-select-sm"
                        value={selectedCategoryId}
                        onChange={handleCategorySelect}
                      >
                        <option value="">Select category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <label className="form-label mb-0">Sub Category</label>
                      <select
                        className="form-select form-select-sm"
                        value={selectedSubCategoryId}
                        onChange={handleSubCategorySelect}
                        disabled={!selectedCategoryId}
                      >
                        <option value="">Select sub category</option>
                        {subCategories.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <label className="form-label mb-0">Child Sub Category</label>
                      <select
                        className="form-select form-select-sm"
                        value={selectedChildSubCategoryId}
                        onChange={handleChildSubCategorySelect}
                        disabled={!selectedSubCategoryId}
                      >
                        <option value="">Select child sub category</option>
                        {childSubCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <label className="form-label mb-0">Product</label>
                      <select
                        className="form-select form-select-sm mb-1"
                        value={addItemProductId}
                        onChange={(e) => setAddItemProductId(e.target.value)}
                      >
                        <option value="">Select product</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.sku ? `(${p.sku})` : ""} #{p.id}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min={1}
                        value={addItemProductId}
                        onChange={(e) => setAddItemProductId(e.target.value)}
                        placeholder="Or enter Product ID"
                      />
                    </div>
                    {loadingProducts && (
                      <div className="col-12 text-muted small">
                        Loading products…
                      </div>
                    )}
                      {productAttributes.length > 0 && (
                        <div className="col-auto">
                          <label className="form-label mb-0">Attribute</label>
                          <select className="form-select form-select-sm" value={addItemAttributeValueId} onChange={(e) => setAddItemAttributeValueId(e.target.value)}>
                            <option value="">— None —</option>
                            {productAttributes
                              .filter((a) => a.value_id != null)
                              .map((a) => (
                                <option key={a.id || a.value_id} value={String(a.value_id)}>
                                  {[a.attribute_name, a.attribute_value].filter(Boolean).join(": ") || `Value #${a.value_id}`}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                      {loadingAttributes && <div className="col-auto align-self-end text-muted small">Loading attributes…</div>}
                      <div className="col-auto">
                        <label className="form-label mb-0">Quantity</label>
                        <input type="number" className="form-control form-control-sm" min={1} value={addItemQuantity} onChange={(e) => setAddItemQuantity(Number(e.target.value) || 1)} />
                      </div>
                      <div className="col-auto">
                        <button type="submit" className="btn btn-primary btn-sm" disabled={addItemSaving}>{addItemSaving ? "Adding…" : "Add item"}</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              )}

              <div className="col-md-12 mt-4">
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Order Item Details</h5>
                    {!isCancelled && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={handleCancelOrder} disabled={cancelling}>{cancelling ? "Cancelling…" : "Cancel order"}</button>
                    )}
                    {!isCancelled && (
                      <span className="text-muted small">Update quantity in the table and click Update per row.</span>
                    )}
                  </div>

                  <div className="card-body">
                    <table
                      className={
                        "table table-bordered table-hover table-striped table-sm sm-table"
                      }
                    >
                      <thead>
                        <tr>
                          <th>SL</th>
                          <th>Name</th>
                          <th>Attribute</th>
                          <th>Info</th>
                          <th>Quantity</th>
                          <th>Photo</th>
                          <th>Amounts</th>
                          <th className="text-end">Line Total</th>
                          {!isCancelled && <th>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {order?.order_details?.map((product, index) => (
                          <tr key={product.id ?? index}>
                            <td className="align-middle">{index + 1}</td>
                            <td className="align-middle">
                              <p>{product.name}</p>
                              <p>SKU: {product.sku}</p>
                              <p>Supplier: {product.supplier}</p>
                            </td>
                            <td className="align-middle">{product.attribute != null && product.attribute !== "" ? product.attribute : "—"}</td>
                            <td className="align-middle">
                              <p>Brand: {product?.brand}</p>
                              <p>Category: {product?.category}</p>
                              <p>Sub Category: {product?.sub_category}</p>
                            </td>
                            <td className="align-middle">
                              {!isCancelled ? (
                                <div className="d-flex align-items-center gap-1">
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    min={1}
                                    style={{ width: "4rem" }}
                                    value={editQuantities[product.id] ?? product.quantity ?? ""}
                                    onChange={(e) => setEditQuantities((prev) => ({ ...prev, [product.id]: Number(e.target.value) || 1 }))}
                                  />
                                  <button type="button" className="btn btn-outline-primary btn-sm" disabled={updatingId === product.id} onClick={() => handleUpdateQuantity(product.id)}>
                                    {updatingId === product.id ? "…" : "Update"}
                                  </button>
                                </div>
                              ) : (
                                product?.quantity
                              )}
                            </td>
                            <td className="align-middle">
                              <img src={product?.photo} alt="" className="table-image img-thumbnail" />
                            </td>
                            <td className="align-middle">
                              <p>Original Price: {product?.price}</p>
                              <p>Discount: {GlobalFunction.formatPrice(product?.sell_price?.discount)}</p>
                              <p>Sale Price: {GlobalFunction.formatPrice(product?.sell_price?.price)}</p>
                            </td>
                            <td className="align-middle text-end">
                              {GlobalFunction.formatPrice(
                                product?.line_total ??
                                (Number(product?.sell_price?.price ?? 0) * Number(product?.quantity ?? 0))
                              )}
                            </td>
                            {!isCancelled && (
                              <td className="align-middle">
                                <button type="button" className="btn btn-outline-danger btn-sm" disabled={removingId === product.id} onClick={() => handleRemoveItem(product.id)}>
                                  {removingId === product.id ? "…" : "Remove"}
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={7} className="text-end fw-bold">Total cost</td>
                          <td className="text-end fw-bold">{GlobalFunction.formatPrice(order?.total)}</td>
                          {!isCancelled && <td />}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              <div className="col-md-12 mt-4 mb-5">
                <div className="card h-100">
                  <div className="card-header">
                    <h5>History / activity log</h5>
                  </div>
                  <div className="card-body">
                    {order?.history?.length ? (
                      <table className="table table-sm table-bordered table-striped">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Action</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.history.map((h) => (
                            <tr key={h.id}>
                              <td>{h.created_at}</td>
                              <td>{h.action?.replace(/_/g, " ")}</td>
                              <td>{h.description ?? ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-muted mb-0">No history yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-12 mt-4 mb-5">
                <div className="card h-100">
                  <div className="card-header">
                    <h5>Transactions</h5>
                  </div>

                  <div className="card-body">
                    <table
                      className={
                        "table table-bordered table-hover table-striped table-sm sm-table"
                      }
                    >
                      <thead>
                        <tr>
                          <th>SL</th>
                          <th>Trx Id</th>
                          <th>Amount</th>
                          <th>Customer</th>
                          <th>Payment Method</th>
                          <th>Status</th>
                          <th>Transaction By</th>
                          <th>Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order?.transactions ?? []).map((transaction, index) => (
                          <tr key={index}>
                            <td className={"align-middle"}> {++index}</td>
                            <td className={"align-middle"}>
                              <p>{transaction.trx_id}</p>
                            </td>
                            <td className={"align-middle"}>
                              <p>
                                {GlobalFunction.formatPrice(
                                  transaction?.amount
                                )}
                              </p>
                            </td>
                            <td className={"align-middle"}>
                              <p>Name: {transaction?.customer_name}</p>
                              <p>Phone: {transaction?.customer_phone}</p>
                            </td>
                            <td className={"align-middle"}>
                              <p>
                                Payment Method:{" "}
                                {transaction?.payment_method_name}
                              </p>
                              <p>
                                Account Number: {transaction?.account_number}
                              </p>
                            </td>
                            <td className={"align-middle"}>
                              <p>Status: {transaction?.status}</p>
                              <p>TRX Type: {transaction?.transaction_type}</p>
                            </td>
                            <td className={"align-middle"}>
                              <p>{transaction?.transaction_by}</p>
                            </td>
                            <td className={"align-middle"}>
                              <p>{transaction?.created_at}</p>
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
        </div>
      </div>
      {/* Add a print button */}
      <div className="text-center no-print">
        <button className="btn btn-primary" onClick={printInvoice}>
          Print Invoice
        </button>
        <button className="btn btn-primary mx-2" onClick={giftInvoicePrint}>
          Gift Invoice
        </button>
      </div>
    </>
  );
};

export default OrderDetails;
