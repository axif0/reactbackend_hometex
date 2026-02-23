import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Breadcrumb from "../../partoals/Breadcrumb";
import Constants from "../../../Constants";
import CardHeader from "../../partoals/miniComponents/CardHeader";
import { useReactToPrint } from "react-to-print";
import BarCodePage from "./BarCodePage";
import { useLocation } from "react-router-dom";

const BarCodeGenerate = () => {
  const componentRef = useRef(null);
  const location = useLocation();
  const productSKU = location?.state?.productSKU;
  const [columnCount, setColumnCount] = useState(1);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [input, setInput] = useState({
    name: "",
    category_id: "",
    sub_category_id: "",
    child_sub_category_id: "",
    product_id: "",
    attribute_value_id: "",
    barcode_search: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productList, setProductList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [childSubCategories, setChildSubCategories] = useState([]);
  const [barcodeRef, setBarcodeRef] = useState(null);
  const [activeTab, setActiveTab] = useState("generate"); // 'search' | 'generate'
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if(productSKU){
      // console.log(productSKU);
      setInput((prevInput) => ({
        ...prevInput,
        name: productSKU?.name || "",
        category_id: productSKU?.category?.id || "",
        sub_category_id: productSKU?.sub_category?.id || "",
        child_sub_category_id: productSKU?.child_sub_category?.id || "",
        attribute_value_id: productSKU?.child_sub_category?.id || "",
      }));

      if (productSKU?.category?.id) {
        getSubCategories(productSKU.category.id);
    }

      // Fetch Child Sub-Categories if sub-category exists
      if (productSKU?.sub_category?.id) {
          getChildSubCategories(productSKU.sub_category.id);
      }
    }
  }, [productSKU]);

  const handleInput = (e) => {
    if (e.target.name === "barcode_search") {
      setInput((prevState) => ({
        ...prevState,
        [e.target.name]: e.target.value,
      }));
      return;
    }
    if (e.target.name === "category_id") {
      let category_id = parseInt(e.target.value);
      if (!Number.isNaN(category_id)) {
        getSubCategories(e.target.value);
        setSubCategories([]);
        setChildSubCategories([]);
        setProductList([]);
        setInput((prevState) => ({
          ...prevState,
          sub_category_id: "",
          child_sub_category_id: "",
          product_id: "",
        }));
      }
    }

    if (e.target.name === "sub_category_id") {
      let sub_category_id = parseInt(e.target.value);
      if (!Number.isNaN(sub_category_id)) {
        getChildSubCategories(e.target.value);
        setChildSubCategories([]);
        setProductList([]);
        setInput((prevState) => ({
          ...prevState,
          child_sub_category_id: "",
          product_id: "",
        }));
      }
    }

    if (e.target.name === "child_sub_category_id") {
      let child_sub_category_id = parseInt(e.target.value);
      if (!Number.isNaN(child_sub_category_id)) {
        getProductsByChildSubCategory(e.target.value);
        setInput((prevState) => ({
          ...prevState,
          product_id: "",
        }));
      }
    }

    setInput((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));

    // Update the selected attribute based on the input attribute_value_id
    const selectedAttr = attributes.find(
      (attr) => attr.id === parseInt(e.target.value, 10)
    );

    setSelectedAttribute(selectedAttr || null);
  };

  const handleResetFilter = () => {
    setInput({
      name: "",
      category_id: "",
      sub_category_id: "",
      child_sub_category_id: "",
      product_id: "",
      attribute_value_id: "",
      barcode_search: "",
    });
    setSubCategories([]);
    setChildSubCategories([]);
    setProductList([]);
    setProducts([]);
    setAttributes([]);
    setSelectedAttribute(null);
    setSelectedProduct(null);
  };

  // const handleProductSearch = async () => {
  //   const token = localStorage.getItem("token");
  //   await axios
  //     .get(
  //       `${Constants.BASE_URL}/get-product-list-for-bar-code?name=${input?.name}&category_id=${input?.category_id}&sub_category_id=${input?.sub_category_id}&child_sub_category_id=${input?.child_sub_category_id}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     )
  //     .then((res) => {
  //       setProducts(res.data.data);

  //       if (res.data.data.length > 0) {
  //         console.log(res.data.data[0]);
  //         const firstProduct = res.data.data[0];

  //         if (
  //           firstProduct.product_attributes &&
  //           firstProduct.product_attributes.length > 0
  //         ) {
  //           setAttributes(firstProduct.product_attributes);
  //           setSelectedAttribute(
  //             firstProduct.product_attributes.find(
  //               (attr) =>
  //                 attr.id === parseInt(input.attribute_value_id, 10)
  //             ) || firstProduct.product_attributes[0]
  //           );
  //         } else {
  //           setAttributes([]);
  //           setSelectedAttribute(null);
  //         }
  //       } else {
  //         setAttributes([]);
  //         setSelectedAttribute(null);
  //       }
  //     });
  // };

  const handleProductSearch = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
  
    try {
      let url = `${Constants.BASE_URL}/get-product-list-for-bar-code?`;

      if (input.product_id) {
        url += `product_id=${encodeURIComponent(input.product_id)}`;
      } else if (input.barcode_search) {
        const code = String(input.barcode_search).trim();
        if (code !== "") {
          if (/^[0-9]+$/.test(code)) {
            url += `product_id=${encodeURIComponent(code)}`;
          } else {
            url += `name=${encodeURIComponent(code)}`;
          }
        }
      } else {
        url += `name=${encodeURIComponent(input?.name || "")}` +
          `&category_id=${encodeURIComponent(input?.category_id || "")}` +
          `&sub_category_id=${encodeURIComponent(input?.sub_category_id || "")}` +
          `&child_sub_category_id=${encodeURIComponent(input?.child_sub_category_id || "")}`;
      }
      
      const response = await axios.get(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
  
      const list = response.data.data || [];
      setProducts(list);
      
      if (list.length > 0) {
        const firstProduct = list[0];
        setSelectedProduct(firstProduct);
        if (firstProduct.product_attributes?.length > 0) {
          setAttributes(firstProduct.product_attributes);
          setSelectedAttribute(firstProduct.product_attributes.find(
            (attr) => attr.id === parseInt(input.attribute_value_id, 10)
          ) || firstProduct.product_attributes[0]);
        } else {
          setAttributes([]);
          setSelectedAttribute(null);
        }
      } else {
        setAttributes([]);
        setSelectedAttribute(null);
      }
  
      // Restore the reference explicitly
      setTimeout(() => {
        if (componentRef.current) {
          setBarcodeRef(componentRef.current);
        }
      }, 100); // Give React time to re-render
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (componentRef.current) {
      setBarcodeRef(componentRef.current);
    }
  }, [products, columnCount]);


  useEffect(() => {
    if (products.length > 0) {
      setAttributes(products[0]?.product_attributes || []);
      const selectedAttr = products[0]?.product_attributes[0] || null;
      setSelectedAttribute(selectedAttr);
    } else {
      setAttributes([]);
      setSelectedAttribute(null);
    }
  }, [products]);

  const getCategories = () => {
    const token = localStorage.getItem("token");
    axios
      .get(`${Constants.BASE_URL}/get-category-list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setCategories(res.data);
      });
  };

  const getSubCategories = (category_id) => {
    const token = localStorage.getItem("token");
    axios
      .get(`${Constants.BASE_URL}/get-sub-category-list/${category_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setSubCategories(res.data);
      });
  };

  const getChildSubCategories = (sub_category_id) => {
    const token = localStorage.getItem("token");
    axios
      .get(`${Constants.BASE_URL}/get-child-sub-category-list/${sub_category_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setChildSubCategories(res.data);
      });
  };

  const getProductsByChildSubCategory = (child_sub_category_id) => {
    const token = localStorage.getItem("token");
    axios
      .get(`${Constants.BASE_URL}/get-product-list-for-bar-code?child_sub_category_id=${child_sub_category_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setProductList(res.data.data || []);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setProductList([]);
      });
  };

  useEffect(() => {
    getCategories();
  }, []);

  const setComponentRef = (element) => {
    if (element) {
      componentRef.current = element;
      setBarcodeRef(element);
    }
  };

  // useEffect(() => {
  //   console.log("ComponentRef updated:", componentRef.current);
  // }, [componentRef?.current]);

  // console.log("========****========");
  // console.log(componentRef.current);
  // console.log("========****========");

  const handlePrint = useReactToPrint({
    content: () => {
      if (!componentRef.current) {
        console.error("ComponentRef is null. Cannot print.");
        return null;
      }
      return componentRef.current;
    },
    documentTitle: "Bar Codes",
    pageStyle: `
      @page {
        margin: 5mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  return (
    <>
      <Breadcrumb title={"Generate or Create Barcode"} />
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <CardHeader
                title={"Generate or Create Barcode"}
                link={"/products"}
                icon={"fa-list"}
                button_text={"product List"}
                hide={true}
              />
            </div>

            <div className="card-body">
              <div className="mb-3">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === "search" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setActiveTab("search")}
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeTab === "generate" ? "btn-primary" : "btn-outline-primary"}`}
                    onClick={() => setActiveTab("generate")}
                  >
                    Generate or Create Barcode
                  </button>
                </div>
              </div>

              {activeTab === "search" && (
                <>
                  <div className="row">
                    <div className="col-md-3">
                      <label className="w-100 mt-2 mt-md-0">
                        <p>Search By Product Name</p>
                        <input
                          className={"form-control mt-2"}
                          type={"search"}
                          name={"name"}
                          value={input.name}
                          onChange={handleInput}
                          placeholder={"Enter product name"}
                        />
                      </label>
                    </div>
                    <div className="col-md-3">
                      <label className="w-100 mt-2 mt-md-0">
                        <p>Search By Product ID / Barcode</p>
                        <input
                          className={"form-control mt-2"}
                          type={"text"}
                          name={"barcode_search"}
                          value={input.barcode_search}
                          onChange={handleInput}
                          placeholder={"Scan or enter ID / barcode"}
                        />
                      </label>
                    </div>
                    <div className="col-md-2">
                      <div className="d-grid mt-4">
                        <button
                          onClick={handleProductSearch}
                          className={"btn theme-button"}
                          dangerouslySetInnerHTML={{
                            __html: isLoading
                              ? '<span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Loading...'
                              : "Search",
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="d-grid mt-4">
                        <button
                          onClick={handleResetFilter}
                          className={"btn btn-secondary"}
                        >
                          <i className="fa-solid fa-filter-circle-xmark me-2"></i>
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedProduct && (
                    <div className="mt-4">
                      <h5>Product Details</h5>
                      <div className="row">
                        <div className="col-md-4">
                          <label className="w-100">
                            <p>Name</p>
                            <input
                              className="form-control form-control-sm"
                              value={selectedProduct.name || ""}
                              readOnly
                            />
                          </label>
                        </div>
                        <div className="col-md-4">
                          <label className="w-100">
                            <p>SKU / Barcode</p>
                            <input
                              className="form-control form-control-sm"
                              value={selectedProduct.sku || ""}
                              readOnly
                            />
                          </label>
                        </div>
                        <div className="col-md-4">
                          <label className="w-100">
                            <p>Brand</p>
                            <input
                              className="form-control form-control-sm"
                              value={selectedProduct.brand?.name || ""}
                              readOnly
                            />
                          </label>
                        </div>
                        <div className="col-md-4">
                          <label className="w-100 mt-2">
                            <p>Base Price</p>
                            <input
                              className="form-control form-control-sm"
                              value={selectedProduct.price ?? ""}
                              readOnly
                            />
                          </label>
                        </div>
                        <div className="col-md-4">
                          <label className="w-100 mt-2">
                            <p>Sell Price</p>
                            <input
                              className="form-control form-control-sm"
                              value={selectedProduct.sell_price?.price ?? ""}
                              readOnly
                            />
                          </label>
                        </div>
                        <div className="col-md-4">
                          <label className="w-100 mt-2">
                            <p>Select Attribute</p>
                            <select
                              className="form-select form-select-sm"
                              name="attribute_value_id"
                              value={input.attribute_value_id}
                              onChange={handleInput}
                            >
                              <option value="">Select attribute</option>
                              {attributes.map((attribute, index) => (
                                <option value={attribute?.id} key={index}>
                                  {attribute.attributes?.name} - {attribute.attribute_value?.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === "generate" && (
                <>
                  <div className="row align-items-baseline">
                    <div className="col-md-3">
                      <label className="w-100 mt-2 mt-md-0">
                        <p>Select Product Category</p>
                        <select
                          className={"form-select mt-2"}
                          name={"category_id"}
                          value={input.category_id}
                          onChange={handleInput}
                        >
                          <option>Select Category</option>
                          {categories.map((category, index) => (
                            <option value={category.id} key={index}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="col-md-3">
                      <label className="w-100 mt-2 mt-md-0">
                        <p>Select Product Sub-Category</p>
                        <select
                          className={"form-select mt-2"}
                          name={"sub_category_id"}
                          value={input.sub_category_id}
                          onChange={handleInput}
                          disabled={input.category_id === undefined}
                        >
                          <option>Select Sub-Category</option>
                          {subCategories.map((sub_category, index) => (
                            <option value={sub_category.id} key={index}>
                              {sub_category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="col-md-3">
                      <label className="w-100 mt-2 mt-md-0">
                        <p>Select Product Child Sub-Category</p>
                        <select
                          className={"form-select mt-2"}
                          name={"child_sub_category_id"}
                          value={input.child_sub_category_id}
                          onChange={handleInput}
                          disabled={input.sub_category_id === undefined}
                        >
                          <option>Select Child Sub-Category</option>
                          {childSubCategories.map((child_sub_category, index) => (
                            <option value={child_sub_category.id} key={index}>
                              {child_sub_category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="col-md-3">
                      <label className="w-100 mt-2 mt-md-0">
                        <p>Select Product</p>
                        <select
                          className={"form-select mt-2"}
                          name={"product_id"}
                          value={input.product_id}
                          onChange={handleInput}
                          disabled={!input.child_sub_category_id || productList.length === 0}
                        >
                          <option value="">Select Product</option>
                          {productList.map((product, index) => (
                            <option value={product.id} key={index}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                  <div className="container">
                    <div className="row my-2 d-flex align-items-center">
                      <div className="col-md-3">
                        <label className="w-100 mt-2 mt-md-0">
                          <p>Column Count</p>
                          <input
                            className={"form-control mt-2"}
                            type={"number"}
                            name={"column_count"}
                            value={columnCount}
                            onChange={(e) => setColumnCount(parseInt(e.target.value))}
                            placeholder={"Enter column count"}
                          />
                        </label>
                      </div>
                      <div className="col-md-3">
                        <label className="w-100 mt-2 mt-md-0">
                          <p>Select Attribute</p>
                          <select
                            className={"form-select mt-2"}
                            name={"attribute_value_id"}
                            value={input.attribute_value_id}
                            onChange={handleInput}
                          >
                            <option>Select attributes</option>
                            {attributes.map((attribute, index) => (
                              <option value={attribute?.id} key={index}>
                                {attribute.attributes?.name} - {attribute.attribute_value?.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="col-md-2">
                        <div className="d-grid mt-4">
                          <button
                            onClick={handleProductSearch}
                            className={"btn theme-button"}
                            dangerouslySetInnerHTML={{
                              __html: isLoading
                                ? '<span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Loading...'
                                : "Load Labels",
                            }}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="d-grid mt-4">
                          <button
                            onClick={handleResetFilter}
                            className={"btn btn-secondary"}
                          >
                            <i className="fa-solid fa-filter-circle-xmark me-2"></i>
                            Reset
                          </button>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="d-grid mt-4">
                          <button
                            onClick={handlePrint}
                            className={"btn btn-sm btn-outline-dark"}
                            disabled={products.length === 0}
                          >
                            <i className="fa-solid fa-print"></i> Print
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div style={{ position: "relative" }}>
                <div className="bar-code-area-wraper mt-3 pt-3">
                {products.length > 0 && (
                  <BarCodePage
                    products={products}
                    columnCount={columnCount}
                    printing={true}
                    rowCount={Math.ceil(products.length / columnCount)}
                    ref={setComponentRef}
                    selectedAttribute={selectedAttribute}
                  />
                )}
                </div>
              </div>


              {/* <div className="bar-code-area-wraper mt-3 pt-3" ref={componentRef} style={{ display: "block" }}>
                <BarCodePage
                  products={products}
                  columnCount={columnCount}
                  printing={true}
                  rowCount={Math.ceil(products.length / columnCount)}
                  ref={componentRef}
                  selectedAttribute={selectedAttribute}
                />

            <BarCodePage
                products={products}
                columnCount={columnCount}
                printing={true}
                rowCount={Math.ceil(products.length / columnCount)}
                selectedAttribute={selectedAttribute}
              /> 
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BarCodeGenerate;
