import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";

const API_KEY = "E9104B82-F97B-4D27-BEDE-04D10724B1B1";

async function fetchMostActiveUsers(since) {
  try {
    const response = await axios.get(
      `https://api.neynar.com/v1/farcaster/casts?limit=500&timestamp=${since}`, 
      {
        headers: {
          api_key: E9104B82-F97B-4D27-BEDE-04D10724B1B1 
        }
      }
    );

    if (!response.data || !response.data.casts) {
      console.error("No casts in response:", response.data);
      return [];
    }

    const users = {};
    response.data.casts.forEach((cast) => {
      const fid = cast.author.fid;
      const username = cast.author.username || "Unknown";
      const avatar = cast.author.pfp_url || "";

      if (!users[fid]) {
        users[fid] = { fid, name: username, avatar, casts: 0 };
      }
      users[fid].casts += 1;
    });

    return Object.values(users)
      .sort((a, b) => b.casts - a.casts)
      .slice(0, 100);
  } catch (error) {
    console.error("Fetch error:", error.response?.status, error.message);
    return [];
  }
}

function exportToCSV(users) {
  const headers = ["Rank", "Username", "Casts"];
  const rows = users.map((user, idx) => [idx + 1, user.name || "Unknown", user.casts || 0]);
  let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
  rows.forEach((row) => {
    csvContent += row.join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `top_100_farcaster_users_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("24h");
  const [error, setError] = useState(null);

  useEffect(() => {
    const now = Date.now();
    const since = filter === "24h"
      ? now - 24 * 60 * 60 * 1000
      : now - 7 * 24 * 60 * 60 * 1000;

    console.log("Fetching with timestamp:", since);
    setLoading(true);
    setError(null);

    fetchMostActiveUsers(since).then((data) => {
      if (data.length === 0) {
        setError("Tidak ada data pengguna aktif atau API gagal. Periksa konsol untuk detail.");
      } else {
        setUsers(data);
      }
      setLoading(false);
    });
  }, [filter]);

  return (
    <div style={{
      padding: 20,
      backgroundColor: "#121212",
      minHeight: "100vh",
      color: "#fff"
    }}>
      <h1>Top 100 Most Active Users on Farcaster</h1>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setFilter("24h")} style={{ marginRight: 10 }}>
          Last 24 Hours
        </button>
        <button onClick={() => setFilter("7d")} style={{ marginRight: 10 }}>
          Last 7 Days
        </button>
        <button onClick={() => exportToCSV(users)} disabled={users.length === 0}>
          Export CSV
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          <div style={{ height: 300, marginBottom: 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={users.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip />
                <Bar dataKey="casts" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
            gap: 20
          }}>
            {users.map((user, idx) => (
              <div key={idx} style={{
                background: "#222",
                padding: 10,
                borderRadius: 12,
                display: "flex",
                alignItems: "center"
              }}>
                <img
                  src={user.avatar || "https://via.placeholder.com/40"}
                  alt={user.name || "Unknown"}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    marginRight: 10
                  }}
                  onError={(e) => { e.target.src = "https://via.placeholder.com/40"; }}
                />
                <div>
                  <strong>{idx + 1}. {user.name || "Unknown"}</strong>
                  <div>Casts: {user.casts || 0}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
