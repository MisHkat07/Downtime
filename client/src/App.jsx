import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [url, setUrl] = useState("");
  const [searchedWebsite, setSearchedWebsite] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetch, setFetch] = useState(true);
  const [websites, setWebsites] = useState([]);
  const [message, setMessage] = useState("");

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

    const intervalId = setInterval(fetchWebsites, 10000);
    fetchWebsites();

    return () => clearInterval(intervalId);
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
      setUrl("");
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

  const removeWebsite = async (url) => {
    if (window.confirm("Are you sure you want to remove this website?")) {
      try {
        const response = await axios.delete("http://localhost:5000/remove", {
          data: { url },
        });
        setMessage(response.data.message);
        setFetch(true);
      } catch (error) {
        console.error("Error removing website:", error);
        setMessage("Error removing website.");
      }
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col items-center bg-gradient-to-r from-blue-500 to-purple-600 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <div className="mb-10">
          {" "}
          <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">
            Website Status Checker
          </h1>
          <form onSubmit={handleSearch} className="flex flex-col space-y-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL"
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {url.length ? (
              <button
                type="submit"
                className="bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Search Website
              </button>
            ) : (
              ""
            )}
          </form>
          {loading && (
            <p className="mt-4 text-center text-gray-600">Loading...</p>
          )}
          {searchedWebsite && (
            <div className="mt-6 text-center">
              {!loading && (
                <p className="text-lg text-gray-700">
                  Status: {searchedWebsite.status.message}
                </p>
              )}
              {!websites.some(
                (website) => website.url === searchedWebsite.url
              ) && (
                <button
                  onClick={handleAdd}
                  className="mt-4 bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600 transition duration-200"
                >
                  Add to Monitoring
                </button>
              )}
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center text-gray-500">
          Monitored Websites
        </h2>
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-gray-600 font-medium">
                URL
              </th>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-gray-600 font-medium">
                Status
              </th>
              <th className="px-6 py-3 border-b-2 border-gray-300"></th>
            </tr>
          </thead>
          <tbody>
            {websites.map((website, index) => (
              <tr
                key={index}
                className="hover:bg-gray-100 transition duration-150"
              >
                <td className="px-6 py-4 border-b border-gray-300">
                  {website.url}
                </td>
                <td
                  className={`px-6 py-4 border-b border-gray-300 ${
                    website.status.up ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {website.status.message}
                </td>
                <td className="px-6 py-4 border-b border-gray-300 text-right">
                  <button
                    onClick={() => removeWebsite(website.url)}
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    Remove
                  </button>
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
