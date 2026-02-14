import React, { useEffect, useState, useMemo } from "react";
import { Bar } from "@ant-design/plots";
import { Row, Col, Table, Spin, Card } from "antd";
// import { useAuth } from "../../AuthContext";

const SeriousnessPage = ({ orgUnitId, startDate, endDate }) => {
  // const { auth } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch aggregate analytics
  useEffect(() => {
    // if (!auth?.username || !auth?.password) return;

    const fetchData = async () => {
      setLoading(true);
      // const authHeader = "Basic " + btoa(`${auth.username}:${auth.password}`);
      const url = `https://dhis2.asia/laotracker/api/29/analytics/events/aggregate/AQBx2QVBvRH.json?dimension=ou:${orgUnitId}&dimension=d3iJyrWjNUy.uGQ7oOMRAYF&dimension=d3iJyrWjNUy.BrHNbTH0UAI&dimension=d3iJyrWjNUy.w6moypTHTyh&dimension=d3iJyrWjNUy.MFGa2Vl9loi&dimension=d3iJyrWjNUy.p7KlLiIMCuN&dimension=d3iJyrWjNUy.egVFKdMAFBS&stage=d3iJyrWjNUy&startDate=${startDate}&endDate=${endDate}&displayProperty=NAME&totalPages=false&outputType=EVENT`;

      try {
        const res = await fetch(url, {
          headers: {
            // Authorization: authHeader,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        console.log("Fetched rows:", data.rows);
        setRows(data.rows || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ orgUnitId, startDate, endDate]);
    // }, [auth, orgUnitId, startDate, endDate]);


  // 🔹 Process aggregate rows
  const { tableData, chartData, total } = useMemo(() => {
    const seriousnessLabels = [
      "Death",                  // BrHNbTH0UAI
      "Life threatening",              // w6moypTHTyh
      "Congenital anomaly/birth defect",            // MFGa2Vl9loi
      "Caused/prolonged hospitalization",               // p7KlLiIMCuN
      "Disabling/incapacitating",                   // egVFKdMAFBS
      "Other medically important condition",          // uGQ7oOMRAYF

    ];

    const map = {};
    seriousnessLabels.forEach((label) => {
      map[label] = 0;
    });

    let total = 0;

rows.forEach((row) => {
  const value = parseInt(row[7] || 0); // last column is count
  total += value;

  // Map indices according to new order
  const indices = [1, 2, 3, 4, 5, 0]; // map seriousnessLabels to row indices
  indices.forEach((rowIndex, labelIndex) => {
    if (row[rowIndex] === "1") {
      map[seriousnessLabels[labelIndex]] += value;
    }
  });
});

    const tableData = seriousnessLabels.map((label) => ({
      type: label,
      count: map[label],
    }));

    const chartData = tableData.map((d) => ({
      ...d,
      percent: total ? Number(((d.count / total) * 100).toFixed(1)) : 0,
    }));

    return { tableData, chartData, total };
  }, [rows]);

  // 🔹 Loading and empty states
  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );

  if (!chartData.length)
    return <p style={{ textAlign: "center" }}>No data available.</p>;

  // 🔹 Chart configuration
  const chartConfig = {
    data: chartData,
    xField: "type",
    yField: "percent",
    height: 400,
    legend: false,
    color: ({ type }) =>
      type === "Medically significant" ? "#1890ff" : "#fa541c",
    label: {
      position: "middle",
      style: { fill: "#fff" },
      formatter: (d) => `${d.percent}%`,
    },
    yAxis: {
      label: { formatter: (v) => `${v}%` },
    },
  };

  // 🔹 Table columns
  const columns = [
    { title: "Seriousness Type", dataIndex: "type" },
    { title: "Count", dataIndex: "count", align: "center" },
    {
      title: "Percentage",
      align: "center",
      render: (_, r) =>
        total ? `${((r.count / total) * 100).toFixed(1)}%` : "0%",
    },
  ];

  return (
    <Row gutter={16}>
      <Col span={14}>
        <Card title="ADR Seriousness Distribution">
          <Bar {...chartConfig} />
        </Card>
      </Col>

      <Col span={10}>
        <Card title="Seriousness Detail">
          <Table
            size="small"
            bordered
            pagination={false}
            rowKey="type"
            columns={columns}
            dataSource={tableData}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default SeriousnessPage;