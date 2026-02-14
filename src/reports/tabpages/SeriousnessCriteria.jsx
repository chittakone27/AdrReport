import React, { useEffect, useState, useMemo } from "react";
import { Bar } from "@ant-design/plots";
import { Row, Col, Table, Spin, Card } from "antd";
import { useAuth } from "../../AuthContext";

const SeriousnessPage = ({ orgUnitId, startDate, endDate }) => {
  const { auth } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch aggregate analytics
  useEffect(() => {
    if (!auth?.username || !auth?.password) return;

    const authHeader = "Basic " + btoa(`${auth.username}:${auth.password}`);
    setLoading(true);
const url=      `https://dhis2.asia/laotracker/api/29/analytics/events/aggregate/AQBx2QVBvRH.json?dimension=ou:${orgUnitId}&dimension=d3iJyrWjNUy.BrHNbTH0UAI&dimension=d3iJyrWjNUy.w6moypTHTyh&dimension=d3iJyrWjNUy.MFGa2Vl9loi&dimension=d3iJyrWjNUy.p7KlLiIMCuN&dimension=d3iJyrWjNUy.egVFKdMAFBS&dimension=d3iJyrWjNUy.jOmAEc3KM2S&stage=d3iJyrWjNUy&startDate=${startDate}&endDate=${endDate}&displayProperty=NAME&totalPages=false&outputType=EVENT`;
    console.log("FETCH URL:", url);
fetch(
url,      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setRows(data.rows || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setRows([]);
        setLoading(false);
      });
  }, [auth, orgUnitId, startDate, endDate]);

  // 🔹 Process aggregate rows
  const { tableData, chartData, total } = useMemo(() => {
    const seriousnessLabels = [
      "Patient died",
      "Life threatening",
      "Disability",
      "Congenital anomaly",
      "Hospitalization",
    ];

    const map = {};
    seriousnessLabels.forEach((label) => {
      map[label] = 0;
    });

    let total = 0;

    rows.forEach((row) => {
      const value = parseInt(row[6] || 0); // last column is count
      total += value;

      // row[0]–row[4] correspond to TRUE_ONLY dimensions
      row.slice(0, 5).forEach((flag, index) => {
        if (flag === "1") {
          map[seriousnessLabels[index]] += value;
        }
      });
    });

    const tableData = seriousnessLabels.map((label) => ({
      type: label,
      count: map[label],
    }));

    const chartData = tableData.map((d) => ({
      ...d,
      percent: total
        ? Number(((d.count / total) * 100).toFixed(1))
        : 0,
    }));

    return { tableData, chartData, total };
  }, [rows]);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );

  if (!chartData.length)
    return <p style={{ textAlign: "center" }}>No data available.</p>;

  const chartConfig = {
    data: chartData,
    xField: "type",
    yField: "percent",
    height: 400,
    legend: false,
    color: "#fa541c",
    label: {
      position: "middle",
      style: { fill: "#fff" },
      formatter: (d) => `${d.percent}%`,
    },
    yAxis: {
      label: { formatter: (v) => `${v}%` },
    },
  };

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
