import React, { useEffect, useState } from "react";
import { Column } from "@ant-design/plots";
import { Row, Col, Table, Spin, Card } from "antd";
// import { useAuth } from "../../AuthContext";
import "../style/global.css";

const InitialDate = ({ orgUnitId, orgUnitLevel, endDate }) => {
  // const { auth } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch data
  useEffect(() => {
    // if (!auth?.username || !auth?.password || !endDate || !orgUnitId) return;

    // const authHeader =
    //   "Basic " + btoa(`${auth.username}:${auth.password}`);

    const startYear = 2026;
    const endYear = Number(endDate.split("-")[0]);

    const years = Array.from(
      { length: endYear - startYear + 1 },
      (_, i) => startYear + i
    );

    const yearset = years.join(";");

    const url = `https://dhis2.asia/laotracker/api/29/analytics/events/aggregate/AQBx2QVBvRH.json?dimension=ou:${orgUnitId}&dimension=pe:${yearset}&stage=d3iJyrWjNUy&displayProperty=NAME&totalPages=false&outputType=EVENT`;

    console.log("FETCH URL:", url);

    fetch(url, {
      headers: {
        // Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Auth failed");
        return res.json();
      })
      .then((data) => {
        setRows(data.rows || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setRows([]);
        setLoading(false);
      });
  // }, [auth, endDate, orgUnitId,orgUnitLevel]);
    }, [ endDate, orgUnitId,orgUnitLevel]);

  // 🔹 Aggregate by Year
  const yearMap = {};
console.log('level =', orgUnitLevel);

if (orgUnitLevel === 1) {
  rows.forEach((row) => {
    const year = row[0];        // "2025"
    const value = Number(row[2]); // "12" → 12
    yearMap[year] = (yearMap[year] || 0) + value;
  });
} else if (orgUnitLevel === 2) {
  rows.forEach((row) => {
    const year = row[1];        // "2025"
    const value = Number(row[2]); // "12" → 12
    yearMap[year] = (yearMap[year] || 0) + value;
  });
}

  // Convert to array + sort ascending
  const tableData = Object.keys(yearMap)
    .sort()
    .map((year) => ({
      year,
      count: yearMap[year],
    }));

  const total = tableData.reduce((sum, item) => sum + item.count, 0);

const chartData = tableData.map((d) => ({
  ...d,
  percent: Number(((d.count / total) * 100).toFixed(1)),
}));


  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );

  if (!chartData.length)
    return (
      <p style={{ textAlign: "center" }}>
        No data available for this selection.
      </p>
    );


  const chartConfig = {
  data: chartData,
  xField: "year",
  yField: "percent",
  height: 400,

  columnWidthRatio: 0.6,
  label: {
    position: "top",
    style: {
      fill: "#000",
      fontSize: 12,
    },
  },
  tooltip: {
    title: (datum) => `Year: ${datum.year}`,
    formatter: (datum) => ({
      name: "Percentage",
      value: `${datum.percent}%`,
    }),
  },
  xAxis: {
    label: {
      autoRotate: false,
    },
  },
};


  // 🔹 Table Columns
  const columns = [
    { title: "Year", dataIndex: "year" },
    { title: "Count", dataIndex: "count", align: "center" },
    {
      title: "Percentage",
      align: "center",
      render: (_, r) =>
        total > 0
          ? `${((r.count / total) * 100).toFixed(1)}%`
          : "0%",
    },
  ];

  return (
    <Row gutter={16}>
      <Col span={14}>
        <Card title="Yearly Distribution">
<Column {...chartConfig} />
        </Card>
      </Col>

      <Col span={10}>
        <Card title="Yearly Detail">
          <Table
            size="small"
            bordered
            pagination={false}
            rowKey="year"
            columns={columns}
            dataSource={tableData}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default InitialDate;
