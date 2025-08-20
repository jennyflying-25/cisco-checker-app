"use client";

import { useState, useEffect, Fragment } from 'react';

// --- Data Structure Interfaces (Matching your final JSON structure) ---
interface Product {
  Your_SKU: string;
  OEM_Part_Number: string;
  Description: string;
  Rate: string;
  Form_Factor: string;
  Reach: string;
  Cable_Type: string;
  Media: string;
  Connector_Type: string;
  Wavelength: string;
  Case_Temp: string;
  Product_Page_URL: string;
}

interface Compatibility {
  Device_ID: string;
  OEM_Part_Number: string;
  Description?: string;
}

interface SwitchBay {
  Switch_Model: string;
  Supported_Module_ID: string;
}

interface Database {
  products: Product[];
  compatibility: Compatibility[];
  switchBays: SwitchBay[];
}

interface ResultGroup {
  moduleOrPortId: string;
  products: Product[];
}

// --- The Main Page Component ---
export default function Home() {
  const [db, setDb] = useState<Database | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultGroup[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchedTerm, setSearchedTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Effect to load the database from the public folder when the page loads
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await  fetch('/databas.json');
        if (!response.ok) {
          throw new Error("HTTP error! status: " + response.status);
        }
        const data = await response.json();
        setDb(data);
      } catch (e) {
        console.error("Failed to load or parse database.json:", e);
        setError("Could not load compatibility data. Please check if database.json is in the /public folder and is a valid JSON.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // The core search logic with Defensive Programming
  const handleSearch = () => {
    setError(null);
    setResults(null);
    
    if (!db || !query.trim()) {
      setResults([]);
      setSearchedTerm(query);
      return;
    }

    const searchTerm = query.trim().toUpperCase();
    setSearchedTerm(searchTerm);

    try {
      // Step 1: Find all supported module/port IDs for the entered switch model
      const supportedModules = db.switchBays
        // Defensive check to prevent crash on bad data
        .filter(bay => bay && bay.Switch_Model && typeof bay.Switch_Model === 'string')
        .filter(bay => bay.Switch_Model.toUpperCase() === searchTerm)
        .map(bay => bay.Supported_Module_ID);

      if (supportedModules.length === 0) {
        setResults([]);
        return;
      }

      const groupedResults: ResultGroup[] = [];
      
      supportedModules.forEach(moduleOrPortId => {
        // Ensure moduleOrPortId is a string before proceeding
        if (typeof moduleOrPortId !== 'string') return;

        const compatibleOemParts = new Set(
          db.compatibility
            // Defensive check to prevent crash on bad data
            .filter(comp => comp && comp.Device_ID && typeof comp.Device_ID === 'string')
            .filter(comp => comp.Device_ID.toUpperCase() === moduleOrPortId.toUpperCase())
            .map(comp => comp.OEM_Part_Number)
        );

        const foundProducts = db.products.filter(product =>
            // Defensive check to prevent crash on bad data
            product && product.OEM_Part_Number && compatibleOemParts.has(product.OEM_Part_Number)
        );

        if (foundProducts.length > 0) {
          groupedResults.push({
            moduleOrPortId: moduleOrPortId,
            products: foundProducts
          });
        }
      });
      setResults(groupedResults);
    } catch (e) {
        console.error("Error during search logic:", e);
        setError("An error occurred while searching. Please check your data format in the JSON file.");
        setResults([]);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
            Cisco Catalyst 9300 Series Compatibility Checker
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Instantly find 100% compatible transceivers for your Cisco switches.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a switch model (e.g., C9300-48P)"
              className="w-full px-5 py-3 text-base text-gray-700 placeholder-gray-400 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSearch}
              className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? 'Loading Data...' : 'Search'}
            </button>
          </div>
        </div>

        <div className="mt-12 max-w-6xl mx-auto">
          {error && (
            <div className="text-center py-10 bg-red-100 text-red-700 rounded-lg shadow-md border border-red-200">
              <p className="font-semibold">An Error Occurred</p>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          )}

          {!error && results && (
            <Fragment>
              {results.length > 0 ? (
                results.map((group, index) => (
                  <div key={index} className="mb-10 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-xl font-semibold text-slate-700 border-b pb-3 mb-4">
                      {group.moduleOrPortId.startsWith('Fixed_')
                        ? "For Fixed Uplink Ports (" + group.moduleOrPortId.replace('Fixed_', '').replace(/_/g, ' ') + ")"
                        : "For Uplink Module " + group.moduleOrPortId
                      }
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your Compatible SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OEM Part Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {group.products.map((product, pIndex) => (
                            <tr key={pIndex} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.Your_SKU}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.OEM_Part_Number}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.Description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <a
                                  href={product.Product_Page_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-semibold"
                                >
                                  View Product
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                searchedTerm && (
                  <div className="text-center py-10 bg-white rounded-lg shadow-md border border-gray-200">
                    <p className="text-slate-700">No compatibility results found for <strong className="text-red-600">{searchedTerm}</strong>.</p>
                    <p className="mt-2 text-sm text-slate-500">Please check the model number or contact our experts for assistance.</p>
                  </div>
                )
              )}
            </Fragment>
          )}
        </div>
      </main>
    </div>
  );
}
