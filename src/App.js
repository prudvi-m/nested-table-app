import React, { useState, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";
import { ModuleRegistry } from "@ag-grid-community/core";
import { ColumnsToolPanelModule } from "@ag-grid-enterprise/column-tool-panel";
import { MenuModule } from "@ag-grid-enterprise/menu";
import { ServerSideRowModelModule } from "@ag-grid-enterprise/server-side-row-model";

ModuleRegistry.registerModules([
  ColumnsToolPanelModule,
  MenuModule,
  ServerSideRowModelModule,
]);

const App = () => {
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  
  const [columnDefs] = useState([
    { field: "test_suite", hide: true },
    { field: "test_case_name", headerName: "Test Case", checkboxSelection: true },
    { field: "status", headerName: "Status" },
  ]);

  const defaultColDef = useMemo(() => {
    return {
      width: 240,
      flex: 1,
      sortable: true,
    };
  }, []);

  const autoGroupColumnDef = useMemo(() => {
    return {
      field: "test_suite",
      cellRendererParams: {
        innerRenderer: (params) => {
          return `${params.data.test_suite}`; // Render the test suite name
        },
      },
    };
  }, []);

  const onGridReady = useCallback((params) => {
    fetch("https://www.ag-grid.com/example-assets/tree-data.json") // Replace with your data source
      .then((resp) => resp.json())
      .then((data) => {
        const datasource = createServerSideDatasource(data);
        params.api.setServerSideDatasource(datasource);
      });
  }, []);

  const createServerSideDatasource = (data) => {
    return {
      getRows: (params) => {
        console.log("Requesting rows: ", params.request);
        const request = params.request;

        // Validate if `rowData` exists
        if (!data || data.length === 0) {
          console.error("No data available");
          return params.failCallback();
        }

        // Calculate pagination range
        const startRow = request.startRow;
        const endRow = request.endRow;
        const rowData = data.slice(startRow, endRow); // Paginate the data

        const result = {
          rowData: rowData,
          rowCount: data.length, // Total number of rows
        };

        // Simulate an asynchronous call to the server with setTimeout
        setTimeout(() => {
          if (rowData && rowData.length > 0) {
            params.successCallback(rowData, result.rowCount); // Pass the rowData and rowCount
          } else {
            params.failCallback(); // If no data, fail the callback
          }

          // Recursively populate the hierarchy if necessary (for nested data)
          rowData.forEach((topLevelNode) => {
            recursivelyPopulateHierarchy([topLevelNode.test_suite], topLevelNode, params);
          });
        }, 200);
      },
    };
  };

  const recursivelyPopulateHierarchy = (route, node, params) => {
    if (node.testcases) {
      // Apply child data (test cases under a test suite)
      setTimeout(() => {
        params.api.applyServerSideRowData({
          route,
          successParams: {
            rowData: node.testcases,
            rowCount: node.testcases.length,
          },
        });

        node.testcases.forEach((child) => {
          recursivelyPopulateHierarchy([...route, child.test_case_name], child, params);
        });
      }, 200);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={gridStyle} className="ag-theme-quartz">
        <AgGridReact
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          autoGroupColumnDef={autoGroupColumnDef}
          rowModelType={"serverSide"}
          treeData={true} // Enable tree data for hierarchical structure
          getServerSideGroupKey={(dataItem) => dataItem.test_suite}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};

export default App;

const root = createRoot(document.getElementById("root"));
root.render(<App />);
