import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [websites, setWebsites] = useState([]);
  const [searchedWebsite, setSearchedWebsite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetch, setFetch] = useState(true);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const response = await axios.get("http://localhost:5000/websites");
        setWebsites(response.data);
        setFetch(false);
      } catch (error) {
        console.error("Error fetching websites:", error);
      }
    };

    const intervalId = setInterval(fetchWebsites, 10000); // Fetch every 1 minute
    fetchWebsites();

    return () => clearInterval(intervalId); // Clean up interval on unmount
  }, [fetch]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    let validatedUrl = url.trim();
    if (
      !validatedUrl.startsWith("http://") &&
      !validatedUrl.startsWith("https://")
    ) {
      validatedUrl = "https://" + validatedUrl;
    }
    if (!validatedUrl.includes("www.")) {
      const urlObj = new URL(validatedUrl);
      validatedUrl = `${urlObj.protocol}//www.${urlObj.hostname}${urlObj.pathname}`;
    }

    try {
      const response = await axios.post("http://localhost:5000/search", {
        url: validatedUrl,
      });
      setSearchedWebsite(response.data);
    } catch (error) {
      console.error("Error searching website:", error);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (searchedWebsite) {
      try {
        await axios.post("http://localhost:5000/add", {
          url: searchedWebsite.url,
        });
        setSearchedWebsite(null);
        setFetch(true);
      } catch (error) {
        console.error("Error adding website:", error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mb-6">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Website Status Checker
        </h1>
        <form onSubmit={handleSearch} className="flex flex-col space-y-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter website URL"
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-200"
          >
            Search Website
          </button>
        </form>
        {loading && <p className="mt-4 text-center">Loading...</p>}
        {searchedWebsite && (
          <div className="mt-4 text-center">
            {!loading && <p>Status: {searchedWebsite.status.message}</p>}
            {!websites.some(
              (website) => website.url === searchedWebsite.url
            ) && (
              <button
                onClick={handleAdd}
                className="mt-2 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-200"
              >
                Add to Monitoring
              </button>
            )}
          </div>
        )}
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl">
        <h2 className="text-xl font-bold mb-4 text-center">
          Monitored Websites
        </h2>
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2 border">URL</th>
              <th className="px-4 py-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {websites.map((website, index) => (
              <tr key={index}>
                <td className="px-4 py-2 border">{website.url}</td>
                <td
                  className={`px-4 py-2 border ${
                    website.status.up ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {website.status.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
