import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../../partoals/Breadcrumb";
import CardHeader from "../../partoals/miniComponents/CardHeader";
import Constants from "../../../Constants";
import Loader from "../../partoals/miniComponents/Loader";
import Pagination from "react-js-pagination";

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

function CustomerList() {
    const [input, setInput] = useState({
        search: "",
        per_page: 15,
        page: 1,
    });
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    const fetchCustomers = useCallback((page = 1) => {
        setIsLoading(true);
        const params = new URLSearchParams({
            search: input.search,
            per_page: String(input.per_page),
            page: String(page),
        });
        axios
            .get(`${Constants.BASE_URL}/customer?${params}`, authHeaders())
            .then((res) => {
                const data = res.data;
                if (data && typeof data.data !== "undefined") {
                    setCustomers(data.data || []);
                    setTotal(data.total || 0);
                    setCurrentPage(data.current_page || 1);
                    setPerPage(data.per_page || 15);
                } else {
                    const list = Array.isArray(data) ? data : [];
                    setCustomers(list);
                    setTotal(list.length);
                }
            })
            .catch(() => setCustomers([]))
            .finally(() => setIsLoading(false));
    }, [input.search, input.per_page]);

    useEffect(() => {
        fetchCustomers(input.page);
    }, [input.page]);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setInput((prev) => ({ ...prev, [name]: value }));
    };

    const handleFilter = () => {
        setInput((prev) => ({ ...prev, page: 1 }));
        fetchCustomers(1);
    };

    const handlePageChange = (page) => {
        setInput((prev) => ({ ...prev, page }));
    };

    return (
        <>
            <Breadcrumb title="Customer List" />
            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <CardHeader
                                title="Customer List"
                                link="#"
                                icon="fa-list"
                                button_text="List"
                                hide
                            />
                        </div>
                        <div className="card-body">
                            <div className="mb-4">
                                <label className="form-label fw-semibold">Filter customer</label>
                                <div className="d-flex flex-wrap gap-2 align-items-end">
                                    <div className="flex-grow-1" style={{ minWidth: "200px" }}>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            name="search"
                                            value={input.search}
                                            onChange={handleInput}
                                            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                                            placeholder="Search by name, phone or email"
                                        />
                                    </div>
                                    <div style={{ width: "100px" }}>
                                        <select
                                            className="form-select form-select-sm"
                                            name="per_page"
                                            value={input.per_page}
                                            onChange={handleInput}
                                        >
                                            <option value={10}>10</option>
                                            <option value={15}>15</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-primary"
                                        onClick={handleFilter}
                                    >
                                        <i className="fa-solid fa-search me-1" />
                                        Filter
                                    </button>
                                </div>
                            </div>

                            {isLoading ? (
                                <Loader />
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-bordered table-hover table-striped">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Name</th>
                                                    <th>Phone</th>
                                                    <th>Email</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="text-center text-muted">
                                                            No customers found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    customers.map((c, index) => (
                                                        <tr key={c.id}>
                                                            <td>{(currentPage - 1) * perPage + index + 1}</td>
                                                            <td>
                                                            <Link to={`/customers/${c.id}/orders`}>{c.name || "—"}</Link>
                                                        </td>
                                                            <td>{c.phone || "—"}</td>
                                                            <td>{c.email || "—"}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {total > perPage && (
                                        <div className="d-flex justify-content-center mt-3">
                                            <Pagination
                                                activePage={currentPage}
                                                itemsCountPerPage={perPage}
                                                totalItemsCount={total}
                                                pageRangeDisplayed={5}
                                                onChange={handlePageChange}
                                                itemClass="page-item"
                                                linkClass="page-link"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CustomerList;
