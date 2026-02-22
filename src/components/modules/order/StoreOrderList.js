import React, { useEffect, useRef, useState } from "react";
import Breadcrumb from "../../partoals/Breadcrumb";
import CardHeader from "../../partoals/miniComponents/CardHeader";
import axios from "axios";
import Swal from "sweetalert2";
import Constants from "../../../Constants";
import Pagination from "react-js-pagination";
import { Link } from "react-router-dom";
import Loader from "../../partoals/miniComponents/Loader";
import GlobalFunction from "../../../assets/GlobalFunction";

function StoreOrderList() {
    const [input, setInput] = useState({
        order_by: "id",
        per_page: 10,
        direction: "desc",
        search: "",
        shop_id: "",
    });
    const inputRef = useRef(input);
    inputRef.current = input;

    const [shops, setShops] = useState([]);
    const [itemsCountsPerPage, setItemsCountPerPage] = useState(0);
    const [totalCountsPerPage, setTotalCountPerPage] = useState(1);
    const [startFrom, setStartFrom] = useState(1);
    const [activePage, setActivePage] = useState(1);

    const [isLoading, setIsLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setInput((prev) => ({ ...prev, [name]: value }));
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(orders.map((o) => o.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const cancelOrderPayload = (store_order_id, cancelled_by, reason) => ({
        store_order_id,
        cancelled_by,
        reason: reason || "customer returned items",
        status: "cancelled",
    });

    const postCancelOrder = (payload) => {
        const token = localStorage.getItem("token");
        return axios.post(
            `${Constants.BASE_URL}/storecustomer/cancel`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
    };

    const openCancelPopup = (singleId) =>
        new Promise((resolve) => {
            Swal.fire({
                title: "Cancel order – provide details",
                html: `
                    <label class="text-start d-block mb-1">Cancelled by</label>
                    <input id="swal-cancelled_by" class="swal2-input" value="${localStorage.getItem("name") || "Store User"}" placeholder="Your name" />
                    <label class="text-start d-block mb-1 mt-3">Reason</label>
                    <textarea id="swal-reason" class="swal2-textarea" placeholder="Reason (e.g. customer returned items)" rows="3">customer returned items</textarea>
                `,
                showCancelButton: true,
                confirmButtonText: "Cancel order",
                confirmButtonColor: "#d33",
                preConfirm: () => {
                    const cancelled_by = document.getElementById("swal-cancelled_by")?.value?.trim();
                    const reason = document.getElementById("swal-reason")?.value?.trim();
                    if (!cancelled_by) {
                        Swal.showValidationMessage("Cancelled by is required");
                        return false;
                    }
                    if (!reason) {
                        Swal.showValidationMessage("Reason is required");
                        return false;
                    }
                    return { cancelled_by, reason };
                },
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    resolve(result.value);
                } else {
                    resolve(null);
                }
            });
        });

    const handleCancelOne = (order) => {
        if (order.status === "cancelled") {
            Swal.fire({ icon: "info", title: "Order is already cancelled." });
            return;
        }
        openCancelPopup(order.id).then((values) => {
            if (!values) return;
            setDeleteLoading(true);
            postCancelOrder(
                cancelOrderPayload(order.id, values.cancelled_by, values.reason)
            )
                .then(() => {
                    Swal.fire({ icon: "success", title: "Order cancelled." });
                    getOrders(activePage);
                })
                .catch((err) => {
                    Swal.fire({
                        icon: "error",
                        title: err?.response?.data?.message || err?.response?.data?.msg || "Failed to cancel.",
                    });
                })
                .finally(() => setDeleteLoading(false));
        });
    };

    const handleBulkCancel = () => {
        if (selectedIds.length === 0) {
            Swal.fire({ icon: "warning", title: "Select at least one order." });
            return;
        }
        openCancelPopup().then((values) => {
            if (!values) return;
            setDeleteLoading(true);
            const payloads = selectedIds.map((id) =>
                cancelOrderPayload(id, values.cancelled_by, values.reason)
            );
            Promise.all(payloads.map((p) => postCancelOrder(p)))
                .then(() => {
                    Swal.fire({
                        icon: "success",
                        title: "Selected orders cancelled.",
                    });
                    setSelectedIds([]);
                    getOrders(activePage);
                })
                .catch((err) => {
                    Swal.fire({
                        icon: "error",
                        title:
                            err?.response?.data?.message ||
                            err?.response?.data?.msg ||
                            "Some orders could not be cancelled.",
                    });
                    getOrders(activePage);
                })
                .finally(() => setDeleteLoading(false));
        });
    };

    const getShops = () => {
        const token = localStorage.getItem("token");
        axios
            .get(`${Constants.BASE_URL}/get-shop-list`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setShops(Array.isArray(res.data) ? res.data : []))
            .catch(() => setShops([]));
    };

    const getOrders = (pageNumber = 1) => {
        const filter = inputRef.current;
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({
            page: String(pageNumber),
            search: String(filter.search ?? ""),
            order_by: String(filter.order_by ?? "id"),
            per_page: String(filter.per_page ?? 10),
            direction: String(filter.direction ?? "desc"),
        });
        if (filter.shop_id != null && String(filter.shop_id).trim() !== "") {
            params.set("shop_id", String(filter.shop_id));
        }
        const url = `${Constants.BASE_URL}/storecustomer?${params.toString()}`;
        setIsLoading(true);
        setOrders([]);
        axios
            .get(url, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                const paginated = res.data;
                setOrders(paginated.data || []);
                setItemsCountPerPage(paginated.per_page || 0);
                setStartFrom(paginated.from != null ? paginated.from : 1);
                setTotalCountPerPage(paginated.total || 0);
                setActivePage(paginated.current_page || 1);
                setSelectedIds([]);
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        getShops();
        getOrders(1);
    }, []);

    return (
        <>
            <Breadcrumb title={"Store Order List"} />
            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <CardHeader
                                title={"Store Order list"}
                                link={"/orders/create"}
                                icon={"fa-add"}
                                button_text={"Add"}
                            />
                        </div>
                        <div className="search-area mb-4 mx-3">
                            <div className="row">
                                <div className="col-md-2">
                                    <label className="w-100">
                                        <p>Branch</p>
                                        <select
                                            className="form-select form-control-sm"
                                            name="shop_id"
                                            value={input.shop_id}
                                            onChange={handleInput}
                                        >
                                            <option value="">All branches</option>
                                            {shops.map((shop) => (
                                                <option key={shop.id} value={shop.id}>
                                                    {shop.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div className="col-md-2">
                                    <label className="w-100">
                                        <p>Search</p>
                                        <input
                                            className="form-control form-control-sm"
                                            type="text"
                                            name="search"
                                            value={input.search}
                                            onChange={handleInput}
                                            placeholder="Order ID or customer number"
                                        />
                                    </label>
                                </div>
                                <div className="col-md-2">
                                    <label className={"w-100"}>
                                        <p>Order By</p>
                                        <select
                                            className="form-select form-control-sm"
                                            name="order_by"
                                            value={input.order_by}
                                            onChange={handleInput}
                                        >
                                            <option value="id">ID</option>
                                            <option value="customer_number">Customer</option>
                                            <option value="total_amount">Total</option>
                                            <option value="status">Status</option>
                                            <option value="created_at">Created</option>
                                            <option value="updated_at">Updated</option>
                                        </select>
                                    </label>
                                </div>
                                <div className="col-md-2">
                                    <label className={"w-100"}>
                                        <p>Order Direction</p>
                                        <select
                                            className="form-select form-control-sm"
                                            name={"direction"}
                                            value={input.direction}
                                            onChange={handleInput}
                                        >
                                            <option value={"asc"}>ASC</option>
                                            <option value={"desc"}>DESC</option>
                                        </select>
                                    </label>
                                </div>
                                <div className="col-md-2">
                                    <label className={"w-100"}>
                                        <p>Per Page</p>
                                        <select
                                            className="form-select form-control-sm"
                                            name={"per_page"}
                                            value={input.per_page}
                                            onChange={handleInput}
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </label>
                                </div>
                                <div className="col-md-2">
                                    <div className="d-grid mt-4">
                                        <button
                                            onClick={() => getOrders(1)}
                                            className={"btn theme-button"}
                                        >
                                            <i className="fa-solid fa-magnifying-glass"></i>
                                            Search
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {selectedIds.length > 0 && (
                                <div className="mb-3">
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={handleBulkCancel}
                                        disabled={deleteLoading}
                                    >
                                        {deleteLoading
                                            ? "Cancelling..."
                                            : `Cancel selected (${selectedIds.length})`}
                                    </button>
                                </div>
                            )}
                            {isLoading ? (
                                <Loader />
                            ) : (
                                <div className="table-responsive soft-landing">
                                    <table className="my-table table table-hover table-striped table-bordered">
                                        <thead>
                                            <tr>
                                                <th className="align-middle">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            orders.length > 0 &&
                                                            selectedIds.length === orders.length
                                                        }
                                                        onChange={toggleSelectAll}
                                                    />
                                                </th>
                                                <th>SL</th>
                                                <th>Order Details</th>
                                                <th>Customer</th>
                                                <th>Amount</th>
                                                <th>Date Time</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders &&
                                                orders.map((order, index) => (
                                                    <tr key={order.id}>
                                                        <td className="align-middle">
                                                            {order.status !== "cancelled" && (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedIds.includes(
                                                                        order.id
                                                                    )}
                                                                    onChange={() =>
                                                                        toggleSelectOne(order.id)
                                                                    }
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="align-middle">
                                                            {startFrom + index}
                                                        </td>
                                                        <td className="align-middle">
                                                            <p>
                                                                Order: <strong>#{order.id}</strong>
                                                            </p>
                                                            <p>Status: {order.status}</p>
                                                            <p>Shop ID: {order.shop_id}</p>
                                                        </td>
                                                        <td className="align-middle">
                                                            {order.customer_number || "—"}
                                                        </td>
                                                        <td className="align-middle">
                                                            <p>
                                                                Total:{" "}
                                                                {GlobalFunction.formatPrice(
                                                                    order.total_amount
                                                                )}
                                                            </p>
                                                            <p>
                                                                Due:{" "}
                                                                {GlobalFunction.formatPrice(
                                                                    order.due_amount
                                                                )}
                                                            </p>
                                                        </td>
                                                        <td className="align-middle">
                                                            <p>{order.created_at}</p>
                                                        </td>
                                                        <td className="align-middle">
                                                            <Link
                                                                to={`/store-order/${order.id}`}
                                                                className="btn btn-info btn-sm me-1"
                                                            >
                                                                <i className="fa-solid fa-eye" />
                                                            </Link>
                                                            {order.status !== "cancelled" && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() =>
                                                                        handleCancelOne(order)
                                                                    }
                                                                    disabled={deleteLoading}
                                                                >
                                                                    <i className="fa-solid fa-times" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        </div>
                        <div className="card-footer">
                            <nav className={"pagination-sm"}>
                                <Pagination
                                    activePage={activePage}
                                    itemsCountPerPage={itemsCountsPerPage}
                                    totalItemsCount={totalCountsPerPage}
                                    pageRangeDisplayed={5}
                                    onChange={getOrders}
                                    firstPageText={"First"}
                                    nextPageText={"Next"}
                                    prevPageText={"Previous"}
                                    lastPageText={"Last"}
                                    itemClass={"page-item"}
                                    linkClass={"page-link"}
                                />
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}


export default StoreOrderList