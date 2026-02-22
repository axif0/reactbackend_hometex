import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-bootstrap/Modal';
import Constants from "../../../Constants";
import Breadcrumb from "../../partoals/Breadcrumb";
import CardHeader from "../../partoals/miniComponents/CardHeader";

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const Report = () => {
    const [report, setReport] = useState({});
    const [showMonthlySales, setShowMonthlySales] = useState(false);
    const [showMonthlyPurchase, setShowMonthlyPurchase] = useState(false);
    const [showTodayByBranch, setShowTodayByBranch] = useState(false);
    const [showShopStock, setShowShopStock] = useState(false);
    const [showLowStock, setShowLowStock] = useState(false);
    const [monthlySalesData, setMonthlySalesData] = useState([]);
    const [monthlyPurchaseData, setMonthlyPurchaseData] = useState([]);
    const [todayByBranchData, setTodayByBranchData] = useState([]);
    const [shopStockData, setShopStockData] = useState([]);
    const [lowStockData, setLowStockData] = useState([]);
    const [loadingModal, setLoadingModal] = useState(null);

    const getReport = useCallback(() => {
        axios.get(`${Constants.BASE_URL}/get-reports`, authHeaders()).then(res => setReport(res.data));
    }, []);

    useEffect(() => { getReport(); }, [getReport]);

    const openMonthlySales = () => {
        setShowMonthlySales(true);
        setLoadingModal('monthlySales');
        axios.get(`${Constants.BASE_URL}/get-reports/monthly-sales`, authHeaders())
            .then(res => { setMonthlySalesData(res.data); setLoadingModal(null); })
            .catch(() => setLoadingModal(null));
    };
    const openMonthlyPurchase = () => {
        setShowMonthlyPurchase(true);
        setLoadingModal('monthlyPurchase');
        axios.get(`${Constants.BASE_URL}/get-reports/monthly-purchase`, authHeaders())
            .then(res => { setMonthlyPurchaseData(res.data); setLoadingModal(null); })
            .catch(() => setLoadingModal(null));
    };
    const openTodayByBranch = () => {
        setShowTodayByBranch(true);
        setLoadingModal('todayByBranch');
        axios.get(`${Constants.BASE_URL}/get-reports/sales-today-by-branch`, authHeaders())
            .then(res => { setTodayByBranchData(res.data); setLoadingModal(null); })
            .catch(() => setLoadingModal(null));
    };
    const openShopStock = () => {
        setShowShopStock(true);
        setLoadingModal('shopStock');
        axios.get(`${Constants.BASE_URL}/get-reports/shop-stock-summary`, authHeaders())
            .then(res => { setShopStockData(res.data); setLoadingModal(null); })
            .catch(() => setLoadingModal(null));
    };
    const openLowStock = () => {
        setShowLowStock(true);
        setLoadingModal('lowStock');
        axios.get(`${Constants.BASE_URL}/get-reports/low-stock-detail`, authHeaders())
            .then(res => { setLowStockData(res.data); setLoadingModal(null); })
            .catch(() => setLoadingModal(null));
    };

    return (
        <>
            <Breadcrumb title={"Report"} />
            <div className="row">
                <div className="col-md-12">
                    <div className="card">
                        <div className="card-header">
                            <CardHeader
                                title={"Report"}
                                link={"#"}
                                icon={"fa-list"}
                                button_text={"List"}
                                hide={true}
                            />
                        </div>
                        <div className='card-body'>
                            <div className='row'>
                                <div className='card'>
                                    <div className='card-header'>
                                        <h5>Sales (Branch)</h5>
                                    </div>
                                    <div className='card-body'>
                                        <div className='row'>
                                            <div className='col-md-3'>
                                                <div className='card report-card' style={{ cursor: 'pointer' }} onClick={openMonthlySales}>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                                <i className="fa-solid fa-cart-shopping fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Total Sales</h6>
                                                                <h4>{report.total_sales}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-3'>
                                                <div className='card report-card' style={{ cursor: 'pointer' }} onClick={openMonthlyPurchase}>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                                <i className="fa-solid fa-cart-plus fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Total Purchase</h6>
                                                                <h4>{report.total_purchase}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-3'>
                                                <div className='card report-card' style={{ cursor: 'pointer' }} onClick={openTodayByBranch}>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                                <i className="fa-solid fa-hand-holding-dollar fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Today's Sale</h6>
                                                                <h4>{report.total_sales_today}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-3'>
                                                <div className='card report-card'>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                                <i className="fa-solid fa-person-walking-arrow-loop-left fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Today's Purchase</h6>
                                                                <h4>{report.total_purchase_today}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='card'>
                                    <div className='card-header'>
                                        <h5>Stock</h5>
                                    </div>
                                    <div className='card-body'>
                                        <div className='row'>
                                            <div className='col-md-3'>
                                                <div className='card report-card'>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                                <i className="fa-solid fa-box-open fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Total Product</h6>
                                                                <h4>{report.total_product}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-3'>
                                                <div className='card report-card' style={{ cursor: 'pointer' }} onClick={openShopStock}>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                                <i className="fa-solid fa-box fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Total Stock</h6>
                                                                <h4>{report.total_stock}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-3'>
                                                <div className='card report-card' style={{ cursor: 'pointer' }} onClick={openLowStock}>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                                <i className="fa-solid fa-battery-quarter fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Total Low Stock</h6>
                                                                <h4>{report.low_stock}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-3'>
                                                <div className='card report-card'>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                                <i className="fa-solid fa-dollar-sign fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Total Stock Value (Buy)</h6>
                                                                <h4>{report.buy_value}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-3 mt-4'>
                                                <div className='card report-card'>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                                <i className="fa-solid fa-dollar-sign fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Total Stock Value (Sale Without Discount)</h6>
                                                                <h4>{report.sale_value}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-3 mt-4'>
                                                <div className='card report-card'>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                                <i className="fa-solid fa-dollar-sign fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Possible Profit</h6>
                                                                <h4>{report.possible_profit}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='card'>
                                    <div className='card-header'>
                                        <h5>Expense (Branch)</h5>
                                    </div>
                                    <div className='card-body'>
                                        <div className='row'>
                                            <div className='col-md-3'>
                                                <div className='card report-card'>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                            <i className="fa-solid fa-hand-holding-dollar fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Total Expense</h6>
                                                                <h4>12,258</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-3'>
                                                <div className='card report-card'>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                            <i className="fa-solid fa-sack-dollar fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Total Expense Today</h6>
                                                                <h4>12,258</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>                                            
                                        </div>
                                    </div>
                                </div>

                                <div className='card'>
                                    <div className='card-header'>
                                        <h5>Withdrawals (Branch)</h5>
                                    </div>
                                    <div className='card-body'>
                                        <div className='row'>
                                            <div className='col-md-3'>
                                                <div className='card report-card'>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                            <i className="fa-solid fa-right-from-bracket fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Total Withdrawals</h6>
                                                                <h4>12,258</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-3'>
                                                <div className='card report-card'>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                            <i className="fa-solid fa-money-bill-transfer fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Total Withdrawals Today</h6>
                                                                <h4>12,258</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>                                            
                                        </div>
                                    </div>
                                </div>

                                <div className='card'>
                                    <div className='card-header'>
                                        <h5>Profits</h5>
                                    </div>
                                    <div className='card-body'>
                                        <div className='row'>
                                            <div className='col-md-3'>
                                                <div className='card report-card'>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                            <i className="fa-solid fa-arrow-trend-up fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Total Profits</h6>
                                                                <h4>12,258</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='col-md-3'>
                                                <div className='card report-card'>
                                                    <div className='card-body'>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0">
                                                            <i className="fa-solid fa-chart-column fa-2x"></i>
                                                            </div>
                                                            <div className="flex-grow-1 ms-3">
                                                                <h6>Total Profits Today</h6>
                                                                <h4>12,258</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>                                            
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={showMonthlySales} onHide={() => setShowMonthlySales(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Monthly Sales</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingModal === 'monthlySales' ? (
                        <p className="text-muted">Loading...</p>
                    ) : (
                        <table className="table table-sm table-striped">
                            <thead><tr><th>Month</th><th className="text-end">Total</th></tr></thead>
                            <tbody>
                                {monthlySalesData.map((row) => (
                                    <tr key={row.month}><td>{row.month}</td><td className="text-end">{row.total_formatted}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Modal.Body>
            </Modal>

            <Modal show={showMonthlyPurchase} onHide={() => setShowMonthlyPurchase(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Monthly Purchase</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingModal === 'monthlyPurchase' ? (
                        <p className="text-muted">Loading...</p>
                    ) : (
                        <table className="table table-sm table-striped">
                            <thead><tr><th>Month</th><th className="text-end">Total</th></tr></thead>
                            <tbody>
                                {monthlyPurchaseData.map((row) => (
                                    <tr key={row.month}><td>{row.month}</td><td className="text-end">{row.total_formatted}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Modal.Body>
            </Modal>

            <Modal show={showTodayByBranch} onHide={() => setShowTodayByBranch(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Today&apos;s Sale by Branch</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingModal === 'todayByBranch' ? (
                        <p className="text-muted">Loading...</p>
                    ) : (
                        <table className="table table-sm table-striped">
                            <thead><tr><th>Branch</th><th className="text-end">Total</th></tr></thead>
                            <tbody>
                                {todayByBranchData.map((row) => (
                                    <tr key={row.shop_id}><td>{row.shop_name}</td><td className="text-end">{row.total_formatted}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Modal.Body>
            </Modal>

            <Modal show={showShopStock} onHide={() => setShowShopStock(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Shop Total Stock</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingModal === 'shopStock' ? (
                        <p className="text-muted">Loading...</p>
                    ) : (
                        <table className="table table-sm table-striped">
                            <thead><tr><th>Shop</th><th className="text-end">Total Stock</th></tr></thead>
                            <tbody>
                                {shopStockData.map((row) => (
                                    <tr key={row.shop_id}><td>{row.shop_name}</td><td className="text-end">{row.total_stock}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Modal.Body>
            </Modal>

            <Modal show={showLowStock} onHide={() => setShowLowStock(false)} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Low Stock Products</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingModal === 'lowStock' ? (
                        <p className="text-muted">Loading...</p>
                    ) : (
                        <table className="table table-sm table-striped">
                            <thead><tr><th>Product</th><th>SKU</th><th className="text-end">Quantity</th><th className="text-end">Threshold</th></tr></thead>
                            <tbody>
                                {lowStockData.map((row) => (
                                    <tr key={row.product_id}>
                                        <td>{row.name}</td>
                                        <td>{row.sku}</td>
                                        <td className="text-end">{row.total_quantity}</td>
                                        <td className="text-end">{row.threshold}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Modal.Body>
            </Modal>

        </>
    )
}

export default Report